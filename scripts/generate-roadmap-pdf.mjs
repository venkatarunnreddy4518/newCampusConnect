import fs from "node:fs";
import path from "node:path";

const PAGE = {
  width: 595,
  height: 842,
  marginLeft: 50,
  marginRight: 50,
  marginTop: 60,
  marginBottom: 60,
  indentSize: 20,
};

const STYLE = {
  h1: { font: "F2", size: 20, indent: 0, lineHeight: 28, gapBefore: 0 },
  h2: { font: "F2", size: 14, indent: 0, lineHeight: 20, gapBefore: 10 },
  h3: { font: "F2", size: 12, indent: 0, lineHeight: 18, gapBefore: 8 },
  p: { font: "F1", size: 12, indent: 0, lineHeight: 16, gapBefore: 0 },
  bullet: { font: "F1", size: 12, indent: 1, lineHeight: 16, gapBefore: 0 },
};

function pdfEscape(text) {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function estimateMaxChars(availableWidth, fontSize) {
  const avgCharWidth = fontSize * 0.52;
  return Math.max(20, Math.floor(availableWidth / avgCharWidth));
}

function wrapWithPrefixes(text, maxChars, firstPrefix = "", nextPrefix = "") {
  const words = text.trim().split(/\s+/);
  if (words.length === 0) return [firstPrefix.trimEnd()];

  const lines = [];
  let line = firstPrefix;
  let firstLine = true;

  const getPrefix = () => (firstLine ? firstPrefix : nextPrefix);

  const flush = () => {
    lines.push(line.trimEnd());
    firstLine = false;
    line = getPrefix();
  };

  for (const word of words) {
    const prefix = getPrefix();
    if (line.length === prefix.length) {
      if ((prefix + word).length > maxChars && prefix.length < maxChars) {
        lines.push((prefix + word).slice(0, maxChars).trimEnd());
        firstLine = false;
        line = getPrefix();
        continue;
      }
      line += word;
      continue;
    }

    const candidate = `${line} ${word}`;
    if (candidate.length > maxChars) {
      flush();
      line += word;
      continue;
    }

    line = candidate;
  }

  if (line.trim().length > 0) lines.push(line.trimEnd());
  return lines;
}

function parseMarkdown(markdown) {
  const blocks = [];
  const lines = markdown.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      blocks.push({ type: "spacer", height: 8 });
      continue;
    }

    if (trimmed.startsWith("# ")) {
      blocks.push({ type: "h1", text: trimmed.slice(2).trim() });
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h2", text: trimmed.slice(3).trim() });
      continue;
    }
    if (trimmed.startsWith("### ")) {
      blocks.push({ type: "h3", text: trimmed.slice(4).trim() });
      continue;
    }
    if (/^\-\s+/.test(trimmed)) {
      blocks.push({ type: "bullet", text: trimmed.replace(/^\-\s+/, "") });
      continue;
    }

    blocks.push({ type: "p", text: trimmed });
  }

  while (blocks.length > 0 && blocks[0].type === "spacer") blocks.shift();
  while (blocks.length > 0 && blocks.at(-1).type === "spacer") blocks.pop();

  return blocks;
}

function layoutLines(blocks) {
  const pages = [[]];

  let currentPageIndex = 0;
  let y = PAGE.height - PAGE.marginTop;
  let previousBlockType = null;

  const newPage = () => {
    pages.push([]);
    currentPageIndex += 1;
    y = PAGE.height - PAGE.marginTop;
  };

  const pushLine = ({ font, size, indent, lineHeight, text }) => {
    const x = PAGE.marginLeft + indent * PAGE.indentSize;
    const minY = PAGE.marginBottom + lineHeight;
    if (y < minY) newPage();

    pages[currentPageIndex].push({ font, size, x, y, text });
    y -= lineHeight;
  };

  for (const block of blocks) {
    if (block.type === "spacer") {
      y -= block.height;
      previousBlockType = "spacer";
      continue;
    }

    const style = STYLE[block.type] ?? STYLE.p;
    if (style.gapBefore > 0 && previousBlockType && previousBlockType !== "spacer") {
      y -= style.gapBefore;
    }

    const availableWidth =
      PAGE.width - PAGE.marginLeft - PAGE.marginRight - style.indent * PAGE.indentSize;
    const maxChars = estimateMaxChars(availableWidth, style.size);

    let lines = [];
    if (block.type === "bullet") {
      lines = wrapWithPrefixes(block.text, maxChars, "- ", "  ");
    } else {
      lines = wrapWithPrefixes(block.text, maxChars);
    }

    for (const line of lines) {
      pushLine({ ...style, text: line });
    }

    previousBlockType = block.type;
  }

  const date = new Date().toISOString().slice(0, 10);
  const total = pages.length;
  for (let i = 0; i < pages.length; i += 1) {
    pages[i].push({
      font: "F1",
      size: 10,
      x: PAGE.marginLeft,
      y: 30,
      text: `Generated: ${date}`,
    });
    pages[i].push({
      font: "F1",
      size: 10,
      x: PAGE.width - PAGE.marginRight - 90,
      y: 30,
      text: `Page ${i + 1} of ${total}`,
    });
  }

  return pages;
}

