# Model-Guide

Claude Code 與 Cursor 的自訂 Agents 與 Skills 設定集合，針對 WordPress 與網頁開發工作流程優化。

## 結構

```
Model-Guide/
├── CLAUDE.md                         # 全域規則（版號/README 自動管理）
├── claude_usage_monitor.js           # Current session usage 監控腳本（Node.js）
├── agents/
│   ├── debugger.md                   # 自動除錯專家
│   ├── developer.md                  # 專案架構規劃與開發引導
│   ├── tester.md                     # 跨平台 QA 測試統籌
│   └── ui-designer.md                # UI 介面設計專家
└── skills/
    ├── chrome-extension-dev/         # Chrome 插件開發
    ├── ios-dev/                      # iOS App 開發
    ├── macos-dev/                    # macOS App 開發
    ├── project-init/                 # 新專案初始化
    ├── rest-api-integration/         # REST API 串接
    ├── test-apple/                   # iOS / macOS 測試
    ├── test-chrome/                  # Chrome 插件測試
    ├── test-web/                     # 網站測試（Next.js/Astro/Web）
    ├── test-wp/                      # WordPress 測試
    ├── website-dev/                  # 網站開發（電商/部落格）
    ├── woocommerce-dev/              # WooCommerce 開發
    ├── wordpress-plugin-dev/         # WordPress 外掛開發
    ├── wordpress-theme-dev/          # WordPress 主題開發
    ├── png/                          # 桌面截圖讀取（macOS）
    ├── service-impact-assessment/    # 服務安裝/刪除影響評估
    └── wp-performance-optimization/  # WordPress 效能優化
```

## Agents

| Agent | 說明 |
|-------|------|
| `debugger` | 專業除錯專家，自動檢查日誌、分析系統狀態、排查錯誤與異常行為 |
| `developer` | 專案架構規劃與開發引導，支援 Chrome 插件、WP、網站、iOS、macOS |
| `tester` | 跨平台 QA 測試統籌，自動偵測平台並調用對應測試 Skill（WP/Chrome/iOS/macOS/Web） |
| `ui-designer` | UI 介面設計專家，修復跑版問題，支援 desktop / tablet / mobile / APP |

## Skills

| Skill | 說明 |
|-------|------|
| `chrome-extension-dev` | Chrome 插件開發（MV3），涵蓋 Service Worker、Content Script、Chrome APIs |
| `ios-dev` | iOS App 開發，涵蓋 SwiftUI、MVVM、網路請求、SwiftData、App Store 發布 |
| `macos-dev` | macOS App 開發，涵蓋 SwiftUI for macOS、選單列 App、AppKit 整合 |
| `project-init` | 新專案初始化，自動建立 README 與版號；WP 主題/外掛可加入開發者資訊 |
| `rest-api-integration` | REST API 串接整合，涵蓋認證、HTTP 請求、WP REST API、WooCommerce API |
| `test-apple` | iOS / macOS App QA 測試，涵蓋 Swift 掃描、Xcode 編譯、單元測試 |
| `test-chrome` | Chrome 插件 QA 測試，涵蓋 MV3 相容性、CSP、權限最小化驗證 |
| `test-web` | 網站 QA 測試（Next.js/Astro/Web），涵蓋 TS 型別、建置、SEO 驗證 |
| `test-wp` | WordPress QA 測試，涵蓋 PHP 語法、安全性掃描、wp-env 環境執行 |
| `website-dev` | 網站開發，涵蓋 Next.js/Astro、電商（Stripe/ECPay）、部落格、SEO |
| `woocommerce-dev` | WooCommerce 電商開發，涵蓋產品、訂單、購物車、結帳、Webhook |
| `service-impact-assessment` | 服務安裝/刪除/修改前的影響評估，涵蓋優缺點、環境影響、相依衝突、移除可行性 |
| `wordpress-plugin-dev` | WordPress 外掛開發，涵蓋 Settings API、Shortcode、CPT、WP-Cron |
| `wordpress-theme-dev` | WordPress 主題開發，涵蓋模板層級、鉤子、模板標籤 |
| `png` | 桌面截圖讀取（macOS），找出最新截圖並分析，支援指定數量與文字提問 |
| `wp-performance-optimization` | WordPress 效能優化，根據 PageSpeed 數據診斷並修復前後端效能問題 |

## CLAUDE.md 全域規則

`CLAUDE.md` 定義了三條全域行為規則，安裝後對所有專案自動生效：

