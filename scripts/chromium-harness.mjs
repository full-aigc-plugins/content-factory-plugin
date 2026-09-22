import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/** Resolve an installed Chromium-family browser without downloading one dynamically. */
export function findChromiumExecutable() {
  return [
    process.env.CONTENT_FACTORY_CHROMIUM,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ].find(candidate => candidate && existsSync(candidate));
}

/** Keep the default above the observed 10-second Linux cold-start tail while allowing slower runners to opt in. */
export function resolveChromiumStartupTimeout(env = process.env) {
  const configured = env.CONTENT_FACTORY_CHROMIUM_STARTUP_TIMEOUT_MS;
  if (typeof configured !== "string" || !/^\d+$/u.test(configured)) {
    return 30_000;
  }
  const timeoutMs = Number(configured);
  return Number.isSafeInteger(timeoutMs) && timeoutMs > 0 ? timeoutMs : 30_000;
}

function waitForDevTools(child) {
  return new Promise((resolve, reject) => {
    let stderr = "";
    const timeout = setTimeout(
      () => reject(new Error(`Chromium startup timed out: ${stderr}`)),
      resolveChromiumStartupTimeout()
    );
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", chunk => {
      stderr += chunk;
      const match = stderr.match(/DevTools listening on (ws:\/\/\S+)/u);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
    child.once("exit", code => {
      clearTimeout(timeout);
      reject(new Error(`Chromium exited before DevTools was ready (${code}): ${stderr}`));
    });
    child.once("error", error => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function findPageEndpoint(browserEndpoint) {
  const browserUrl = new URL(browserEndpoint);
  const endpoint = `http://${browserUrl.host}/json/list`;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const response = await fetch(endpoint);
    const targets = await response.json();
    const page = targets.find(target => target.type === "page");
    if (page?.webSocketDebuggerUrl) {
      return page.webSocketDebuggerUrl;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error("Chromium did not expose a page target");
}

async function connect(endpoint) {
  const socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) {
      return;
    }
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) {
      reject(new Error(message.error.message));
      return;
    }
    resolve(message.result);
  });
  return {
    close: () => socket.close(),
    send(method, params = {}) {
      const id = ++sequence;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    }
  };
}

export async function withChromiumPage(input, operation) {
  const executable = findChromiumExecutable();
  if (!executable) {
    throw new Error("No supported local Chromium browser was found");
  }
  const profile = await mkdtemp(path.join(os.tmpdir(), "content-factory-chromium-"));
  const child = spawn(executable, [
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    "--hide-scrollbars",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "about:blank"
  ], { stdio: ["ignore", "ignore", "pipe"] });
  let connection;
  try {
    const browserEndpoint = await waitForDevTools(child);
    connection = await connect(await findPageEndpoint(browserEndpoint));
    await connection.send("Page.enable");
    await connection.send("Runtime.enable");
    await connection.send("Emulation.setDeviceMetricsOverride", {
      width: input.width,
      height: input.height,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: input.width,
      screenHeight: input.height
    });
    const tree = await connection.send("Page.getFrameTree");
    await connection.send("Page.setDocumentContent", {
      frameId: tree.frameTree.frame.id,
      html: input.html
    });
    await connection.send("Runtime.evaluate", {
      expression: "new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
      awaitPromise: true
    });
    const page = {
      async evaluate(expression) {
        const response = await connection.send("Runtime.evaluate", {
          expression,
          returnByValue: true,
          awaitPromise: true
        });
        if (response.exceptionDetails) {
          throw new Error(response.exceptionDetails.text);
        }
        return response.result.value;
      },
      async screenshot() {
        const response = await connection.send("Page.captureScreenshot", {
          format: "png",
          fromSurface: true,
          captureBeyondViewport: false
        });
        return Buffer.from(response.data, "base64");
      }
    };
    return await operation(page);
  } finally {
    connection?.close();
    if (child.exitCode === null) {
      child.kill("SIGTERM");
      await once(child, "exit");
    }
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}
