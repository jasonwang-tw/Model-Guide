# Claude Code 全域規則

## 版號與 README 管理

### 觸發條件

**只要專案內存在 `README.md`，以下任何異動都必須同步更新 README：**

- 新增功能、檔案、設定
- 修改、調整現有程式碼或邏輯
- 修正 bug
- 刪除功能、檔案
- 重構、搬移、重新命名
- 依賴套件或設定變更

> 無論變更大小，只要有動到程式碼就要更新。

### 每次異動時

**必須同步執行以下動作：**

1. **更新版號**
   - 遵循 [Semantic Versioning](https://semver.org/)：`MAJOR.MINOR.PATCH`
   - `PATCH`：修正 bug、小幅調整（例：1.0.0 → 1.0.1）
   - `MINOR`：新增功能、向下相容（例：1.0.0 → 1.1.0）
   - `MAJOR`：破壞性變更（例：1.0.0 → 2.0.0）
   - 版號更新位置：`README.md` 版本欄位、WordPress 主題/外掛的 `style.css` 或主程式 Plugin Header

2. **更新 README.md**
   - 在 `## Changelog` 區塊最上方新增一筆記錄，格式：
     ```
     ## [版號] - YYYY-MM-DD
     ### 類型（Added / Changed / Fixed / Removed）
     - 具體變更內容
     ```
   - 若 README.md 不存在，先執行 `/project-init` 初始化流程

3. **版號同步**
   - WordPress 外掛：同步更新主程式 Plugin Header 的 `Version:` 欄位
   - WordPress 主題：同步更新 `style.css` Theme Header 的 `Version:` 欄位

---

## 新專案自動偵測

**每次對話開始時**，靜默檢查當前工作目錄是否為新專案：

### 判斷為新專案的條件（符合任一即觸發）

- 根目錄**不存在** `README.md`
- 根目錄**不存在** `CHANGELOG.md`
- 存在程式碼檔案（`.php` / `.js` / `.ts` / `.py` 等），但無任何版本記錄

### 排除條件（以下情況不觸發）

- 目錄為空（使用者尚未開始，不打擾）
- 已有 `README.md` 或 `CHANGELOG.md`
- 目錄為 `node_modules`、`.git`、系統/工具目錄

### 觸發行為

偵測為新專案時，**主動告知使用者並自動執行** `project-init` 初始化流程，不需使用者手動輸入 `/project-init`。

---

> 手動初始化：輸入 `/project-init`

---

## Skills / Agents 自動調用

根據對話內容**主動判斷**並**自動調用**對應的 Skills 或 Agents，不需使用者手動輸入。

### 觸發對照表

| 對話情境 | 自動調用 |
|---------|---------|
| 遇到錯誤、異常行為、網站故障、需要查看 log | Agent: `debugger` |
| UI 跑版、樣式問題、RWD 排版異常、CSS 問題 | Agent: `ui-designer` |
| 任何平台開發完成、需要驗證品質 | Agent: `tester` |
| 新專案架構規劃、技術選型、開發引導 | Agent: `developer` |
| 開發或串接 REST API、WP REST API、WooCommerce API | Skill: `rest-api-integration` |
| WooCommerce 產品、訂單、購物車、結帳、Webhook 開發 | Skill: `woocommerce-dev` |
| 建立或修改 WordPress 外掛 | Skill: `wordpress-plugin-dev` |
| 建立或修改 WordPress 主題、模板檔案 | Skill: `wordpress-theme-dev` |
| PageSpeed 分數低、網站效能優化、Core Web Vitals | Skill: `wp-performance-optimization` |
| 開發 Chrome 插件 / Edge 插件 | Skill: `chrome-extension-dev` |
| 開發 iOS App | Skill: `ios-dev` |
| 開發 macOS App | Skill: `macos-dev` |
| 開發網站（電商/部落格，非 WordPress） | Skill: `website-dev` |
| WordPress 外掛/主題測試 | Skill: `test-wp` |
| Chrome 插件測試 | Skill: `test-chrome` |
| iOS / macOS App 測試 | Skill: `test-apple` |
| 網站（Next.js/Astro/Web）測試 | Skill: `test-web` |
| 開始新專案、專案缺少 README | Skill: `project-init` |
| 查看截圖、分析 UI、比對畫面差異（macOS） | Skill: `png` |

### 執行原則

- **不詢問，直接調用**：判斷明確時直接執行，不先問使用者是否要調用
- **可複合調用**：同一個任務若符合多個情境，同時調用所有相關的 Skills/Agents
- **調用後告知**：執行前簡短說明正在調用哪個 Skill/Agent 及原因（一句話即可）

---

## Current Session Usage 自動監控

### 工具

監控腳本：
- macOS：`~/Downloads/ClaudeProject/Model-Guide/claude_usage_monitor.js`
- Windows：`D:/user profile/jason.wang/Desktop/ClaudeCodeProject/claude_usage_monitor.js`
- exit code `2` = critical（≥95%）、exit code `0` = 正常或已重置

### 完整自動化流程

執行長時間任務時，採用 **main agent 監控 + subagent 執行** 架構：

1. **派發任務給 subagent（background）**
   - 使用 `Agent tool`（`run_in_background: true`）執行實際任務

2. **Main agent 每 1 分鐘執行監控**
   ```bash
   # macOS
   node ~/Downloads/ClaudeProject/Model-Guide/claude_usage_monitor.js
   # Windows
   node "D:/user profile/jason.wang/Desktop/ClaudeCodeProject/claude_usage_monitor.js"
   ```
   - exit code `0` → 繼續等待
   - exit code `2`（≥95%）→ 執行步驟 3

3. **達到 95% → 通知 subagent 暫停並總結**
   - 指示 subagent 停止目前工具呼叫
   - 以條列方式輸出：
     ```
     ## Current Session Usage 已達 95%，任務暫停

     ### 已完成
     - [具體完成的項目]

     ### 尚未完成
     - [具體剩餘的任務]
     ```

4. **每 30 分鐘監控重置狀態**
   - 執行同一監控腳本
   - `pct < 5%` 或 `status: no_active_block` → session 已重置 → 執行步驟 5

5. **重置後通知 subagent 接續任務**
   - 將「尚未完成」清單交給 subagent 繼續執行

6. **重複步驟 2–5，直到任務完全完成**

### 執行原則

- **全自動**：整個流程不需使用者介入或確認
- **無縫接續**：重置後直接從未完成清單繼續，不重新說明背景
- **立即停止**：達到 95% 時不再執行任何工具呼叫
