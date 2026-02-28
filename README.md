# Eqbis Monorepo

Welcome to the **Eqbis** monorepo. This project contains the complete source code for the Eqbis ecosystem—a modern, high-performance all-in-one business platform.

## 🚀 Project Overview

Eqbis is a multi-tenant SaaS platform that unifies HR, Finance, CRM, Project Management, and more into a single, cohesive workspace. It features a futuristic, premium "Glassmorphism" aesthetic with full light and dark mode support.

## 🛠 Technology Stack

### **Web Application (`apps/web`)**

- **Frontend**: Next.js 16/15 (App Router), React 19, Tailwind CSS 4.
- **Backend / Infrastructure**: Better-Auth (Secure Multi-tenant Auth), Drizzle ORM, Cloudflare Pages (Edge Rendering).
- **Database**: Neon (Serverless PostgreSQL).

### **Mobile Application (`apps/mobile`)**

- **Framework**: Flutter, Dart.
- **Platforms**: iOS, Android.

### **Shared Packages (`packages/`)**

- **@eqbis/db**: Centralized Drizzle ORM schema and database clients.
- **@eqbis/ui**: (Planned) Shared design system and component library.

## 📁 Repository Structure

```text
.
├── apps/
│   ├── web/            # Next.js Web App (Marketing & Portal)
│   └── mobile/         # Flutter Mobile App
├── packages/
│   └── db/             # Shared Database Logic & Migrations
├── turbo.json          # Turborepo orchestration
└── package.json        # Root workspace configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Latest LTS version.
- **Flutter SDK**: Required for mobile development.
- **Neon Account**: Required for the database (PostgreSQL).

### Installation

From the root directory, install all dependencies for the entire monorepo:

```bash
npm install
```

### Running the Applications

We use **Turborepo** to orchestrate development across the monorepo.

```bash
# Start the Web Application (Local Development)
npm run dev

# Build all applications and packages
npm run build

# Manage Database (Shared Package)
npm run db:generate
npm run db:migrate
```

## ✨ Key Features

### **Branding & Marketing**

- **High-end UI**: Futuristic landing pages with scroll animations and interactive neon elements.
- **Modular Branding**: Unified "Digital Puzzle Box" logo optimized for dual-theme UI.

### **The Eqbis Portal**

A secure, unified management interface featuring:

- **HR & Operations**: Employee management, hierarchy tracking, and timesheets.
- **Finance**: Integrated invoicing and payroll systems.
- **Sales & CRM**: Comprehensive client relationship and lead tracking.
- **Communications**: Integrated CMS for marketing campaigns and internal articles.

## 🚀 Deployment & CI/CD

- **Web**: Deployed to **Cloudflare Pages** for global, low-latency edge performance.
- **Mobile**: CI/CD pipelines managed via **Codemagic** for automated iOS/Android builds.
- **Database**: Continuous migrations using **Drizzle Kit** synced with **Neon**.

---

_Last Updated: February 2026_
_Created by the Eqbis Engineering Team._
