---
name: website-dev
description: 網站開發指南。涵蓋前端技術選型（Next.js/Astro/Vanilla）、電商整合（Stripe/ECPay/綠界）、部落格架構、SEO 優化、部署流程。當開發非 WordPress 的網站、電商平台或部落格時使用。
---

# 網站開發指南

## Icon 使用規範

> **原則**：新專案或新功能一律使用 [Lucide](https://lucide.dev/)，**禁止使用 emoji 代替 icon**。

### 既有專案：先偵測現有 icon 庫

```bash
# 1. 檢查 package.json 已安裝的 icon 庫
cat package.json | grep -E "lucide|heroicons|phosphor|react-icons|@fortawesome|feather-icons|@tabler/icons"

# 2. 檢查元件是否有引入 icon
grep -r "lucide\|heroicons\|phosphor\|FontAwesome\|@tabler" src/ app/ components/ --include="*.ts" --include="*.tsx" --include="*.astro" 2>/dev/null | head -5
```

| 偵測結果 | 做法 |
|---------|------|
| 找到 `lucide-react` | 延續使用 Lucide |
| 找到其他 icon 庫（heroicons / phosphor / font-awesome 等） | 延續使用該庫 |
| 未找到任何 icon 庫 | 安裝 Lucide（見下方） |

> **找不到合適 icon 時**：若在既有 icon 庫中無法找到符合情境的圖示，**主動告知開發者**，並推薦 Lucide 中的替代選項，由開發者決定是否採用。

### 安裝 Lucide（新專案預設）

```bash
npm install lucide-react   # React / Next.js
npm install lucide         # Astro / Vanilla JS
```

```tsx
// React / Next.js
import { Search, ShoppingCart, User, Menu, X, ChevronRight } from 'lucide-react'

<Search size={20} className="text-gray-500" />
<ShoppingCart size={24} strokeWidth={1.5} />
```

```astro
---
// Astro
import { Search } from 'lucide'
---
<!-- 或直接使用 lucide-react with client:load -->
```

---

## 技術選型

### 電商網站

| 需求 | 推薦技術棧 |
|------|-----------|
| 全功能電商 | Next.js + Tailwind + Stripe/ECPay + Prisma + PostgreSQL |
| Headless WooCommerce | Next.js + WooCommerce REST API |
| 快速上線 | Shopify（無需自建後端） |

### 部落格 / 內容網站

| 需求 | 推薦技術棧 |
|------|-----------|
| 靜態部落格 | Astro + MDX（最快、SEO 最佳） |
| 動態內容 | Next.js + Contentful/Sanity（Headless CMS） |
| 個人部落格 | Astro 或 Next.js + Markdown |

---

## Next.js（App Router）

### 專案結構

```
my-website/
├── app/
│   ├── layout.tsx         # 根 Layout
│   ├── page.tsx           # 首頁
│   ├── globals.css
│   ├── (shop)/            # 路由群組（不影響 URL）
│   │   ├── products/
│   │   │   ├── page.tsx   # /products
│   │   │   └── [slug]/
│   │   │       └── page.tsx  # /products/[slug]
│   │   └── cart/
│   │       └── page.tsx
│   └── api/
│       ├── products/
│       │   └── route.ts
│       └── checkout/
│           └── route.ts
├── components/
│   ├── ui/                # 基礎 UI 元件
│   └── features/          # 功能元件
├── lib/
│   ├── db.ts              # 資料庫連線
│   ├── stripe.ts
│   └── utils.ts
├── types/
└── public/
```

### Server Components vs Client Components

```tsx
// Server Component（預設）— 在伺服器執行，可直接存取 DB
// app/products/page.tsx
import { db } from '@/lib/db'

export default async function ProductsPage() {
  const products = await db.product.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="grid grid-cols-3 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

// Client Component — 需要互動或瀏覽器 API
// components/features/AddToCartButton.tsx
'use client'

import { useState } from 'react'
import { useCart } from '@/hooks/useCart'

export function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false)
  const { addItem } = useCart()

  async function handleAdd() {
    setLoading(true)
    await addItem(productId)
    setLoading(false)
  }

  return (
    <button onClick={handleAdd} disabled={loading}
      className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50">
      {loading ? '加入中...' : '加入購物車'}
    </button>
  )
}
```

### API Route

```ts
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  const products = await db.product.findMany({
    where: category ? { category } : undefined
  })

  return NextResponse.json(products)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const product = await db.product.create({ data: body })
  return NextResponse.json(product, { status: 201 })
}
```

---

## 電商整合

### Stripe 付款

```ts
// lib/stripe.ts
import Stripe from 'stripe'
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// app/api/checkout/route.ts
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const { items } = await request.json()

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: items.map((item: any) => ({
      price_data: {
        currency: 'twd',
        product_data: { name: item.name, images: [item.image] },
        unit_amount: item.price * 100  // 以分為單位
      },
      quantity: item.quantity
    })),
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`
  })

  return NextResponse.json({ url: session.url })
}

