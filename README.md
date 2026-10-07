# WorkLink 🛠️

**WorkLink** is a modern, trusted marketplace platform connecting clients with vetted skilled trade professionals and digital specialists. Built with Next.js 14 App Router, TypeScript, Tailwind CSS, Neon Serverless PostgreSQL, and Drizzle ORM.

---

## 🚀 Live Vercel Deployment Guide

### 1. Database Connection (Neon via Vercel Marketplace)
WorkLink is built natively for **Neon Serverless PostgreSQL** using `@neondatabase/serverless` and `drizzle-orm/neon-http`.
1. Deploy your repository to **Vercel**.
2. In the Vercel Dashboard for your project, go to the **Storage** tab.
3. Select **Neon** and click **Connect**.
4. Vercel automatically provisions and injects `DATABASE_URL` (as well as pooler settings) into your project's environment variables.

### 2. Configure Environment Variables in Vercel
In your Vercel Project Settings > **Environment Variables**, verify or set:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL connection string (auto-injected by Vercel Neon integration) | `postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `AUTH_SECRET` | 32+ character secret for JWT session signing | `worklink-super-secret-jwt-key-production-ready` |
| `NEXT_PUBLIC_APP_URL` | Production application URL | `https://your-worklink-app.vercel.app` |

> **Important**: Never commit `.env` files or secrets to source control. Only commit `.env.example`.

### 3. One-Time Production Migration Order
Do **NOT** run database migrations automatically on every Vercel build. This prevents concurrent migration lockups and unintentional schema modifications during preview deployments.

**Safe Deployment Order**:
1. Connect Neon in the Vercel Dashboard to obtain your `DATABASE_URL`.
2. Run the one-time migration command locally with your production Neon connection string:
   ```bash
   DATABASE_URL="your_neon_production_connection_string" npm run db:migrate
   ```
3. (Optional) Run the development-only seed script if you want initial demo accounts and listings on a staging/demo instance:
   ```bash
   DATABASE_URL="your_neon_production_connection_string" npm run db:seed
   ```
4. Deploy to Vercel (or trigger a redeploy if the build already completed).

---

## 🛠️ Local Development

### 1. Clone & Install
```bash
git clone https://github.com/abdulwaris707/worklink.git
cd worklink
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your Neon PostgreSQL connection string:
```env
DATABASE_URL=postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
AUTH_SECRET=worklink-super-secret-jwt-key-production-ready-min-32-chars
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Generate & Apply Migrations
```bash
# Generate SQL migrations if schema changes
npm run db:generate

# Apply migrations to your Neon database
npm run db:migrate

# Seed development demo data (Jessica, Marcus, Elena, services, reviews, bookings)
npm run db:seed
```

### 4. Run Development Server & Drizzle Studio
```bash
# Start local Next.js dev server
npm run dev

# Open Drizzle Studio visual database inspector
npm run db:studio
```
Visit `http://localhost:3000` in your browser.

---

## 📦 NPM Package Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `next dev` | Start development server |
| `npm run build` | `next build` | Build production Next.js application bundle |
| `npm run start` | `next start` | Run Next.js production server |
| `npm run lint` | `next lint` | Run ESLint validation |
| `npm run typecheck` | `tsc --noEmit` | Validate TypeScript types |
| `npm run db:generate` | `drizzle-kit generate` | Generate SQL migration files in `./drizzle` |
| `npm run db:migrate` | `drizzle-kit migrate` | Apply migrations to Neon PostgreSQL |
| `npm run db:seed` | `tsx scripts/seed.ts` | Seed demo client, workers, services & bookings |
| `npm run db:studio` | `drizzle-kit studio` | Launch Drizzle Studio web GUI |

---

## 👥 Demo Accounts (Created by `npm run db:seed`)

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Client** | `client@worklink.com` | `password123` | Jessica Reynolds, Seattle WA |
| **Worker 1** | `marcus@worklink.com` | `password123` | Marcus Vance, Master Electrician & Smart Home Pro |
| **Worker 2** | `elena@worklink.com` | `password123` | Elena Rostova, Deep Cleaning & Sanitation Pro |

---

## 🔌 External Services & Credentials Status

| Feature | Current State | Required Live Credentials When Launching |
| :--- | :--- | :--- |
| **Database** | Fully configured for **Neon PostgreSQL** via Drizzle ORM | `DATABASE_URL` (injected via Vercel) |
| **Authentication** | Complete (JWT HTTP-only cookies + bcryptjs password hashing) | `AUTH_SECRET` |
| **Payments** | Fully implemented with card validation & test receipt generation | `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET` (if transitioning from test card mode to live Stripe Checkout/Elements) |
| **Realtime Chat** | In-app transactional messaging with read receipts & booking context | Pusher / Ably / WebSockets (if instant bi-directional push is needed without HTTP polling) |
| **Email Notifications**| In-app notification bell & activity logging | Resend / SendGrid / Postmark API key (`RESEND_API_KEY`) for transactional outbound emails |
| **Storage / Uploads** | Direct URL & image link support | AWS S3 / Cloudflare R2 / Uploadthing / Vercel Blob (`BLOB_READ_WRITE_TOKEN`) for direct binary file uploads |
