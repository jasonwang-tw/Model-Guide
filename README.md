# Model.md

Claude Code 與 Cursor 的自訂 Agents 與 Skills 設定集合，針對 WordPress 與網頁開發工作流程優化。

## 結構

```
Model.md/
├── agents/
│   ├── debugger.md       # 自動除錯專家
│   ├── tester.md         # WordPress QA 測試專家
│   └── ui-designer.md    # UI 介面設計專家
└── skills/
    ├── rest-api-integration/   # REST API 串接
    ├── woocommerce-dev/        # WooCommerce 開發
    ├── wordpress-plugin-dev/   # WordPress 外掛開發
    ├── wordpress-theme-dev/    # WordPress 主題開發
    └── wp-performance-optimization/  # WordPress 效能優化
```

## Agents

| Agent | 說明 |
|-------|------|
| `debugger` | 專業除錯專家，自動檢查日誌、分析系統狀態、排查錯誤與異常行為 |
| `tester` | WordPress QA 測試專家，自動執行靜態分析、安全性掃描與 Docker 環境功能測試 |
| `ui-designer` | UI 介面設計專家，修復跑版問題，支援 desktop / tablet / mobile / APP |

## Skills

| Skill | 說明 |
|-------|------|
| `rest-api-integration` | REST API 串接整合，涵蓋認證、HTTP 請求、WP REST API、WooCommerce API |
| `woocommerce-dev` | WooCommerce 電商開發，涵蓋產品、訂單、購物車、結帳、Webhook |
| `wordpress-plugin-dev` | WordPress 外掛開發，涵蓋 Settings API、Shortcode、CPT、WP-Cron |
| `wordpress-theme-dev` | WordPress 主題開發，涵蓋模板層級、鉤子、模板標籤 |
| `wp-performance-optimization` | WordPress 效能優化，根據 PageSpeed 數據診斷並修復前後端效能問題 |

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
