---
name: service-impact-assessment
description: 服務安裝/刪除/修改前的深度影響評估。當 APP/Website/Server/WordPress 計畫新增、修改或除錯，且涉及安裝、刪除或設定一個或多個服務/套件/模組時使用。評估內容包含：優缺點分析、對現有環境的影響、相依性衝突、以及事後能否安全完整移除。Use when planning to install, remove, or configure services, packages, plugins, or system components.
---

# 服務影響評估 (Service Impact Assessment)

在安裝、刪除或修改任何服務/套件前，執行以下評估流程，確保決策有充分依據。

## 評估觸發條件

當任務涉及以下任一情境時，**必須先執行本評估**，再提出實作方案：

- 安裝新服務、套件、外掛、模組（npm、apt、composer、pip 等）
- 刪除或停用現有服務
- 修改系統層級設定（Apache、Nginx、PHP、MySQL 設定檔）
- 新增 WordPress 外掛或主題
- 設定 Cron Job、Daemon、背景服務

---

## 評估流程

### Step 1：現況掃描

先掌握目前環境狀態：

```
檢查清單：
- [ ] 作業系統版本與架構
- [ ] 已安裝的相關服務版本
- [ ] 可用磁碟空間與記憶體
- [ ] 現有相依套件（package.json / composer.json / requirements.txt）
- [ ] 目前運行中的服務（systemctl list-units / ps aux）
```

### Step 2：服務評估矩陣

對每個服務/套件，產出以下評估表格：

```markdown
## [服務名稱] 評估

### 安裝優點
- 優點 1（具體說明對本專案的效益）
- 優點 2

### 安裝缺點 / 風險
- 風險 1（如：增加攻擊面、記憶體佔用、版本衝突）
- 風險 2

### 對現有環境的影響
| 影響面向 | 說明 | 嚴重程度 |
|---------|------|---------|
| 效能 | ... | 低/中/高 |
| 安全性 | ... | 低/中/高 |
| 相依性 | ... | 低/中/高 |
| 設定複雜度 | ... | 低/中/高 |

### 不安裝的替代方案
- 替代方案 1（說明差異）
- 替代方案 2

### 移除可行性評估
- **能否完整移除**：是 / 否 / 部分
- **移除步驟複雜度**：簡單 / 中等 / 複雜
- **移除後殘留風險**：說明可能殘留的設定、資料、相依
- **移除指令預覽**：列出主要移除步驟
```

### Step 3：相依性衝突檢查

```
必查項目：
- 與現有套件的版本衝突
- Port 佔用衝突（netstat -tlnp）
- 設定檔覆蓋風險（同一設定檔被多個服務修改）
- PHP/Node/Python 版本相容性
- WordPress 外掛間的 Hook 衝突
```

### Step 4：決策建議

根據評估結果，給出明確建議：

```markdown
## 建議決策

**推薦方案**：安裝 / 不安裝 / 採用替代方案

**理由**（2-3 句）：...

**風險等級**：🟢 低 / 🟡 中 / 🔴 高

**如果安裝**：提供最小化安裝步驟
**如果不安裝**：提供替代實作方式
```

---

## 移除計畫模板

若日後需要移除，應在安裝前就記錄移除計畫：

```markdown
## [服務名稱] 移除計畫

### 移除前備份
- 備份設定檔：`cp /etc/service/config.conf /etc/service/config.conf.bak`
- 匯出資料（如有）

### 移除步驟
1. 停止服務：`sudo systemctl stop service-name`
2. 停用開機自啟：`sudo systemctl disable service-name`
3. 移除套件：`sudo apt remove --purge service-name`
4. 清除設定殘留：`sudo apt autoremove`
5. 移除自訂設定檔：列出需手動刪除的檔案
6. 移除 Cron Job（如有）
7. 還原被修改的設定檔

### 移除後驗證
- 驗證服務已停止
- 確認 Port 已釋放
- 測試相依服務仍正常運作
```

---

## 環境特定注意事項

### WordPress 環境
- 外掛衝突：LiteSpeed Cache、Yoast、WooCommerce 之間的 Hook 優先序
- 資料庫表格：外掛停用後，wp_options / 自訂 table 殘留資料
- 上傳目錄權限：新服務是否改變 `wp-content/uploads/` 的擁有者

### Apache/Nginx 環境
- 模組載入順序（`a2enmod` 後是否需重啟）
- VirtualHost 設定衝突
- `.htaccess` 規則覆蓋（本機規則 vs 新服務注入的規則）

### 系統服務（apt/systemd）
- 安裝後是否自動啟動（`systemctl is-enabled`）
- 是否修改 `/etc/` 下的共用設定
- 日誌路徑與大小（是否有自動輪轉設定）

---

## 輸出格式

每次評估完成後，以此結構回覆使用者：

```
📋 服務影響評估：[服務名稱]

✅ 優點（3-5 點）
⚠️  風險（3-5 點）
🔄 現有環境影響（表格）
🚮 移除可行性：[簡單/中等/複雜]

💡 建議：[安裝/不安裝/替代方案]
風險等級：🟢/🟡/🔴

下一步：等待確認後再執行安裝
```

**重要原則**：評估完成後，等待使用者確認才執行實際安裝或修改。不可跳過評估直接安裝。
