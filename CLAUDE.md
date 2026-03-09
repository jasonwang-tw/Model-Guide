# Claude Code 全域規則

## 版號與 README 管理

### 每次程式碼調整 / 修正 / 更新時

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
