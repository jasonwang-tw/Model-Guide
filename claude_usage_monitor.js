#!/usr/bin/env node
/**
 * Claude Code Usage Monitor
 * 直接呼叫 Anthropic OAuth API，取得伺服器端真實用量。
 * 不依賴任何額外套件（純 Node.js 標準庫）。
 */

const https = require("https");
const fs = require("fs");
const os = require("os");
const path = require("path");

const WARN_THRESHOLD = 95;  // 95% 警戒線
const RESET_THRESHOLD = 5;  // 5% 以下視為已重置
const API_URL = "https://api.anthropic.com/api/oauth/usage";

// statusline.sh 快取路徑（Windows bash /tmp → AppData\Local\Temp）
const STATUSLINE_CACHE = path.join(
  process.env.TEMP || process.env.TMP || os.tmpdir(),
  "claude",
  "statusline-usage-cache.json"
);

function getOAuthToken() {
  // 1. 環境變數
  const envToken = process.env.CLAUDE_CODE_OAUTH_TOKEN;
  if (envToken) return envToken;

  // 2. ~/.claude/.credentials.json
  const credsPath = path.join(os.homedir(), ".claude", ".credentials.json");
  if (fs.existsSync(credsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(credsPath, "utf8"));
      const token = data?.claudeAiOauth?.accessToken;
      if (token) return token;
    } catch (_) {}
  }

  return null;
}

function fetchUsage(token) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "anthropic-beta": "oauth-2025-04-20",
        "User-Agent": "claude-code/2.1.34",
      },
    };

    https.get(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${raw}`));
          return;
        }
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    }).on("error", reject);
  });
}

function readStatuslineCache() {
  try {
    const raw = fs.readFileSync(STATUSLINE_CACHE, "utf8");
    const j = JSON.parse(raw);
    if (j?.five_hour?.utilization !== undefined) return j;
  } catch (_) {}
  return null;
}

async function checkUsage() {
  const token = getOAuthToken();
  if (!token) {
    return { status: "no_token", pct: 0, weekly_pct: 0 };
  }

  let data;
  try {
    data = await fetchUsage(token);
  } catch (e) {
    // 429 或網路錯誤時，改讀 statusline 快取
    const cached = readStatuslineCache();
    if (cached) {
      data = cached;
    } else {
      return { status: `error: ${e.message}`, pct: 0, weekly_pct: 0 };
    }
  }

  // utilization 是整數百分比（例：8 = 8%）
  const pct = data?.five_hour?.utilization ?? 0;
  const weekly_pct = data?.seven_day?.utilization ?? 0;
  const resets_at = data?.five_hour?.resets_at ?? "";
  const weekly_resets_at = data?.seven_day?.resets_at ?? "";

  let status = "ok";
  if (pct >= WARN_THRESHOLD) status = "critical";
  else if (pct < RESET_THRESHOLD) status = "reset";

  return { status, pct, weekly_pct, resets_at, weekly_resets_at };
}

(async () => {
  const result = await checkUsage();
  console.log(JSON.stringify(result, null, 2));

  const { status, pct, weekly_pct } = result;

  if (status === "no_token") {
    console.error("\n[ERROR] 找不到 OAuth token，請確認 ~/.claude/.credentials.json 存在");
    process.exit(1);
  } else if (status.startsWith("error")) {
    console.error(`\n[ERROR] API 呼叫失敗：${status}`);
    process.exit(1);
  } else if (status === "critical") {
    console.log(`\n[CRITICAL] 5小時用量：${pct}% — 已達 95%，請暫停任務！`);
    process.exit(2);
  } else if (status === "reset") {
    console.log(`\n[RESET] 5小時用量：${pct}% — session 已重置`);
    process.exit(0);
  } else {
    console.log(`\n[OK] 5小時用量：${pct}%　週用量：${weekly_pct}%`);
    process.exit(0);
  }
})();
