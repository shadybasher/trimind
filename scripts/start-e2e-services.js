#!/usr/bin/env node
/**
 * Epic 5 E2E Services Orchestrator
 * Starts all required services for full async pipeline testing:
 * 1. Next.js production server (port 3000)
 * 2. Python API service (port 8000)
 * 3. BullMQ Proxy Worker (background)
 */

const { spawn } = require("child_process");
const path = require("path");

const services = [];
let cleanupInProgress = false;

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(service, message, color = colors.reset) {
  console.log(`${color}[${service}]${colors.reset} ${message}`);
}

function startService(name, command, args, cwd, color) {
  log(name, `Starting: ${command} ${args.join(" ")}`, color);

  const service = spawn(command, args, {
    cwd: cwd || process.cwd(),
    stdio: "pipe",
    shell: true,
    env: { ...process.env },
  });

  service.stdout.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => log(name, line, color));
  });

  service.stderr.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => log(name, line, colors.red));
  });

  service.on("error", (error) => {
    log(name, `Error: ${error.message}`, colors.red);
  });

  service.on("exit", (code) => {
    if (!cleanupInProgress) {
      log(name, `Exited with code ${code}`, code === 0 ? colors.green : colors.red);
    }
  });

  services.push({ name, process: service });
  return service;
}

async function cleanup() {
  if (cleanupInProgress) return;
  cleanupInProgress = true;

  console.log("\n" + colors.yellow + "⏳ Shutting down all services..." + colors.reset);

  for (const { name, process } of services) {
    try {
      log(name, "Terminating...", colors.yellow);
      process.kill("SIGTERM");

      // Force kill after 5 seconds if not terminated
      setTimeout(() => {
        if (!process.killed) {
          log(name, "Force killing...", colors.red);
          process.kill("SIGKILL");
        }
      }, 5000);
    } catch (error) {
      log(name, `Cleanup error: ${error.message}`, colors.red);
    }
  }

  // Wait for all processes to exit
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log(colors.green + "✅ All services stopped" + colors.reset);
  process.exit(0);
}

// Graceful shutdown handlers
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);

async function main() {
  console.log(`
${colors.cyan}╔════════════════════════════════════════════════════╗
║  Epic 5 E2E Services Orchestrator                  ║
║  Starting full async pipeline test environment     ║
╚════════════════════════════════════════════════════╝${colors.reset}
`);

  // Service 1: Next.js Production Server
  log("Orchestrator", "Starting Next.js server...", colors.blue);
  startService("Next.js", "npm", ["start"], process.cwd(), colors.blue);

  // Wait for Next.js to be ready
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Service 2: Python API
  log("Orchestrator", "Starting Python API...", colors.green);
  const pythonApiPath = path.join(process.cwd(), "services", "python-api");
  startService(
    "Python-API",
    "python",
    ["-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
    pythonApiPath,
    colors.green
  );

  // Wait for Python API to be ready
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Service 3: BullMQ Proxy Worker
  log("Orchestrator", "Starting BullMQ worker...", colors.yellow);
  const bullmqPath = path.join(process.cwd(), "services", "bullmq-proxy");
  startService("BullMQ-Worker", "node", ["index.js"], bullmqPath, colors.yellow);

  // Wait for worker to connect
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log(`
${colors.green}╔════════════════════════════════════════════════════╗
║  ✅ All Services Running                           ║
╠════════════════════════════════════════════════════╣
║  Next.js:      http://localhost:3000               ║
║  Python API:   http://localhost:8000               ║
║  BullMQ Worker: Connected to Redis                 ║
╠════════════════════════════════════════════════════╣
║  Press Ctrl+C to stop all services                 ║
╚════════════════════════════════════════════════════╝${colors.reset}
`);

  // Keep the orchestrator running
  await new Promise(() => {});
}

main().catch((error) => {
  console.error(colors.red + `Fatal error: ${error.message}` + colors.reset);
  cleanup();
});
