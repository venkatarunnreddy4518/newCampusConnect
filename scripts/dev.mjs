import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const services = [
  {
    label: "backend",
    port: 3001,
    url: "http://localhost:3001",
    args: [path.join(rootDir, "server", "index.mjs")],
  },
  {
    label: "frontend",
    port: 8080,
    url: "http://localhost:8080",
    args: [path.join(rootDir, "node_modules", "vite", "bin", "vite.js")],
  },
];

const children = [];
let shuttingDown = false;

function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("error", () => {
      resolve(false);
    });

    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function shutdown(signal = "SIGTERM") {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      try {
        child.kill(signal);
      } catch {
        // Ignore cleanup errors on shutdown.
      }
    }
  }
}

function run(service) {
  const child = spawn(process.execPath, service.args, {
    cwd: rootDir,
    stdio: "inherit",
  });

  child.on("error", (error) => {
    console.error(`[${service.label}] failed to start`, error);
    shutdown();
    process.exit(1);
  });

  child.on("exit", (code) => {
    shutdown();
    process.exit(code ?? 0);
  });

  children.push(child);
}

async function main() {
  let startedAny = false;

  for (const service of services) {
    if (await isPortInUse(service.port)) {
      console.log(`${service.label} already running on ${service.url}, reusing it.`);
      continue;
    }

    run(service);
    startedAny = true;
  }

  if (!startedAny) {
    console.log("CampusConnect is already running.");
    console.log("Frontend: http://localhost:8080");
    console.log("Backend:  http://localhost:3001");
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

await main();
