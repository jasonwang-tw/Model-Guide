# Model-Guide

Claude Code 與 Cursor 的自訂 Agents 與 Skills 設定集合，針對 WordPress 與網頁開發工作流程優化。

## 結構

```
Model-Guide/
├── CLAUDE.md                         # 全域規則（版號/README 自動管理）
├── claude_usage_monitor.py           # Current session usage 監控腳本
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

`claude_usage_monitor.py` 自動監控 Claude Code 的 current session usage，搭配 CLAUDE.md 的自動化流程，讓長時間任務在用量達 95% 時自動暫停並總結，重置後自動接續。

### 前置需求

- Python 3.x
- Node.js + npx（用於執行 `ccusage`）

### 安裝

```bash
# clone 後將腳本複製至工作目錄（或直接使用 repo 路徑）
cp ~/Model-Guide/claude_usage_monitor.py ~/claude_usage_monitor.py
```

### 校準（首次使用）

腳本內建 Pro 方案校準值。若使用其他方案，需重新校準：

1. 執行 `/usage` 記下目前百分比（例：71%）
2. 執行以下指令取得目前 token 數：
   ```bash
   npx ccusage@latest blocks --json | python3 -c "
   import json,sys; d=json.load(sys.stdin)
   b=[x for x in d['blocks'] if x.get('isActive') and not x.get('isGap')]
   print('tokens:', b[0]['totalTokens']) if b else print('no active block')
   "
   ```
3. 計算上限：`tokens ÷ 百分比 = 方案上限`
4. 更新腳本第 13 行的 `PRO_SESSION_LIMIT`

### 使用方式

```bash
python3 claude_usage_monitor.py
```

**輸出範例：**

```json
{
  "status": "ok",
  "pct": 45.2,
  "tokens": 599754,
  "limit": 1327000,
  "remaining_minutes": 180
}
[OK] Current session usage: 45.2%
```

**Exit code：**

| Code | 意義 |
|------|------|
| `0` | 正常（< 95%）或已重置 |
| `2` | Critical（≥ 95%），應暫停任務 |

### 自動化流程（搭配 CLAUDE.md）

CLAUDE.md 已定義完整的自動監控規則：

1. 長時間任務由 **subagent** 執行（`run_in_background: true`）
2. **Main agent** 每 1 分鐘執行腳本監控用量
3. 達 95% → 通知 subagent 暫停，條列輸出已完成／未完成項目
4. 每 30 分鐘偵測重置狀態（pct < 5% 視為已重置）
5. 重置後自動通知 subagent 接續任務
6. 重複直到任務完成

## Changelog

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
