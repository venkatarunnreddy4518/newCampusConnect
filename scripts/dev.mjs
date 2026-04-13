import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(rootDir, ".env") });

const backendPort = Number(process.env.CAMPUSCONNECT_API_PORT || 3002);
const frontendPort = Number(process.env.CAMPUSCONNECT_WEB_PORT || 8080);

const services = [
  {
    label: "backend",
    port: backendPort,
    url: `http://localhost:${backendPort}`,
    healthUrl: `http://127.0.0.1:${backendPort}/api/health`,
    expectedService: "campusconnect-backend",
    args: [path.join(rootDir, "server", "index.mjs")],
  },
  {
    label: "frontend",
    port: frontendPort,
    url: `http://localhost:${frontendPort}`,
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

async function inspectService(service) {
  if (!(await isPortInUse(service.port))) {
    return { state: "available" };
  }

  if (!service.healthUrl) {
    return { state: "ready" };
  }

  try {
    const response = await fetch(service.healthUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return {
        state: "conflict",
        reason: `${service.label} is using ${service.url}, but ${service.healthUrl} returned ${response.status}.`,
      };
    }

    const payload = await response.json();
    if (payload?.service === service.expectedService) {
      return { state: "ready" };
    }

    return {
      state: "conflict",
      reason: `${service.label} is using ${service.url}, but it does not look like the CampusConnect service.`,
    };
  } catch (error) {
    return {
      state: "conflict",
      reason: `${service.label} is using ${service.url}, but the existing process could not be verified (${error instanceof Error ? error.message : String(error)}).`,
    };
  }
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
    env: {
      ...process.env,
      CAMPUSCONNECT_API_PORT: String(backendPort),
      CAMPUSCONNECT_WEB_PORT: String(frontendPort),
      ...(service.label === "backend" ? { PORT: String(backendPort) } : {}),
    },
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
    const existingService = await inspectService(service);

    if (existingService.state === "ready") {
      console.log(`${service.label} already running on ${service.url}, reusing it.`);
      continue;
    }

    if (existingService.state === "conflict") {
      console.error(existingService.reason);
      process.exit(1);
    }

    run(service);
    startedAny = true;
  }

  if (!startedAny) {
    console.log("CampusConnect is already running.");
    console.log(`Frontend: http://localhost:${frontendPort}`);
    console.log(`Backend:  http://localhost:${backendPort}`);
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

await main();