// Webhook 接收付款結果
// app/api/webhook/stripe/route.ts
export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    await db.order.update({
      where: { stripeSessionId: session.id },
      data: { status: 'paid' }
    })
  }

  return NextResponse.json({ received: true })
}
```

### 綠界 ECPay（台灣）

```ts
// lib/ecpay.ts
import crypto from 'crypto'

const MERCHANT_ID = process.env.ECPAY_MERCHANT_ID!
const HASH_KEY = process.env.ECPAY_HASH_KEY!
const HASH_IV = process.env.ECPAY_HASH_IV!

function generateCheckMacValue(params: Record<string, string>): string {
  const sorted = Object.keys(params).sort()
    .reduce((acc, key) => ({ ...acc, [key]: params[key] }), {} as Record<string, string>)

  const str = `HashKey=${HASH_KEY}&${new URLSearchParams(sorted).toString()}&HashIV=${HASH_IV}`
  return crypto.createHash('sha256').update(encodeURIComponent(str).toLowerCase()).digest('hex').toUpperCase()
}

export function createOrder(orderData: {
  merchantTradeNo: string
  totalAmount: number
  tradeDesc: string
  itemName: string
  returnURL: string
}) {
  const params = {
    MerchantID: MERCHANT_ID,
    MerchantTradeNo: orderData.merchantTradeNo,
    MerchantTradeDate: new Date().toLocaleDateString('zh-TW').replace(/\//g, '/'),
    PaymentType: 'aio',
    TotalAmount: String(orderData.totalAmount),
    TradeDesc: orderData.tradeDesc,
    ItemName: orderData.itemName,
    ReturnURL: orderData.returnURL,
    ChoosePayment: 'ALL',
    EncryptType: '1'
  }

  return {
    ...params,
    CheckMacValue: generateCheckMacValue(params),
    actionURL: 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5'
  }
}
```

---

## 部落格（Astro + MDX）

```
my-blog/
├── src/
│   ├── pages/
│   │   ├── index.astro       # 首頁
│   │   ├── blog/
│   │   │   ├── index.astro   # 文章列表
│   │   │   └── [slug].astro  # 文章詳情
│   ├── layouts/
│   │   └── PostLayout.astro
│   ├── components/
│   └── content/
│       └── blog/
│           ├── first-post.mdx
│           └── second-post.mdx
├── astro.config.mjs
└── package.json
```

```astro
---
// src/pages/blog/[slug].astro
import { getCollection, getEntry } from 'astro:content'
import PostLayout from '@/layouts/PostLayout.astro'

export async function getStaticPaths() {
  const posts = await getCollection('blog')
  return posts.map(post => ({ params: { slug: post.slug }, props: { post } }))
}

const { post } = Astro.props
const { Content } = await post.render()
---

<PostLayout title={post.data.title} date={post.data.date}>
  <Content />
</PostLayout>
```

---

## SEO 優化

```tsx
// Next.js Metadata API
// app/products/[slug]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug)

  return {
    title: `${product.name} | My Shop`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.image, width: 1200, height: 630 }]
    },
    alternates: {
      canonical: `https://myshop.com/products/${params.slug}`
    }
  }
}