function buildPdf(pages) {
  const pageCount = pages.length;
  const maxObjNum = 4 + pageCount * 2;

  const objects = new Map();

  const kids = Array.from({ length: pageCount }, (_, i) => `${5 + i} 0 R`).join(" ");
  objects.set(1, `<< /Type /Catalog /Pages 2 0 R >>`);
  objects.set(2, `<< /Type /Pages /Kids [ ${kids} ] /Count ${pageCount} >>`);
  objects.set(3, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);
  objects.set(4, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`);

  for (let i = 0; i < pageCount; i += 1) {
    const pageObjNum = 5 + i;
    const contentObjNum = 5 + pageCount + i;

    objects.set(
      pageObjNum,
      [
        "<< /Type /Page",
        "/Parent 2 0 R",
        `/MediaBox [0 0 ${PAGE.width} ${PAGE.height}]`,
        "/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >>",
        `/Contents ${contentObjNum} 0 R`,
        ">>",
      ].join(" "),
    );

    const commands = [];
    commands.push("BT");
    for (const line of pages[i]) {
      const text = pdfEscape(line.text);
      commands.push(`/${line.font} ${line.size} Tf`);
      commands.push(`1 0 0 1 ${line.x} ${line.y} Tm`);
      commands.push(`(${text}) Tj`);
    }
    commands.push("ET");
    const streamData = `${commands.join("\n")}\n`;

    objects.set(
      contentObjNum,
      `<< /Length ${Buffer.byteLength(streamData, "utf8")} >>\nstream\n${streamData}endstream`,
    );
  }

  const header = Buffer.from("%PDF-1.4\n", "utf8");
  const parts = [header];
  const offsets = new Array(maxObjNum + 1).fill(0);

  let offset = header.length;
  for (let objNum = 1; objNum <= maxObjNum; objNum += 1) {
    const body = objects.get(objNum);
    if (!body) throw new Error(`Missing PDF object ${objNum}`);
    const objText = `${objNum} 0 obj\n${body}\nendobj\n`;
    const buf = Buffer.from(objText, "utf8");
    offsets[objNum] = offset;
    parts.push(buf);
    offset += buf.length;
  }

  const xrefStart = offset;
  const xrefLines = [];
  xrefLines.push(`xref\n0 ${maxObjNum + 1}\n`);
  xrefLines.push("0000000000 65535 f \n");
  for (let i = 1; i <= maxObjNum; i += 1) {
    xrefLines.push(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  }

  const trailer =
    `trailer\n<< /Size ${maxObjNum + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  parts.push(Buffer.from(xrefLines.join(""), "utf8"));
  parts.push(Buffer.from(trailer, "utf8"));

  return Buffer.concat(parts);
}

function main() {
  const root = process.cwd();
  const inputPath = process.argv[2]
    ? path.resolve(root, process.argv[2])
    : path.resolve(root, "ROADMAP_12_WEEK.md");
  const outputPath = process.argv[3]
    ? path.resolve(root, process.argv[3])
    : path.resolve(root, "ROADMAP_12_WEEK.pdf");

  const markdown = fs.readFileSync(inputPath, "utf8");
  const blocks = parseMarkdown(markdown);
  const pages = layoutLines(blocks);
  const pdf = buildPdf(pages);

  fs.writeFileSync(outputPath, pdf);
  // eslint-disable-next-line no-console
  console.log(`Wrote ${outputPath}`);
}

main();
