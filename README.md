# Model.md

Claude Code 與 Cursor 的自訂 Agents 與 Skills 設定集合，針對 WordPress 與網頁開發工作流程優化。

## 結構

```
Model.md/
├── CLAUDE.md                         # 全域規則（版號/README 自動管理）
├── agents/
│   ├── debugger.md                   # 自動除錯專家
│   ├── developer.md                  # 專案架構規劃與開發引導
│   ├── tester.md                     # WordPress QA 測試專家
│   └── ui-designer.md                # UI 介面設計專家
└── skills/
    ├── chrome-extension-dev/         # Chrome 插件開發
    ├── ios-dev/                      # iOS App 開發
    ├── macos-dev/                    # macOS App 開發
    ├── project-init/                 # 新專案初始化
    ├── rest-api-integration/         # REST API 串接
    ├── website-dev/                  # 網站開發（電商/部落格）
    ├── woocommerce-dev/              # WooCommerce 開發
    ├── wordpress-plugin-dev/         # WordPress 外掛開發
    ├── wordpress-theme-dev/          # WordPress 主題開發
    └── wp-performance-optimization/  # WordPress 效能優化
```

## Agents

| Agent | 說明 |
|-------|------|
| `debugger` | 專業除錯專家，自動檢查日誌、分析系統狀態、排查錯誤與異常行為 |
| `developer` | 專案架構規劃與開發引導，支援 Chrome 插件、WP、網站、iOS、macOS |
| `tester` | WordPress QA 測試專家，自動執行靜態分析、安全性掃描與 Docker 環境功能測試 |
| `ui-designer` | UI 介面設計專家，修復跑版問題，支援 desktop / tablet / mobile / APP |

## Skills

| Skill | 說明 |
|-------|------|
| `chrome-extension-dev` | Chrome 插件開發（MV3），涵蓋 Service Worker、Content Script、Chrome APIs |
| `ios-dev` | iOS App 開發，涵蓋 SwiftUI、MVVM、網路請求、SwiftData、App Store 發布 |
| `macos-dev` | macOS App 開發，涵蓋 SwiftUI for macOS、選單列 App、AppKit 整合 |
| `project-init` | 新專案初始化，自動建立 README 與版號；WP 主題/外掛可加入開發者資訊 |
| `rest-api-integration` | REST API 串接整合，涵蓋認證、HTTP 請求、WP REST API、WooCommerce API |
| `website-dev` | 網站開發，涵蓋 Next.js/Astro、電商（Stripe/ECPay）、部落格、SEO |
| `woocommerce-dev` | WooCommerce 電商開發，涵蓋產品、訂單、購物車、結帳、Webhook |
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

## 安裝方式

先 clone 此 repo 至本機：

```bash
git clone https://github.com/jasonwang-tw/Model.md.git ~/Model.md
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
for dir in ~/Model.md/skills/*/; do
  ln -s "$dir" ~/.claude/skills/$(basename "$dir")
done

# 建立 symlink（Agents）
for f in ~/Model.md/agents/*.md; do
  ln -s "$f" ~/.claude/agents/$(basename "$f")
done

# 複製 CLAUDE.md 全域規則（或手動合併至現有 CLAUDE.md）
cp ~/Model.md/CLAUDE.md ~/.claude/CLAUDE.md
```

#### 專案安裝（僅當前專案）

```bash
# 在專案根目錄執行
mkdir -p .claude/skills .claude/agents

for dir in ~/Model.md/skills/*/; do
  ln -s "$dir" .claude/skills/$(basename "$dir")
done

for f in ~/Model.md/agents/*.md; do
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

for dir in ~/Model.md/skills/*/; do
  ln -s "$dir" ~/.cursor/skills/$(basename "$dir")
done

for f in ~/Model.md/agents/*.md; do
  ln -s "$f" ~/.cursor/agents/$(basename "$f")
done
```

#### 專案安裝

```bash
# 在專案根目錄執行
mkdir -p .cursor/skills .cursor/agents

for dir in ~/Model.md/skills/*/; do
  ln -s "$dir" .cursor/skills/$(basename "$dir")
done

for f in ~/Model.md/agents/*.md; do
  ln -s "$f" .cursor/agents/$(basename "$f")
done
```

#### 從 Cursor UI 安裝（Settings > Rules）

1. 開啟 Cursor Settings（`Cmd+Shift+J`）
2. 前往 **Rules → Project Rules**
3. 點擊 **Add Rule → Remote Rule (GitHub)**
4. 輸入 `https://github.com/jasonwang-tw/Model.md`
