---
name: test-chrome
description: Chrome 插件（Manifest V3）的完整 QA 測試流程。涵蓋 manifest 結構驗證、MV3 相容性、CSP 安全性、權限最小化、console.log 殘留掃描，以及自動化/手動測試指引。由 tester agent 自動調用，或手動用於 Chrome 插件測試。
---

# Chrome 插件 QA 測試流程

## 第一階段：靜態分析

### 1. Manifest 驗證

```bash
# 確認 manifest_version 為 3
node -e "
const m = require('./manifest.json');
console.log('manifest_version:', m.manifest_version);
console.log('name:', m.name);
console.log('version:', m.version);
console.log('permissions:', m.permissions);
console.log('host_permissions:', m.host_permissions);
"
```

檢查項目：
- `manifest_version` 必須為 `3`（MV3）
- `name`、`version`、`description` 欄位完整
- `icons` 有 16/48/128px 三種尺寸
- `background.service_worker` 存在（非 `background.scripts`）

### 2. 權限最小化

```bash
node -e "
const m = require('./manifest.json');
const risky = ['tabs','<all_urls>','browsingData','management','debugger','nativeMessaging'];
const found = (m.permissions || []).filter(p => risky.includes(p));
const hostAll = (m.host_permissions || []).filter(h => h.includes('<all_urls>') || h === '*://*/*');
if (found.length) console.log('⚠️ 高風險權限:', found);
if (hostAll.length) console.log('⚠️ 全站 host 權限:', hostAll);
"
```

- 確認每個 `permissions` 在程式碼中有實際使用
- `host_permissions` 盡量限定特定網域，避免 `<all_urls>`

### 3. MV3 相容性

```bash
# 不允許執行遠端程式碼
grep -rn "eval\b" --include="*.js" .
grep -rn "new Function(" --include="*.js" .
grep -rn "innerHTML\s*=" --include="*.js" .  # 注意 XSS 風險

# Background 不應使用持久化 API（MV2 殘留）
grep -rn "chrome\.extension\.\|chrome\.browserAction\." --include="*.js" .

# 確認使用 chrome.action（MV3）而非 chrome.browserAction（MV2）
grep -rn "chrome\.browserAction" --include="*.js" .
```

### 4. 安全性掃描

```bash
# XSS 風險
grep -rn "innerHTML\s*=\|outerHTML\s*=\|document\.write" --include="*.js" .

# 硬編碼敏感資料
grep -rn "api_key\|apikey\|secret\|password\|token" --include="*.js" -i .

# console.log 殘留
grep -rn "console\.log\|console\.debug" --include="*.js" .
```

### 5. Storage 使用檢查

- 敏感資料（Token、密碼）不應存入 `chrome.storage.sync`，應用 `chrome.storage.local` + 加密
- `chrome.storage.sync` 容量限制（QUOTA_BYTES: 102,400 bytes）注意大型資料

### 6. Content Security Policy

```bash
# 確認 manifest 的 CSP 設定
node -e "
const m = require('./manifest.json');
console.log('CSP:', m.content_security_policy || '（未設定，使用預設）');
"
```

---

## 第二階段：執行測試

### 自動化測試（若有 Puppeteer/Playwright）

```bash
npx puppeteer --version 2>/dev/null && echo "Puppeteer 可用" || echo "無自動化工具"

# 執行測試腳本（若存在）
[ -f "test/extension.test.js" ] && node test/extension.test.js
[ -f "package.json" ] && npm test 2>/dev/null
```

### 手動測試清單

自動化工具不可用時，提供以下清單供使用者執行：

```
□ 開啟 chrome://extensions/ → 啟用開發人員模式
□ 點擊「載入未封裝項目」→ 選擇插件資料夾
□ 確認插件圖示出現在工具列（無錯誤圖示）
□ 開啟 DevTools → Console → 確認無紅色錯誤
□ 點擊 Popup → 確認 UI 正常顯示
□ 前往目標網站 → 確認 Content Script 正常執行
□ 開啟 chrome://extensions/ → 點擊「Service Worker」→ 確認 Background 無錯誤
□ 測試 Options 頁面（若有）
□ 儲存設定後重新載入插件 → 確認設定持久化
```

### 封裝測試

```bash
# 確認打包不含不必要檔案
ls -la
# 應排除：.git/, node_modules/, *.map, test/, .env
```
