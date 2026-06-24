#!/usr/bin/env node
/**
 * Automates GitHub App creation via the Manifest flow.
 * Opens your browser, waits for the callback, exchanges the code for
 * clientId/clientSecret, and writes them to .env automatically.
 *
 * Usage: node scripts/setup-github-app.mjs
 */

import http from "http";
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, "../.env");
const PORT = 3333;
const APP_URL = "http://localhost:3005";
const CALLBACK_URL = `http://localhost:${PORT}/callback`;

const manifest = {
  name: `OpenFund-${Date.now()}`,
  url: APP_URL,
  hook_attributes: { url: `${APP_URL}/api/webhooks/github`, active: false },
  redirect_url: CALLBACK_URL,
  callback_urls: [`${APP_URL}/api/auth/callback/github`],
  description: "OpenFund – GitHub-native crowdfunding powered by Stellar",
  public: false,
  default_events: [],
  default_permissions: {
    contents: "read",
    metadata: "read",
    emails: "read",
  },
};

const HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Setting up OpenFund GitHub App...</title>
  <style>
    body { font-family: system-ui; display:flex; flex-direction:column; align-items:center;
           justify-content:center; height:100vh; margin:0; background:#0f172a; color:#e2e8f0; }
    h2 { color:#38bdf8; } p { color:#94a3b8; }
  </style>
</head>
<body>
  <h2>Redirecting to GitHub...</h2>
  <p>You'll be asked to create the OpenFund app. Click <strong>"Create GitHub App"</strong>.</p>
  <form id="f" action="https://github.com/settings/apps/new" method="post">
    <input type="hidden" name="manifest" value='${JSON.stringify(manifest)}' />
  </form>
  <script>document.getElementById("f").submit();</script>
</body>
</html>`;

async function exchangeCode(code) {
  const res = await fetch(
    `https://api.github.com/app-manifests/${code}/conversions`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "openfund-setup",
      },
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${body}`);
  }
  return res.json();
}

function updateEnv(clientId, clientSecret) {
  let env = readFileSync(ENV_PATH, "utf8");
  env = env
    .replace(/^GITHUB_CLIENT_ID=.*/m, `GITHUB_CLIENT_ID="${clientId}"`)
    .replace(/^GITHUB_CLIENT_SECRET=.*/m, `GITHUB_CLIENT_SECRET="${clientSecret}"`);
  writeFileSync(ENV_PATH, env);
  console.log("\n✅  .env updated:");
  console.log(`   GITHUB_CLIENT_ID="${clientId}"`);
  console.log(`   GITHUB_CLIENT_SECRET="${clientSecret.slice(0, 8)}…"`);
}

function openBrowser(url) {
  const platform = process.platform;
  try {
    if (platform === "darwin") execSync(`open "${url}"`);
    else if (platform === "win32") execSync(`start "" "${url}"`);
    else execSync(`xdg-open "${url}"`);
  } catch {
    console.log(`\n  Open this URL manually: ${url}\n`);
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(HTML);
    return;
  }

  if (url.pathname === "/callback") {
    const code = url.searchParams.get("code");
    if (!code) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Missing code parameter");
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<!DOCTYPE html><html><head><style>
      body{font-family:system-ui;display:flex;flex-direction:column;align-items:center;
           justify-content:center;height:100vh;margin:0;background:#0f172a;color:#e2e8f0;}
      h2{color:#22c55e;} p{color:#94a3b8;}
    </style></head><body>
      <h2>✓ GitHub App created!</h2>
      <p>Credentials written to .env. You can close this tab.</p>
      <p style="margin-top:1rem;font-size:0.9em;">Go back to <a href="${APP_URL}" style="color:#38bdf8">${APP_URL}</a></p>
    </body></html>`);

    try {
      console.log("\n⏳  Exchanging code for credentials...");
      const data = await exchangeCode(code);
      updateEnv(data.client_id, data.client_secret);
      console.log("\n🚀  Done! Restart the dev server to pick up new credentials:");
      console.log("   kill the running npm run dev, then run it again\n");
    } catch (err) {
      console.error("\n❌  Failed to exchange code:", err.message);
    } finally {
      server.close();
    }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║     OpenFund – GitHub App Setup            ║
╚════════════════════════════════════════════╝

Opening your browser to GitHub...
→ Click "Create GitHub App" on the page that opens.
  That's the only manual step.

Listening for callback on http://localhost:${PORT}
`);
  openBrowser(`http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌  Port ${PORT} is already in use. Kill whatever is running on it and retry.\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
