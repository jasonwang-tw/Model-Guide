---
name: macos-dev
description: macOS App 開發指南。涵蓋 SwiftUI for macOS、AppKit 整合、選單列 App、系統整合、視窗管理、Mac App Store 發布。當開發 macOS 原生應用程式時使用。
---

# macOS App 開發指南

> **環境需求**：Xcode 15+、Swift 5.9+、macOS Sonoma+

## Icon 使用規範

> **原則**：macOS 開發一律使用 **SF Symbols** 作為 icon 系統，**禁止使用 emoji 代替 icon**。

SF Symbols 是 Apple 官方提供的向量 icon 庫，與 SwiftUI / AppKit 深度整合，支援動態字體縮放與深色模式。瀏覽所有圖示：[SF Symbols App](https://developer.apple.com/sf-symbols/)

### 既有專案：先確認現有 icon 使用方式

```bash
# 確認是否有自訂 SVG asset 或第三方 icon 庫
grep -r "Image(systemName\|NSImage(systemSymbolName\|Image(\"" --include="*.swift" . | head -10
ls Assets.xcassets/ 2>/dev/null | grep -i icon
```

| 偵測結果 | 做法 |
|---------|------|
| 使用 `Image(systemName:)` | 延續使用 SF Symbols |
| 使用 `NSImage(systemSymbolName:)` | 延續使用 SF Symbols（AppKit） |
| 有自訂 SVG asset | 延續使用，新增圖示加入 Assets.xcassets |

> **找不到合適 icon 時**：若 SF Symbols 中無法找到符合情境的圖示，**主動告知開發者**，列出近似的 SF Symbols 替代建議或建議加入自訂 SVG asset，由開發者決定。

### SF Symbols 使用範例

```swift
// SwiftUI
Image(systemName: "gear")
Image(systemName: "magnifyingglass")
Image(systemName: "doc.text")

// 帶文字的 Label（選單列 / Toolbar 常用）
Label("設定", systemImage: "gear")
Label("匯出", systemImage: "square.and.arrow.up")

// 調整尺寸與顏色
Image(systemName: "star.fill")
    .font(.system(size: 16))
    .foregroundStyle(.yellow)

// AppKit（NSImage）
let icon = NSImage(systemSymbolName: "gear", accessibilityDescription: "設定")
let config = NSImage.SymbolConfiguration(pointSize: 16, weight: .regular)
let configuredIcon = icon?.withSymbolConfiguration(config)

// Toolbar 使用
ToolbarItem {
    Button(action: exportAction) {
        Label("匯出", systemImage: "square.and.arrow.up")
    }
}
```

---

## 應用程式類型選擇

| 類型 | 說明 | 適用情境 |
|------|------|---------|
| 視窗應用程式 | 標準多視窗 App | 生產力工具、編輯器 |
| 選單列 App | 常駐在選單列 | 快速工具、系統監控 |
| 文件型 App | 基於檔案操作 | 文字編輯器、設計工具 |
| 選單列 + 主視窗 | 兩者兼具 | 複雜工具類 App |

## 專案結構

```
MyMacApp/
├── MyMacApp.swift         # App 入口
├── AppDelegate.swift      # AppKit 生命週期（可選）
├── ContentView.swift      # 主視圖
├── Views/
│   ├── MainView.swift
│   ├── SettingsView.swift
│   └── MenuBarView.swift
├── ViewModels/
├── Models/
├── Services/
└── Resources/
    ├── Assets.xcassets
    └── MyMacApp.entitlements
```

## App 入口

```swift
// MyMacApp.swift
import SwiftUI

@main
struct MyMacApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var appState = AppState()

    var body: some Scene {
        // 主視窗
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .frame(minWidth: 800, minHeight: 600)
        }
        .windowResizability(.contentSize)
        .commands {
            // 自訂選單
            CommandGroup(replacing: .newItem) {
                Button("新增項目") { appState.createNew() }
                    .keyboardShortcut("n")
            }
            CommandGroup(after: .help) {
                Button("關於") { appState.showAbout = true }
            }
        }

        // 偏好設定視窗
        Settings {
            SettingsView()
        }
    }
}
```

## 選單列 App

```swift
// MenuBarApp.swift
import SwiftUI

@main
struct MenuBarApp: App {
    var body: some Scene {
        MenuBarExtra("My App", systemImage: "star.fill") {
            MenuBarContentView()
        }
        .menuBarExtraStyle(.window)  // .menu 為純選單樣式
    }
}

// MenuBarContentView.swift
struct MenuBarContentView: View {
    @StateObject private var viewModel = MenuBarViewModel()

    var body: some View {
        VStack(spacing: 0) {
            // 內容區
            ScrollView {
                LazyVStack {
                    ForEach(viewModel.items) { item in
                        MenuBarItemRow(item: item)
                    }
                }
                .padding()
            }
            .frame(width: 320, height: 400)

            Divider()

            // 底部操作列
            HStack {
                Button("設定") { openSettings() }
                Spacer()
                Button("結束") { NSApp.terminate(nil) }
            }
            .padding(8)
        }
    }

    private func openSettings() {
        NSApp.sendAction(Selector(("showSettingsWindow:")), to: nil, from: nil)
        NSApp.activate(ignoringOtherApps: true)
    }
}
```

## 視窗管理

```swift
// 開啟新視窗
import AppKit

func openNewWindow() {
    let window = NSWindow(
        contentRect: NSRect(x: 0, y: 0, width: 600, height: 400),
        styleMask: [.titled, .closable, .resizable, .miniaturizable],
        backing: .buffered,
        defer: false
    )
    window.title = "新視窗"
    window.center()
    window.contentView = NSHostingView(rootView: DetailView())
    window.makeKeyAndOrderFront(nil)
    NSApp.activate(ignoringOtherApps: true)
}

// 使用 openWindow Environment（SwiftUI 方式）
// 在 App 定義額外 Scene
WindowGroup(id: "detail", for: Item.ID.self) { $itemID in
    if let id = itemID {
        ItemDetailView(id: id)
    }
}

// 在視圖中開啟
struct ContentView: View {
    @Environment(\.openWindow) var openWindow

    var body: some View {
        Button("開啟詳情") {
            openWindow(id: "detail", value: item.id)
        }
    }
}
```

## 設定頁面

```swift
// SettingsView.swift
import SwiftUI

struct SettingsView: View {
    @AppStorage("autoLaunch") private var autoLaunch = false
    @AppStorage("theme") private var theme = "system"
    @AppStorage("apiKey") private var apiKey = ""

    var body: some View {
        TabView {
            GeneralSettings()
                .tabItem { Label("一般", systemImage: "gear") }

            AppearanceSettings()
                .tabItem { Label("外觀", systemImage: "paintpalette") }

            AdvancedSettings()
                .tabItem { Label("進階", systemImage: "slider.horizontal.3") }
        }
        .padding()
        .frame(width: 480, height: 300)
    }
}

struct GeneralSettings: View {
    @AppStorage("autoLaunch") private var autoLaunch = false

    var body: some View {
        Form {
            Toggle("登入時自動啟動", isOn: $autoLaunch)
                .onChange(of: autoLaunch) { _, newValue in
                    setLoginItem(enabled: newValue)
                }
        }
        .formStyle(.grouped)
    }
}
```

## 系統整合

```swift
// 檔案存取（需在 entitlements 啟用 com.apple.security.files.user-selected.read-write）
func openFile() {
    let panel = NSOpenPanel()
    panel.allowedContentTypes = [.plainText, .json]
    panel.canChooseMultiple = false

    if panel.runModal() == .OK, let url = panel.url {
        let content = try? String(contentsOf: url)
        print(content ?? "")
    }
}

func saveFile(content: String) {
    let panel = NSSavePanel()
    panel.allowedContentTypes = [.plainText]
    panel.nameFieldStringValue = "output.txt"

    if panel.runModal() == .OK, let url = panel.url {
        try? content.write(to: url, atomically: true, encoding: .utf8)
    }
}

// 剪貼簿
NSPasteboard.general.clearContents()
NSPasteboard.general.setString("複製內容", forType: .string)

let clipboard = NSPasteboard.general.string(forType: .string)

// 通知
import UserNotifications

func sendNotification(title: String, body: String) {
    let content = UNMutableNotificationContent()
    content.title = title
    content.body = body
    let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
    UNUserNotificationCenter.current().add(request)
}

// 登入啟動
import ServiceManagement

func setLoginItem(enabled: Bool) {
    if enabled {
        try? SMAppService.mainApp.register()
    } else {
        try? SMAppService.mainApp.unregister()
    }
}
```

## AppKit 整合（需要 SwiftUI 沒有的功能）

```swift
// NSViewRepresentable — 將 AppKit 元件嵌入 SwiftUI
struct CustomTextEditor: NSViewRepresentable {
    @Binding var text: String

    func makeNSView(context: Context) -> NSTextView {
        let textView = NSTextView()
        textView.delegate = context.coordinator
        textView.font = .systemFont(ofSize: 14)
        return textView
    }

    func updateNSView(_ nsView: NSTextView, context: Context) {
        if nsView.string != text {
            nsView.string = text
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    class Coordinator: NSObject, NSTextViewDelegate {
        var parent: CustomTextEditor
        init(_ parent: CustomTextEditor) { self.parent = parent }
        func textDidChange(_ notification: Notification) {
            if let textView = notification.object as? NSTextView {
                parent.text = textView.string
            }
        }
    }
}
```

## Entitlements 常用設定

```xml
<!-- MyMacApp.entitlements -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "...">
<plist version="1.0">
<dict>
    <!-- 沙盒（App Store 必須開啟） -->
    <key>com.apple.security.app-sandbox</key>
    <true/>
    <!-- 網路存取 -->
    <key>com.apple.security.network.client</key>
    <true/>
    <!-- 使用者選擇的檔案讀寫 -->
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    <!-- 通知 -->
    <key>com.apple.security.notify_events</key>
    <true/>
</dict>
</plist>
```

## Mac App Store 發布流程

1. **Apple Developer Program**：需付費加入（$99/年）
2. **設定 Bundle ID** 並啟用 App Sandbox
3. **Archive** → `Distribute App → App Store Connect`
4. **填寫 App Store 資訊**：截圖尺寸 1280×800 或 2560×1600
5. **審查時間**：通常 1–2 個工作天

## 直接發布（不透過 App Store）

```bash
# 需要 Developer ID Application 憑證
# 1. Archive 後選 Developer ID Distribution
# 2. Notarize（公證）
xcrun notarytool submit MyApp.zip \
  --apple-id "your@email.com" \
  --team-id "TEAMID" \
  --password "@keychain:AC_PASSWORD" \
  --wait
# 3. Staple
xcrun stapler staple MyApp.app
```