| 規則 | 說明 |
|------|------|
| 版號與 README 管理 | 每次程式碼變更時，依 Semantic Versioning 自動升版並更新 Changelog |
| 新專案自動偵測 | 對話開始時若偵測到缺少 README，自動執行 `project-init` 初始化 |
| Skills / Agents 自動調用 | 根據對話情境自動判斷並調用對應的 Skill 或 Agent，無需手動輸入 |
| Current Session Usage 監控 | 長時間任務時自動監控用量，達 95% 暫停並總結，重置後自動接續 |

## 安裝方式

先 clone 此 repo 至本機：

```bash
git clone https://github.com/jasonwang-tw/Model-Guide.git ~/Model-Guide
```

---

### Claude Code

官方文件：[Skills](https://code.claude.com/docs/en/skills) · [Sub-agents](https://code.claude.com/docs/zh-TW/sub-agents) · [Memory](https://code.claude.com/docs/zh-TW/memory)

#### 路徑說明

| 類型 | 個人（所有專案） | 專案（僅當前專案） |
|------|-----------------|-----------------|
| Skills | `~/.claude/skills/<name>/SKILL.md` | `.claude/skills/<name>/SKILL.md` |
| Agents | `~/.claude/agents/<name>.md` | `.claude/agents/<name>.md` |
| 記憶指令 | `~/.claude/CLAUDE.md` | `./CLAUDE.md` 或 `.claude/CLAUDE.md` |

#### 個人安裝（推薦，適用所有專案）

```bash
# 建立目錄
mkdir -p ~/.claude/skills ~/.claude/agents

# 建立 symlink（Skills）
for dir in ~/Model-Guide/skills/*/; do
  ln -s "$dir" ~/.claude/skills/$(basename "$dir")
done

# 建立 symlink（Agents）
for f in ~/Model-Guide/agents/*.md; do
  ln -s "$f" ~/.claude/agents/$(basename "$f")
done

# 複製 CLAUDE.md 全域規則（或手動合併至現有 CLAUDE.md）
cp ~/Model-Guide/CLAUDE.md ~/.claude/CLAUDE.md
```

#### 專案安裝（僅當前專案）

```bash
# 在專案根目錄執行
mkdir -p .claude/skills .claude/agents

for dir in ~/Model-Guide/skills/*/; do
  ln -s "$dir" .claude/skills/$(basename "$dir")
done

for f in ~/Model-Guide/agents/*.md; do
  ln -s "$f" .claude/agents/$(basename "$f")
done
```

---

### Cursor

官方文件：[Skills](https://cursor.com/docs/skills) · [Subagents](https://cursor.com/docs/subagents) · [Rules](https://cursor.com/docs/rules)

#### 路徑說明

| 類型 | 個人（所有專案） | 專案（僅當前專案） |
|------|-----------------|-----------------|
| Skills | `~/.cursor/skills/<name>/SKILL.md` | `.cursor/skills/<name>/SKILL.md` |
| Agents | `~/.cursor/agents/<name>.md` | `.cursor/agents/<name>.md` |
| Rules | — | `.cursor/rules/<name>.md` |

> Cursor 也相容 `.claude/skills/`、`.claude/agents/`、`.agents/skills/` 路徑，因此若已做 Claude Code 個人安裝，Cursor 可直接讀取 `~/.claude/` 下的內容。

#### 個人安裝

```bash
mkdir -p ~/.cursor/skills ~/.cursor/agents

for dir in ~/Model-Guide/skills/*/; do
  ln -s "$dir" ~/.cursor/skills/$(basename "$dir")
done

for f in ~/Model-Guide/agents/*.md; do
  ln -s "$f" ~/.cursor/agents/$(basename "$f")
done
```

#### 專案安裝

```bash
# 在專案根目錄執行
mkdir -p .cursor/skills .cursor/agents

for dir in ~/Model-Guide/skills/*/; do
  ln -s "$dir" .cursor/skills/$(basename "$dir")
done

for f in ~/Model-Guide/agents/*.md; do
  ln -s "$f" .cursor/agents/$(basename "$f")
done
```

#### 從 Cursor UI 安裝（Settings > Rules）

1. 開啟 Cursor Settings（`Cmd+Shift+J`）
2. 前往 **Rules → Project Rules**
3. 點擊 **Add Rule → Remote Rule (GitHub)**
4. 輸入 `https://github.com/jasonwang-tw/Model-Guide`

---

## Current Session Usage 監控腳本

`claude_usage_monitor.js` 直接呼叫 Anthropic OAuth API，取得伺服器端真實用量，搭配 Claude Code Stop hook 實現自動暫停與接續。

### 前置需求

- Node.js（標準庫，無需額外套件）

### 使用方式

```bash
node ~/Model-Guide/claude_usage_monitor.js
```

**輸出範例：**

```json
{
  "status": "ok",
  "pct": 11,
  "weekly_pct": 34,
  "resets_at": "2026-03-24T11:00:00.000Z",
  "weekly_resets_at": "2026-03-29T08:00:00.000Z"
}
[OK] 5小時用量：11%　週用量：34%
```

**Exit code：**

| Code | 意義 |
|------|------|
| `0` | 正常（< 95%）或已重置 |
| `1` | 錯誤（無 token / API 失敗） |
| `2` | Critical（≥ 95%），應暫停任務 |

### Stop Hook 自動化

搭配 `~/.claude/hooks/check_usage.sh`（存於 claude-private repo），由 Claude Code Stop hook 自動觸發：

1. 每次 Claude 回應後自動檢查用量
2. 達 95% → 儲存狀態、輸出警告讓 Claude 暫停並條列進度
3. 背景倒數等到 `resets_at` 時間，確認重置後響鈴通知
4. 下次輸入 → hook 偵測重置，注入 resume 訊號讓 Claude 接續任務

## Changelog

## [1.6.0] - 2026-03-24
### Changed
- `claude_usage_monitor.py` 替換為 `claude_usage_monitor.js`（Node.js）
- 改為直接呼叫 Anthropic OAuth API，移除 ccusage CLI 依賴
- 新增 429 fallback：rate limit 時自動讀取 statusline.sh 快取

### Removed
- `claude_usage_monitor.py`（Python + ccusage 版本）

## [1.5.0] - 2026-03-18
### Added
- `skills/png`：桌面截圖讀取 Skill（macOS），支援讀取最新 N 張截圖、附帶文字提問直接回答

## [1.4.2] - 2026-03-15
### Changed
- `claude_usage_monitor.py`：校準 `PRO_SESSION_LIMIT` 從 1,327,000 更新為 13,087,950（實測 261,759 tokens = 2%，與 UI 數據對齊）

## [1.4.1] - 2026-03-12
### Changed
- `skills/wordpress-plugin-dev`：CSS 工具鏈改為依場景分流——後台 UI 改用 WP 原生樣式（避免 Tailwind Preflight 衝突）、複雜後台 React UI 使用 `@wordpress/components`、前台輸出維持 Tailwind + SCSS；Icon 規範同步調整，後台使用 Dashicons，前台使用 Lucide

## [1.4.0] - 2026-03-12
### Added
- 所有開發類 Skills 新增 **Icon 使用規範**：
  - Web 類（`chrome-extension-dev`、`website-dev`、`wordpress-plugin-dev`、`wordpress-theme-dev`、`woocommerce-dev`）：新專案 / 新功能一律使用 [Lucide](https://lucide.dev/)，禁止以 emoji 代替 icon；既有專案先偵測現有 icon 庫並延續；找不到合適 icon 時主動告知並推薦替代選項
  - Apple 類（`ios-dev`、`macos-dev`）：一律使用 SF Symbols，禁止以 emoji 代替 icon；找不到合適圖示時主動告知並推薦替代選項

## [1.3.1] - 2026-03-12
### Changed
- `skills/chrome-extension-dev`：CSS 工具鏈新增既有專案偵測邏輯，延續現有 UI 框架，無則預設 Tailwind + PostCSS + SCSS
- `skills/wordpress-theme-dev`：CSS 工具鏈新增既有專案偵測邏輯（同上）
- `skills/wordpress-plugin-dev`：CSS 工具鏈新增既有專案偵測邏輯（同上）
- `skills/website-dev`：CSS 工具鏈新增既有專案偵測邏輯，涵蓋 shadcn / MUI / Chakra UI 等元件庫

## [1.3.0] - 2026-03-12
### Changed
- `skills/chrome-extension-dev`：新增 CSS 工具鏈設定（TailwindCSS + PostCSS + SCSS），更新檔案結構加入 src/styles/
- `skills/wordpress-theme-dev`：新增 CSS 工具鏈設定（TailwindCSS + PostCSS + SCSS），樣式載入改為引用編譯產出
- `skills/wordpress-plugin-dev`：新增 CSS 工具鏈設定（TailwindCSS + PostCSS + SCSS），加入 Admin UI 樣式範例
- `skills/website-dev`：補充 PostCSS config 與 SCSS 自訂元件完整範例

## [1.2.0] - 2026-03-11
### Added
- `skills/service-impact-assessment`：服務安裝/刪除/修改前的深度影響評估 Skill

## [1.1.0] - 2026-03-10
### Added
- `claude_usage_monitor.py`：Current session usage 自動監控腳本（Pro 方案校準）
- CLAUDE.md：新增 Current Session Usage 自動監控規則（main agent 監控 + subagent 執行架構）