// 結構化資料（JSON-LD）
function ProductSchema({ product }: { product: Product }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.image,
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'TWD',
          availability: 'https://schema.org/InStock'
        }
      })
    }} />
  )
}
```

---

## 部署

### Vercel（推薦 Next.js）

```bash
npm i -g vercel
vercel --prod
```

### Cloudflare Pages（推薦 Astro）

```bash
npm run build
# 上傳 dist/ 至 Cloudflare Pages
```

### 環境變數

```env
# .env.local
DATABASE_URL="postgresql://..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_URL="https://myshop.com"
ECPAY_MERCHANT_ID="..."
ECPAY_HASH_KEY="..."
ECPAY_HASH_IV="..."
```

## CSS 工具鏈設定

### 既有專案：優先偵測現有 UI 工具

**新增功能至既有網站前，先執行以下偵測，延續現有工具；若無則使用預設（Tailwind + PostCSS + SCSS）。**

```bash
# 1. 檢查 package.json 已安裝的 UI 框架
cat package.json | grep -E "tailwindcss|bootstrap|bulma|uikit|foundation|daisyui|@chakra-ui|@mui|antd|shadcn"

# 2. 檢查設定檔是否存在
ls tailwind.config.* postcss.config.* 2>/dev/null

# 3. 檢查全域樣式引入
grep -r "@tailwind\|bootstrap\|bulma\|uikit" src/ app/ --include="*.css" --include="*.scss" --include="*.ts" --include="*.tsx" 2>/dev/null | head -5

# 4. 檢查元件 class 命名風格
grep -r 'className="' components/ --include="*.tsx" 2>/dev/null | head -3
```

| 偵測結果 | 做法 |
|---------|------|
| 找到 `tailwindcss` | 延續 Tailwind，自訂以 SCSS + `@apply` 撰寫 |
| 找到 `bootstrap` | 延續 Bootstrap，自訂以 SCSS 撰寫並編譯 |
| 找到 `shadcn` / `@mui` / `@chakra-ui` | 延續該元件庫，自訂以 SCSS 或 CSS Modules 撰寫 |
| 找到其他框架（bulma / uikit 等） | 延續該框架，自訂以 SCSS 撰寫 |
| 未找到任何框架 | ↓ 使用以下預設設定 |

---

> **預設原則（新網站 / 無既有 UI 框架）**：所有樣式一律透過 TailwindCSS 撰寫；自訂元件以 SCSS 撰寫並編譯，不直接寫純 CSS。PostCSS 負責 autoprefixer 等後處理。

```bash
npm install -D tailwindcss postcss autoprefixer sass
npx tailwindcss init -p  # 同時產生 postcss.config.js
```

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './src/**/*.{astro,html,ts,tsx}'
  ],
  theme: { extend: {} },
  plugins: []
}
```

```js
// postcss.config.js（-p 旗標自動產生）
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

```scss
// src/styles/globals.scss — 取代純 CSS globals
@tailwind base;
@tailwind components;
@tailwind utilities;

// 自訂設計系統元件（SCSS + @apply，不用手寫 CSS 屬性）
@layer components {
  .btn {
    @apply inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-medium transition-colors;

    &-primary {
      @apply bg-blue-600 text-white hover:bg-blue-700;
    }

    &-outline {
      @apply border border-gray-300 bg-white text-gray-700 hover:bg-gray-50;
    }
  }

  .card {
    @apply rounded-2xl border border-gray-100 bg-white p-6 shadow-sm;

    &-title {
      @apply text-xl font-bold tracking-tight text-gray-900;
    }
  }
}

// 自訂 CSS 變數（設計 token）
@layer base {
  :root {
    --brand: theme('colors.blue.600');
    --brand-hover: theme('colors.blue.700');
  }
}
```

```tsx
// Next.js：在 app/layout.tsx 引入
import '@/src/styles/globals.scss'

// Astro：在 src/layouts/Base.astro 引入
// <style is:global>@import '../styles/globals.scss';</style>
```

## 快速參考

| 需求 | 工具 |
|------|------|
| UI 元件庫 | shadcn/ui + Tailwind CSS |
| 資料庫 ORM | Prisma + PostgreSQL |
| 認證 | NextAuth.js / Clerk |
| 圖片優化 | Next.js Image / Cloudinary |
| 搜尋 | Algolia / Meilisearch |
| Email | Resend / Nodemailer |
| 分析 | Google Analytics 4 / Plausible |
