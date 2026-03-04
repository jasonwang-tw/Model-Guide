# Model.md

Claude Code 的自訂 Agents 與 Skills 設定集合，針對 WordPress 與網頁開發工作流程優化。

## 結構

```
Model.md/
├── agents/
│   ├── debugger.md       # 自動除錯專家
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

將此 repo clone 至本機，並在 Claude Code 設定中指定對應路徑：

```bash
git clone https://github.com/jasonwang-tw/Model.md.git
```

在 `~/.claude/settings.json` 中加入：

```json
{
  "agentDirectories": ["/path/to/Model.md/agents"],
  "skillDirectories": ["/path/to/Model.md/skills"]
}
```
