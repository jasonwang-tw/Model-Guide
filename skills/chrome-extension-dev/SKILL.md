---
name: chrome-extension-dev
description: Chrome 插件開發指南（Manifest V3）。涵蓋插件架構、Background Service Worker、Content Script、Popup/Options 頁面、Chrome APIs、權限設定、發布流程。當開發 Chrome 插件或 Edge 插件時使用。
---

# Chrome 插件開發指南（Manifest V3）

> **重要**：Chrome 已強制使用 Manifest V3（MV3），MV2 將逐步停用。本指南以 MV3 為標準。

## 專案結構

```
my-extension/
├── manifest.json          # 插件設定檔（必須）
├── background.js          # Service Worker（背景執行）
├── content.js             # 注入網頁的腳本
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css          # 由 Tailwind + SCSS 編譯產出
├── options/
│   ├── options.html
│   └── options.js
├── src/
│   └── styles/
│       ├── popup.scss     # 自訂樣式（以 SCSS 撰寫）
│       └── content.scss   # Content script 樣式
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── _locales/              # 多語系（可選）
    └── zh_TW/
        └── messages.json
```

## CSS 工具鏈設定

### 既有專案：優先偵測現有 UI 工具

**新增功能至既有專案前，先執行以下偵測，延續現有工具；若無則使用預設（Tailwind + PostCSS + SCSS）。**

```bash
# 1. 檢查 package.json 已安裝的 UI 框架
cat package.json | grep -E "tailwindcss|bootstrap|bulma|uikit|foundation|daisyui|chakra|antd|mui"

# 2. 檢查 HTML / JS 是否有 CDN 引入
grep -r "cdn.jsdelivr\|unpkg.com\|bootstrap\|tailwind\|bulma" --include="*.html" --include="*.js" .

# 3. 檢查現有 CSS class 風格
grep -r 'class="' popup/ --include="*.html" | head -5
```

| 偵測結果 | 做法 |
|---------|------|
| 找到 `tailwindcss` | 延續 Tailwind，自訂部分以 SCSS 撰寫 |
| 找到 `bootstrap` | 延續 Bootstrap，自訂部分以 SCSS 撰寫並編譯 |
| 找到其他框架（bulma / uikit 等） | 延續該框架，自訂以 SCSS 撰寫 |
| 未找到任何框架 | ↓ 使用以下預設設定 |

---

> **預設原則（新專案 / 無既有 UI 框架）**：所有樣式一律透過 TailwindCSS 撰寫；自訂元件以 SCSS 撰寫並編譯，不直接寫純 CSS。

```bash
npm install -D tailwindcss postcss autoprefixer sass
npx tailwindcss init
```

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./popup/**/*.html', './options/**/*.html'],
  theme: { extend: {} },
  plugins: []
}
```

```js
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

```scss
// src/styles/popup.scss
// 1. 引入 Tailwind 指令
@tailwind base;
@tailwind components;
@tailwind utilities;

// 2. 自訂元件以 SCSS 撰寫（不用純 CSS）
@layer components {
  .ext-card {
    @apply rounded-lg border border-gray-200 p-4 shadow-sm;

    &__title {
      @apply text-sm font-semibold text-gray-800;
    }

    &__body {
      @apply mt-2 text-xs text-gray-600;
    }
  }
}
```

```json
// package.json scripts
{
  "scripts": {
    "build:css": "sass src/styles/popup.scss | postcss -o popup/popup.css",
    "watch:css": "sass --watch src/styles/popup.scss | postcss -o popup/popup.css",
    "build": "npm run build:css"
  }
}
```

## manifest.json

```json
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0.0",
  "description": "插件描述",
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://*.example.com/*"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["https://*.example.com/*"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "options_page": "options/options.html",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

## Background Service Worker

```js
// background.js
// MV3 使用 Service Worker，不能用 window 物件，不能持久化

// 監聽插件安裝/更新
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    console.log('插件已安裝');
    // 設定預設值
    chrome.storage.sync.set({ enabled: true, theme: 'light' });
  }
});

// 監聽來自 popup 或 content script 的訊息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_DATA') {
    // 非同步處理需 return true
    fetchData(message.url).then(data => sendResponse({ success: true, data }));
    return true;
  }
});

