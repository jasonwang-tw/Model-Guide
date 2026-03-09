---
name: project-init
description: 新建專案初始化指南。建立標準 README.md 與版號結構（從 1.0.0 開始）。若為 WordPress 主題或 WooCommerce/WordPress 外掛，詢問是否加入開發者資訊。當使用者開始新專案、或專案缺少 README 時使用。
---

# 專案初始化流程

依序執行以下步驟，**不要跳過任何步驟**：

## 步驟 1：偵測專案類型

讀取目前工作目錄的檔案，判斷專案類型：

- **WordPress 外掛**：根目錄有 `.php` 主檔案且包含 `Plugin Name:` header
- **WooCommerce 外掛**：同上，且程式碼中有 `WooCommerce` 或 `woocommerce` 依賴
- **WordPress 主題**：根目錄有 `style.css` 且包含 `Theme Name:` header
- **一般專案**：以上皆非

## 步驟 2：詢問開發者資訊（僅限 WP 主題 / WP 外掛 / WooCommerce 外掛）

若偵測為 WordPress 主題或外掛，詢問使用者：

> 是否要在 README 中加入開發者資訊？（是/否）

若回答**是**，加入以下資訊：

```
開發者：Jason
網站：https://jasonwang.tw
Buy me a coffee：https://buymeacoffee.com/jasonwang0052
```

若回答**否**或為一般專案，跳過此區塊。

## 步驟 3：建立 README.md

依據專案類型產生對應的 README.md，初始版號為 `1.0.0`。

---

### WordPress 外掛 README 範本

```markdown
# {外掛名稱}

{一句話描述這個外掛的用途}

## 版本

**目前版本：1.0.0**

## 需求

- WordPress 5.0+
- PHP 7.4+

## 安裝方式

1. 下載並解壓縮至 `/wp-content/plugins/`
2. 至 WordPress 後台「外掛」頁面啟用

## 功能說明

{說明外掛主要功能}

## 開發者資訊（若使用者選擇加入）

| | |
|---|---|
| 開發者 | Jason |
| 網站 | https://jasonwang.tw |
| Buy me a coffee | https://buymeacoffee.com/jasonwang0052 |

## Changelog

## [1.0.0] - {今日日期}
### Added
- 初始版本發布
```

---

### WordPress 主題 README 範本

```markdown
# {主題名稱}

{一句話描述這個主題的用途與設計風格}

## 版本

**目前版本：1.0.0**

## 需求

- WordPress 5.0+
- PHP 7.4+

## 安裝方式

1. 上傳主題資料夾至 `/wp-content/themes/`
2. 至 WordPress 後台「外觀」→「主題」啟用

## 功能說明

{說明主題支援的功能，例如：Custom Logo、Widgets、選單位置等}

## 開發者資訊（若使用者選擇加入）

| | |
|---|---|
| 開發者 | Jason |
| 網站 | https://jasonwang.tw |
| Buy me a coffee | https://buymeacoffee.com/jasonwang0052 |

## Changelog

## [1.0.0] - {今日日期}
### Added
- 初始版本發布
```

---

### 一般專案 README 範本

```markdown
# {專案名稱}

{一句話描述這個專案的用途}

## 版本

**目前版本：1.0.0**

## 安裝 / 使用方式

{說明如何安裝或執行此專案}

## 功能說明

{說明主要功能}

## Changelog

## [1.0.0] - {今日日期}
### Added
- 初始版本發布
```

---

## 步驟 4：更新 Plugin / Theme Header（WP 專案）

若為 WordPress 外掛，確認主程式 PHP 檔案的 Plugin Header 包含版本欄位：

```php
/**
 * Plugin Name: {外掛名稱}
 * Version:     1.0.0
 * ...
 */
```

若為 WordPress 主題，確認 `style.css` Theme Header 包含版本欄位：

```css
/*
Theme Name: {主題名稱}
Version:    1.0.0
...
*/
```

## 步驟 5：完成確認

輸出以下摘要：

```
✅ 專案初始化完成

- 專案類型：{類型}
- 版號：1.0.0
- README.md：已建立
- 開發者資訊：已加入 / 未加入
```
