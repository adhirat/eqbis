# Eqbis Project Overview

This document provides a comprehensive overview of the **Eqbis** modern application ecosystem, managed through a high-performance monorepo architecture.

## 1. Project Architecture (Monorepo)

Eqbis utilizes a **Turborepo** monorepo structure to manage multiple applications and shared packages:

- **`apps/web`**: The primary web application (Next.js). Handles both the public corporate site and the internal administration portal.
- **`apps/mobile`**: The cross-platform mobile application (Flutter).
- **`packages/`**: Shared logic, including:
  - `@eqbis/db`: Drizzle ORM schema and database clients.
  - `@eqbis/ui`: (Planned) Shared component library.
- **`_legacy/`**: Archive of the original static HTML/Firebase version of the platform.

## 2. Technology Stack (Web App)

- **Frontend**: Next.js 16/15 (App Router), React 19, Tailwind CSS 4.
- **Design System**: "Glassmorphism" aesthetic with neon gradients, backdrop blurs, and seamless Dark/Light mode support.
- **Backend / Infrastructure**:
  - **Better-Auth**: Secure, multi-tenant authentication.
  - **Drizzle ORM**: Type-safe database management.
  - **Cloudflare Pages**: High-performance deployments with edge-side rendering.
  - **Neon**: Serverless PostgreSQL database for the core platform data.

---

## 3. Web Application Features

The Next.js application in `apps/web` consolidates all business functions:

### A. Branding & Marketing

- **Futuristic UI**: High-end landing pages with scroll-triggered animations and interactive neon elements.
- **Theming**: Integrated theme provider support for a consistent brand experience across all layers.

### B. Eqbis Portal (Internal Hub)

A secure, unified management interface featuring:

- **HR & Operations**:
  - **Employee Management**: Comprehensive user tracking with custom IDs (`ADH-XXXX`).
  - **Organization Hierarchy**: Dynamic, recursive Org Chart with Firestore persistence.
  - **Timesheets & Payroll**: Centralized financial tracking.
- **Finance & Sales**:
  - **Invoicing**: Integrated billing system.
  - **CRM**: Client management and relationship tracking.
- **Communication**:
  - **Campaigns & Articles**: CMS-like functionality for marketing and internal comms.

---

## 4. Development Workflow

- **Local Development**: `npm run dev` (Runs Turborepo orchestrated development).
- **Build & Deployment**: Managed via GitHub Actions and Cloudflare/Codemagic pipelines.
- **Folder Conventions**:
  - All active code resides in `apps/web/src` or `apps/mobile/lib`.
  - Shared logic is abstracted into `packages/`.
  - Root-level scripts are used for cross-workspace tasks (e.g., `db:migrate`).

---

## 5. Recent Enhancements

1.  **Monorepo Consolidation**: Cleaned up root-level redundant folders and migrated all active logic to `apps/web`.
2.  **Brand Identity**: Established a futuristic, text-free logo symbol optimized for dual-theme UI.
3.  **Modern Auth**: Implementation of Better-Auth for robust multi-tenant security.
4.  **Edge Integration**: Optimized for Cloudflare Workers/Pages deployment.

---

_Last Updated: February 2026_
