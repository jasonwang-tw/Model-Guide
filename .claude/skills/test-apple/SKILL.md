---
name: test-apple
description: iOS 與 macOS App 的完整 QA 測試流程。涵蓋 Swift 語法驗證、Xcode 編譯測試、Info.plist 與 Entitlements 驗證、安全性掃描、單元測試與 UI 測試執行。由 tester agent 自動調用，或手動用於 Apple 平台專案測試。
---

# iOS / macOS App QA 測試流程

## 平台判斷

```bash
# 判斷 iOS 或 macOS
grep -r "IPHONEOS_DEPLOYMENT_TARGET" *.xcodeproj/project.pbxproj 2>/dev/null && echo "iOS"
grep -r "MACOSX_DEPLOYMENT_TARGET" *.xcodeproj/project.pbxproj 2>/dev/null && echo "macOS"
```

---

## 第一階段：靜態分析

### 1. Info.plist 驗證

```bash
# 確認必要欄位
plutil -p */Info.plist 2>/dev/null | grep -E "CFBundleDisplayName|CFBundleVersion|CFBundleShortVersionString|CFBundleIdentifier"
```

必要欄位：
- `CFBundleDisplayName`：App 顯示名稱
- `CFBundleIdentifier`：Bundle ID（反向域名格式）
- `CFBundleShortVersionString`：版本號（對外顯示，如 `1.0.0`）
- `CFBundleVersion`：Build 號（整數遞增）
- **iOS**：`UISupportedInterfaceOrientations` 設定正確
- **macOS**：`NSHighResolutionCapable` 為 `true`

隱私權說明（若使用對應 API 必須存在）：
```bash
grep -rn "NSCameraUsageDescription\|NSMicrophoneUsageDescription\|NSLocationWhenInUseUsageDescription\|NSPhotoLibraryUsageDescription" */Info.plist
```

### 2. Entitlements 驗證

```bash
# 列出所有 entitlements
cat */*.entitlements 2>/dev/null || find . -name "*.entitlements" -exec cat {} \;
```

- 已聲明的 Entitlements 須有實際程式碼使用
- App Sandbox 已啟用（Mac App Store 必要）
- 無多餘的高敏感權限（`com.apple.security.cs.allow-jit` 等）

### 3. Swift 程式碼掃描

```bash
# 殘留 debug print
grep -rn "print(" --include="*.swift" . | grep -v "//.*print"

# 強制解包風險
grep -rn "!\." --include="*.swift" . | grep -v "//\|guard\|if let"

# 強制轉型風險
grep -rn " as! " --include="*.swift" .

# 硬編碼敏感資料
grep -rni "api.key\|apikey\|secret\|password\|token\s*=\s*\"" --include="*.swift" .

# TODO / FIXME 殘留
grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.swift" .
```

### 4. 安全性掃描

- 敏感資料（Token、密碼）使用 Keychain 儲存，非 `UserDefaults`
- 網路請求全部使用 HTTPS：
  ```bash
  grep -rn "http://" --include="*.swift" . | grep -v "//\|localhost"
  ```
- `NSAllowsArbitraryLoads` 是否誤設為 `true`：
  ```bash
  grep -rn "NSAllowsArbitraryLoads" */Info.plist
  ```

---

## 第二階段：編譯與執行測試

### 1. 編譯測試

```bash
# 自動偵測 Scheme
SCHEME=$(xcodebuild -list 2>/dev/null | grep -A5 "Schemes:" | tail -n +2 | head -1 | tr -d ' ')
echo "使用 Scheme: $SCHEME"

# iOS 編譯
xcodebuild -scheme "$SCHEME" \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  build 2>&1 | grep -E "error:|warning:|Build succeeded|BUILD FAILED"

# macOS 編譯
xcodebuild -scheme "$SCHEME" \
  -destination 'platform=macOS' \
  -configuration Debug \
  build 2>&1 | grep -E "error:|warning:|Build succeeded|BUILD FAILED"
```

### 2. 單元測試

```bash
# iOS
xcodebuild test \
  -scheme "$SCHEME" \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=latest' \
  2>&1 | grep -E "Test Case|passed|failed|error:"

# macOS
xcodebuild test \
  -scheme "$SCHEME" \
  -destination 'platform=macOS' \
  2>&1 | grep -E "Test Case|passed|failed|error:"
```

### 3. UI 測試（若有 UITests target）

```bash
UI_SCHEME="${SCHEME}UITests"
xcodebuild test \
  -scheme "$UI_SCHEME" \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=latest' \
  2>&1 | grep -E "Test Case|passed|failed|error:" 2>/dev/null || echo "無 UI Tests target"
```

### 4. 無 Xcode 環境

若無法執行 `xcodebuild`，在摘要中標註「僅靜態分析」，並列出需要在 Xcode 手動確認的項目：

```
□ Product → Clean Build Folder → Build 無錯誤
□ 在模擬器執行，確認主流程正常
□ 確認所有 TODO / FIXME 已處理
□ Instruments → Leaks 確認無記憶體洩漏（可選）
```