// 監聽 Tab 更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.startsWith('https://')) {
    // 注入腳本（需要 scripting 權限）
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => console.log('腳本已注入')
    });
  }
});

// Context Menu
chrome.contextMenus.create({
  id: 'myAction',
  title: '執行動作',
  contexts: ['selection']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'myAction') {
    console.log('選取文字：', info.selectionText);
  }
});
```

## Content Script

```js
// content.js — 注入到目標網頁執行

// 讀取頁面內容
const pageTitle = document.title;
const mainContent = document.querySelector('main')?.innerText;

// 修改 DOM
const banner = document.createElement('div');
banner.id = 'my-extension-banner';
banner.textContent = '插件已啟用';
document.body.prepend(banner);

// 與 background.js 通訊
chrome.runtime.sendMessage({ type: 'GET_DATA', url: location.href }, response => {
  if (response.success) {
    console.log('取得資料：', response.data);
  }
});

// 監聽來自 background 的訊息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_UI') {
    document.body.style.backgroundColor = message.color;
    sendResponse({ done: true });
  }
});

// MV3：無法直接存取 window.fetch（需透過 background）
// 改用 chrome.runtime.sendMessage 請 background 代為請求
```

## Popup

```js
// popup.js

document.addEventListener('DOMContentLoaded', async () => {
  // 讀取設定
  const { enabled, theme } = await chrome.storage.sync.get(['enabled', 'theme']);

  const toggle = document.getElementById('toggle');
  toggle.checked = enabled;

  toggle.addEventListener('change', async () => {
    await chrome.storage.sync.set({ enabled: toggle.checked });

    // 傳訊息給目前頁面的 content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE', enabled: toggle.checked });
  });

  // 對目前頁面執行腳本
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.title
  });
  document.getElementById('page-title').textContent = results[0].result;
});
```

## Storage API

```js
// sync：跨裝置同步（容量限制較小）
await chrome.storage.sync.set({ key: 'value' });
const data = await chrome.storage.sync.get(['key']);

// local：本機儲存（容量較大）
await chrome.storage.local.set({ largeData: blob });

// 監聽變更
chrome.storage.onChanged.addListener((changes, area) => {
  for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(`${area}.${key}: ${oldValue} → ${newValue}`);
  }
});
```

## 常用 Chrome APIs

```js
// Tabs
const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
await chrome.tabs.create({ url: 'https://example.com' });
await chrome.tabs.update(tabId, { url: 'https://example.com' });

// Notifications
chrome.notifications.create({
  type: 'basic',
  iconUrl: 'icons/icon48.png',
  title: '通知標題',
  message: '通知內容'
});

// Alarms（定時任務）
chrome.alarms.create('myAlarm', { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'myAlarm') {
    // 執行定時任務
  }
});

// Badge
chrome.action.setBadgeText({ text: '5' });
chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });

// 開啟 Options 頁面
chrome.runtime.openOptionsPage();
```

## 權限說明

| 權限 | 用途 |
|------|------|
| `storage` | 讀寫 chrome.storage |
| `activeTab` | 存取當前分頁（不需 host_permissions） |
| `scripting` | 動態注入腳本 |
| `tabs` | 讀取分頁資訊 |
| `notifications` | 顯示系統通知 |
| `alarms` | 設定定時任務 |
| `contextMenus` | 右鍵選單 |
| `cookies` | 讀寫 Cookie |

## MV3 重要限制

- **Service Worker 非持久化**：閒置後會被終止，不要依賴全域變數存狀態，改用 `chrome.storage`
- **不能用 `XMLHttpRequest`**：改用 `fetch()`
- **不能執行遠端程式碼**：所有 JS 必須打包在插件內
- **CSP 限制**：`eval()` 與 `innerHTML` 用法受限

## 發布流程

1. 至 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. 建立 ZIP：排除 `.git`、`node_modules`
3. 填寫商店資訊、截圖（至少 1280×800）
4. 審查時間約 1–3 個工作天

## 本地測試

1. 開啟 `chrome://extensions/`
2. 開啟右上角「開發人員模式」
3. 點擊「載入未封裝項目」→ 選擇插件資料夾
4. 修改後點擊插件卡片上的重新整理圖示
