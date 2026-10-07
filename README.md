# WorkLink 🛠️

**WorkLink** is a modern, trusted marketplace platform connecting clients with vetted skilled trade professionals and digital specialists. Built with Next.js 14 App Router, TypeScript, Tailwind CSS, and Prisma ORM.

---

## 🚀 Live Vercel Deployment Guide

### 1. Database Setup (Production)
WorkLink uses PostgreSQL with Prisma ORM. For deployment on Vercel, connect a hosted PostgreSQL database (such as **Neon**, **Supabase**, or **Vercel Postgres**):
1. Create a free PostgreSQL instance on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Copy your PostgreSQL pooled connection string.

### 2. Configure Environment Variables in Vercel
In your Vercel Project Settings > **Environment Variables**, set:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@ep-xyz.neon.tech/worklink?sslmode=require` |
| `JWT_SECRET` | 32+ character secret for session signing | `worklink-super-secret-jwt-key-production-ready` |
| `NEXT_PUBLIC_APP_URL` | Production domain | `https://your-app.vercel.app` |

### 3. Push Database Schema to Production
From your local terminal, you can push the schema and seed demo data to your hosted database:
```bash
# Push schema
DATABASE_URL="your_hosted_postgres_url" npx prisma db push

# Optional: Seed demo data
DATABASE_URL="your_hosted_postgres_url" node prisma/seed.js
```

---

## 🛠️ Local Development

### 1. Clone & Install
```bash
git clone https://github.com/abdulwaris707/worklink.git
cd worklink
npm install
```

### 2. Configure Local Database
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `DATABASE_URL` with your local PostgreSQL credentials:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/worklink?schema=public"
JWT_SECRET="worklink-super-secret-jwt-key-production-ready-min-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Sync Database & Seed
```bash
npm run db:push
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Visit `http://localhost:3000` in your browser.

---

## 👥 Demo Accounts

Use one-click demo login buttons or manual credentials:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Client** | `client@worklink.com` | `password123` | Jessica Reynolds, Seattle WA |
| **Worker 1** | `marcus@worklink.com` | `password123` | Marcus Vance, Master Electrician & Smart Home Pro |
| **Worker 2** | `elena@worklink.com` | `password123` | Elena Rostova, Deep Cleaning & Sanitation Pro |

---

## ✨ Features

- **Public Marketplace**:
  - Landing page with categories, search, how it works, and featured verified pros.
  - Searchable worker directory with filters (category, rating, location, verified status, price).
  - Worker detail profiles (`/workers/[slug]`) with service menu, portfolio gallery, and reviews.
- **Client Experience**:
  - Step-by-step booking modal with schedule selector and job details.
  - Client dashboard with active bookings, status timelines, and cancel options.
  - Real-time in-app messaging thread with booking context banner.
  - Test mode card payments with instant receipt generation.
  - Verified review submission.
- **Worker Experience**:
  - Worker dashboard with new booking requests (Accept / Decline).
  - Complete job lifecycle (`ACCEPTED` ➔ `IN_PROGRESS` ➔ `COMPLETED`).
  - Private booking notes for entry codes and supplies.
  - Service management (create, update pricing, toggle on/off, delete).
  - Weekly availability schedule and vacation switch.
  - Revenue tracking and itemized earnings breakdown.
  - Client review replies.
- **Security & Architecture**:
  - Role-protected routes (`/client/*` vs `/worker/*`) via Next.js Middleware.
  - HTTP-only JWT session cookies with `bcryptjs` password hashing.
  - Server-side validation and atomic database transactions.
