# Adhirat Project Overview

This document provides a comprehensive overview of the **Adhirat** application ecosystem, including the public-facing corporate website and the internal administration portal. It details the features, technical architecture, and functionality implemented to date.

## 1. Project Scope
**Adhirat** is a modern technological platform consisting of:
1.  **Public Website**: A futuristic, high-performance static site showcasing services, portfolio, and company information.
2.  **Adhirat Portal**: A secure, dynamic web application for internal management, client interactions, user administration, and organizational structuring.

## 2. Technology Stack
*   **Frontend**: Native HTML5, Modern JavaScript (ES6+ Modules), Tailwind CSS (via CDN).
*   **Design System**: "Glassmorphism" aesthetic with vibrant neon gradients, backdrop blurs, and dark/light mode support.
*   **Backend / Infrastructure**:
    *   **Google Firebase Auth**: User authentication and session management.
    *   **Google Firestore**: NoSQL cloud database for storing users, hierarchy, settings, and form submissions.
    *   **Google Analytics**: Web traffic monitoring.

---

## 3. Public Website Features
Located in the root directory, the public site serves as the brand's digital storefrtont.

*   **Premium UI/UX**:
    *   Scroll-triggered animations (`reveal`, `fade-in-up`).
    *   Interactive gradient borders and glowing "neon" effects.
    *   Responsive layouts compliant with mobile, tablet, and desktop.
*   **Core Pages**:
    *   `index.html`: Hero section, services brief, technologies slider, client reviews.
    *   `about.html`: Company solopreneur info, vision, and mission.
    *   `services.html` / `solutions.html`: Detailed service offerings.
    *   `contact.html`: Contact form integrated with logic to send email notifications.
*   **Footer**: Includes dynamic ABN/ACN company details and social media links.

---

## 4. Adhirat Portal (Web Application)
Located in the `/portal` directory, this is the core functional application.

### A. Authentication & Security
*   **Login Page** (`portal/login.html`):
    *   **Interactive Background**: Includes "floating icons" that magnetically drift towards the mouse cursor and bounce off screen edges.
    *   **Functionality**: Email/Password login, Google OAuth integration.
*   **RBAC (Role-Based Access Control)**:
    *   Users are assigned roles (e.g., Admin, Employee, Guest).
    *   Sidebar menu items and specific page actions (like "Delete User") are guarded based on permissions.

### B. Navigation & Layout
*   **Sidebar** (`portal/partials/sidebar.html`):
    *   **Collapsible**: Optimizes screen real estate.
    *   **Section Dividers**: Visual separators (solid lines) distinguish menu groups (Admin, Communication, Finance, etc.).
    *   **Permission-Aware**: Menu items hide automatically if the user lacks the required role.
*   **Header** (`portal/partials/header.html`):
    *   **Dynamic Breadcrumbs**: Automatically tracks the current page location (e.g., `Portal > User Management`).
    *   **Global Actions**: Theme toggle (Dark/Light), Notifications dropdown, Profile menu, and Logout.

### C. Core Modules

#### 1. User Management (`portal/users.html`)
A centralized hub for managing portal access.
*   **User List**: Tabular view of all registered users with searching and filtering by Role.
*   **Unique Identities**:
    *   **User ID Generation**: Automatically generates readable IDs (e.g., `ADH-1004`) for new users upon creation.
    *   **Visuals**: Lists user avatars (initials on colored background) and roles (colored chips: Admin, Employee, etc.).
*   **Actions**:
    *   **Create User**: Admin can create new accounts with assigned roles.
    *   **Assign Roles**: Modal interface to toggle multiple roles for a single user.
    *   **Delete User**: Remove user access from the system.

#### 2. Organization Hierarchy (`portal/hierarchy.html`)
A visual tool to define and view the company's reporting structure.
*   **Features**:
    *   **Tree Diagram**: Recursive rendering of the organization chart starting from the CEO.
    *   **Dynamic Nodes**: Nodes act as containers for Roles (e.g., "CTO") and Assigned Persons.
    *   **Live User Mapping**:
        *   **Search/Select**: "Assigned Person" field is a dropdown populated dynamically from the **User Management** database.
        *   **Avatar Rendering**: Mapped users display their calculated initials on a uniquely colored badge right on the tree node.
    *   **Persistence**: The entire tree structure is saved as a single JSON object in Firestore (`settings/organization`), ensuring the structure remains consistent across sessions.
    *   **Editability**: Add child nodes (reports) or delete entire branches.

#### 3. Content & Communication (Planned/Partial)
*   **Applications** (`portal/applications.html`): Tracking job applicants.
*   **Newsletter** (`portal/newsletter.html`): Managing email campaigns.
*   **Articles**: Blog post management.

#### 4. Finance & Operations (Planned/Partial)
*   **Invoices** (`portal/invoice.html`) & **Payroll**: Financial record tracking.
*   **Contracts** & **Projects**: Business operations management.

---

## 5. Development Workflow
*   **Folder Structure**:
    *   `/assets`: Shared CSS (Tailwind config), JS (Firebase modules), and Images.
    *   `/portal`: Application HTML files.
    *   `/portal/partials`: Reusable HTML components (Sidebar, Header) injected via JS.
*   **Deployment**: Hosted on GitHub Pages (static serving).

## 6. Recent Enhancements (Session Log)
1.  **Floating Icons**: Enhanced login screen animations with physics-based movement (magnetism, collision).
2.  **Sidebar UX**: Improved visual separation with dividers.
3.  **Breadcrumbs**: Implemented universal breadcrumb navigation in the header.
4.  **Hierarchy**: Full implementation of the Org Chart with Firebase storage and User Database integration.
5.  **User IDs**: Implemented auto-incrementing `ADH-XXXX` custom IDs for better user tracking.
