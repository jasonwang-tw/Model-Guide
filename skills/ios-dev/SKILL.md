---
name: ios-dev
description: iOS App 開發指南。涵蓋 SwiftUI、MVVM 架構、網路請求、資料持久化、推播通知、App Store 發布流程。當開發 iOS App 時使用。
---

# iOS App 開發指南

> **環境需求**：Xcode 15+、Swift 5.9+、macOS Sonoma+、iOS 17 SDK

## 專案結構（MVVM）

```
MyApp/
├── MyApp.swift               # App 入口
├── ContentView.swift         # 根視圖
├── Models/
│   ├── User.swift
│   └── Product.swift
├── ViewModels/
│   ├── UserViewModel.swift
│   └── ProductViewModel.swift
├── Views/
│   ├── HomeView.swift
│   ├── DetailView.swift
│   └── Components/
│       └── CardView.swift
├── Services/
│   ├── APIService.swift
│   └── AuthService.swift
├── Utilities/
│   ├── Extensions.swift
│   └── Constants.swift
└── Resources/
    ├── Assets.xcassets
    └── Localizable.strings
```

## App 入口

```swift
// MyApp.swift
import SwiftUI

@main
struct MyApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}

// AppState.swift — 全域狀態
class AppState: ObservableObject {
    @Published var isLoggedIn = false
    @Published var currentUser: User?
}
```

## SwiftUI 視圖

```swift
// HomeView.swift
import SwiftUI

struct HomeView: View {
    @StateObject private var viewModel = HomeViewModel()
    @EnvironmentObject var appState: AppState

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView()
                } else if let error = viewModel.error {
                    ErrorView(message: error.localizedDescription) {
                        Task { await viewModel.loadData() }
                    }
                } else {
                    itemList
                }
            }
            .navigationTitle("首頁")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("新增") { viewModel.showAddSheet = true }
                }
            }
            .sheet(isPresented: $viewModel.showAddSheet) {
                AddItemView()
            }
            .task { await viewModel.loadData() }
        }
    }

    private var itemList: some View {
        List(viewModel.items) { item in
            NavigationLink(value: item) {
                ItemRowView(item: item)
            }
        }
        .navigationDestination(for: Item.self) { item in
            ItemDetailView(item: item)
        }
        .refreshable { await viewModel.loadData() }
    }
}
```

## ViewModel

```swift
// HomeViewModel.swift
import SwiftUI

@MainActor
class HomeViewModel: ObservableObject {
    @Published var items: [Item] = []
    @Published var isLoading = false
    @Published var error: Error?
    @Published var showAddSheet = false

    private let apiService = APIService()

    func loadData() async {
        isLoading = true
        error = nil
        do {
            items = try await apiService.fetchItems()
        } catch {
            self.error = error
        }
        isLoading = false
    }
}
```

## Model

```swift
// Item.swift
import Foundation

struct Item: Identifiable, Codable, Hashable {
    let id: UUID
    var title: String
    var description: String
    var createdAt: Date

    // 自訂 JSON key 對應
    enum CodingKeys: String, CodingKey {
        case id
        case title
        case description
        case createdAt = "created_at"
    }
}
```

## 網路請求

```swift
// APIService.swift
import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse(Int)
    case decodingError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "無效的 URL"
        case .invalidResponse(let code): return "伺服器回應錯誤：\(code)"
        case .decodingError(let error): return "資料解析失敗：\(error.localizedDescription)"
        }
    }
}

class APIService {
    private let baseURL = "https://api.example.com"
    private let session = URLSession.shared
    private let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }()

    func fetch<T: Decodable>(_ endpoint: String, method: String = "GET", body: Encodable? = nil) async throws -> T {
        guard let url = URL(string: baseURL + endpoint) else { throw APIError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let body {
            request.httpBody = try JSONEncoder().encode(body)
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else { throw APIError.invalidResponse(0) }
        guard (200..<300).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse(httpResponse.statusCode)
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }

    func fetchItems() async throws -> [Item] {
        return try await fetch("/items")
    }
}
```

## 資料持久化

```swift
// UserDefaults（輕量設定）
@AppStorage("isOnboarded") var isOnboarded = false
@AppStorage("username") var username = ""

// SwiftData（iOS 17+，取代 Core Data）
import SwiftData

@Model
class Note {
    var title: String
    var content: String
    var createdAt: Date

    init(title: String, content: String) {
        self.title = title
        self.content = content
        self.createdAt = .now
    }
}

// 在 App 入口設定
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: Note.self)
    }
}

// 在視圖中使用
struct NotesView: View {
    @Query(sort: \Note.createdAt, order: .reverse) var notes: [Note]
    @Environment(\.modelContext) private var context

    var body: some View {
        List(notes) { note in
            Text(note.title)
        }
        .toolbar {
            Button("新增") {
                let note = Note(title: "新筆記", content: "")
                context.insert(note)
            }
        }
    }
}
```

## 推播通知

```swift
// 請求權限
import UserNotifications

func requestNotificationPermission() async {
    let center = UNUserNotificationCenter.current()
    let granted = try? await center.requestAuthorization(options: [.alert, .sound, .badge])
    print("通知權限：\(granted ?? false)")
}

// 本地通知
func scheduleLocalNotification() {
    let content = UNMutableNotificationContent()
    content.title = "提醒"
    content.body = "別忘了查看最新消息"
    content.sound = .default

    let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 60, repeats: false)
    let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)

    UNUserNotificationCenter.current().add(request)
}
```

## 常用元件

```swift
// 自訂按鈕樣式
struct PrimaryButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.headline)
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(.blue)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}

// 非同步圖片
AsyncImage(url: URL(string: imageURL)) { phase in
    switch phase {
    case .success(let image): image.resizable().scaledToFill()
    case .failure: Image(systemName: "photo").foregroundStyle(.secondary)
    case .empty: ProgressView()
    @unknown default: EmptyView()
    }
}
.frame(width: 100, height: 100)
.clipShape(Circle())
```

## App Store 發布流程

1. **Xcode 設定**：Bundle ID、版本號、Build Number
2. **簽署**：Certificates、Provisioning Profile（自動管理即可）
3. **Archive**：`Product → Archive`
4. **上傳**：`Distribute App → App Store Connect`
5. **TestFlight**：先內測，再提交審查
6. **審查時間**：通常 1–2 個工作天

## 常用套件（Swift Package Manager）

| 套件 | 用途 |
|------|------|
| Alamofire | 網路請求（可選，URLSession 已夠用） |
| SDWebImageSwiftUI | 圖片快取與載入 |
| Lottie | JSON 動畫 |
| KeychainSwift | Keychain 操作封裝 |
| Firebase | 後端服務（Auth、Firestore、Analytics） |
