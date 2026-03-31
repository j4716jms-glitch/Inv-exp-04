# 📦 InventoryOS — Inventory Management Dashboard

A production-grade, full-stack inventory dashboard built with **Next.js 14 (App Router)**, **Vercel Blob** storage, Excel/CSV parsing, and a mobile-first UI.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔒 Access Control | Key-based auth via `AUTHORIZED_USERS` env variable |
| 📁 File Manager | Upload, list & delete `.xlsx` / `.xls` / `.csv` files in Vercel Blob |
| 📊 Excel Parsing | Multi-sheet support — all sheets merged into one searchable dataset |
| 🔍 Live Search | Global full-text search across all columns |
| 🏷️ Category Filter | Auto-detected category column dropdown |
| ↕️ Sortable Table | Click any column header to sort |
| 📱 Mobile Cards | Automatic card layout on small screens |
| 💰 Indian Locale | `₹` symbol with `en-IN` number formatting |
| 📤 CSV Export | Export filtered results to CSV in one click |
| 🎨 Branded | Customize name, logo & theme colour in `settings.config.ts` |

---

## 🚀 Quick Start

### Step 1 — Clone & install dependencies

```bash
git clone https://github.com/YOUR_USERNAME/inventory-dashboard.git
cd inventory-dashboard

npm install
```

> **Full dependency list installed:**
> `next`, `react`, `react-dom`, `@vercel/blob`, `xlsx`, `lucide-react`, `tailwindcss`, `autoprefixer`, `postcss`, `typescript`

---

### Step 2 — Create your environment file

Copy the template:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in the values:

```env
# Vercel Blob token (get from Vercel Dashboard → Storage → Blob)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXXXXXXXXXXXXX

# Comma-separated access keys (no spaces)
AUTHORIZED_USERS=admin-key-123,manager-key-456
```

> ⚠️ **Never commit `.env.local` to Git.** It's in `.gitignore` already.

---

### Step 3 — Customize branding

Edit `src/config/settings.config.ts`:

```ts
export const USER_NAME    = 'Your Name';
export const LOGO_URL     = '/logo.svg';      // replace with your logo
export const THEME_COLOR  = '#0f766e';         // any hex colour
export const APP_TITLE    = 'InventoryOS';
export const APP_TAGLINE  = 'Real-time stock intelligence';
```

Place your logo at `public/logo.svg` (or update `LOGO_URL` to a remote URL).

---

### Step 4 — Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You'll be greeted by the access-key modal. Enter any key from `AUTHORIZED_USERS`.

---

## ☁️ Deploy to Vercel (full walkthrough)

### Step A — Push to GitHub

```bash
git init
git add .
git commit -m "feat: initial inventory dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/inventory-dashboard.git
git push -u origin main
```

---

### Step B — Create a Vercel project

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Vercel auto-detects **Next.js** — no framework config needed
4. Click **Deploy** (it will fail on first try — that's okay, we need env vars next)

---

### Step C — Set up Vercel Blob storage

1. In your Vercel project → **Storage** tab → **Create Database** → choose **Blob**
2. Name it anything (e.g. `inventory-blob`)
3. Click **Create** → Vercel auto-adds `BLOB_READ_WRITE_TOKEN` to your project

---

### Step D — Add environment variables

In your Vercel project → **Settings** → **Environment Variables**:

| Name | Value | Environment |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | *(auto-added by Blob storage)* | Production, Preview, Development |
| `AUTHORIZED_USERS` | `admin-key-123,manager-key-456` | Production, Preview, Development |

---

### Step E — Redeploy

```bash
# Trigger a new deployment
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

Or click **Redeploy** in the Vercel dashboard.

---

### Step F — Pull env vars for local development

```bash
npm i -g vercel
vercel login
vercel link          # link to your Vercel project
vercel env pull      # downloads .env.local automatically
```

---

## 📁 Project Structure

```
inventory-dashboard/
├── public/
│   └── logo.svg                     # Your brand logo
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── upload/route.ts      # POST — upload file to Vercel Blob
│   │   │   ├── delete/route.ts      # DELETE — remove file from Blob
│   │   │   ├── list-files/route.ts  # GET — list all spreadsheet blobs
│   │   │   └── verify-key/route.ts  # POST — validate access key
│   │   ├── globals.css              # Tailwind + custom tokens
│   │   ├── layout.tsx               # Root layout with metadata
│   │   └── page.tsx                 # Main app shell (auth + layout)
│   ├── components/
│   │   ├── AccessKeyModal.tsx       # Auth gate modal
│   │   ├── FileUploader.tsx         # Drag-drop uploader + file list
│   │   ├── Header.tsx               # Top navigation bar
│   │   └── InventoryDashboard.tsx   # Full dashboard (search/sort/export)
│   ├── config/
│   │   └── settings.config.ts       # 🎨 Brand customization
│   └── lib/
│       └── ExcelParser.ts           # Multi-sheet xlsx/csv parser
├── .env.local.example               # Environment template
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## 🔌 API Reference

### `POST /api/upload`
Upload a spreadsheet file.

**Body:** `multipart/form-data` with field `file`

**Response:**
```json
{
  "url": "https://xxx.blob.vercel-storage.com/inventory.xlsx",
  "downloadUrl": "...",
  "pathname": "inventory-abc123.xlsx",
  "size": 204800,
  "uploadedAt": "2024-01-15T10:30:00Z"
}
```

---

### `DELETE /api/delete`
Delete a file from Blob storage.

**Body:** `{ "url": "https://xxx.blob.vercel-storage.com/..." }`

**Response:** `{ "deleted": true, "url": "..." }`

---

### `GET /api/list-files`
List all uploaded spreadsheet files.

**Response:**
```json
{
  "files": [
    {
      "url": "...",
      "downloadUrl": "...",
      "pathname": "inventory-abc123.xlsx",
      "size": 204800,
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### `POST /api/verify-key`
Validate an access key against `AUTHORIZED_USERS`.

**Body:** `{ "key": "admin-key-123" }`

**Response:** `{ "valid": true }`

---

## 📊 Excel File Format

The parser is **column-name agnostic** — it auto-detects common patterns:

| Auto-detected | Matched column names |
|---|---|
| Product Name | `name`, `product`, `item`, `sku`, `title` |
| Stock Qty | `stock`, `qty`, `quantity`, `units`, `count` |
| Unit Price | `price`, `cost`, `mrp`, `rate`, `value` |
| Category | `category`, `type`, `group`, `dept` |

**Multi-sheet support:** All sheets are merged. A hidden `_sheet` column tracks the source sheet.

**Sample column headers that work well:**
```
Name | Category | Stock | Price | SKU | Supplier | Location
```

---

## 🎨 Customization Guide

### Change theme colour
In `settings.config.ts`, change `THEME_COLOR` to any hex value.
The UI updates across all components automatically.

### Add more authorized users
In Vercel → Environment Variables, update `AUTHORIZED_USERS`:
```
alice-key-789,bob-key-321,admin-key-123
```

### Change page size
```ts
// settings.config.ts
export const DEFAULT_PAGE_SIZE = 50; // default is 25
```

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Storage:** Vercel Blob (`@vercel/blob`)
- **Excel Parsing:** `xlsx` (SheetJS)
- **Styling:** Tailwind CSS
- **Icons:** `lucide-react`
- **Fonts:** Syne (display) + DM Sans (body) + JetBrains Mono
- **Deployment:** Vercel

---

## 📝 License

MIT — free for personal and commercial use.
