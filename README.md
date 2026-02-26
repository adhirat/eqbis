# Eqbis Technologies - Corporate Website & Portal

A comprehensive, modern web presence for Eqbis Technologies featuring a sophisticated corporate website with an integrated client portal. This project showcases advanced web development with Firebase backend, stunning glassmorphic design, and enterprise-grade functionality. Eqbis is an all-in-one platform to equip businesses with all the necessary tools and templates.

## 🌟 Key Features

### Corporate Website

- **Futuristic Design**: Glassmorphic UI with animated gradients, floating orbs, and neon accent colors
- **Dark/Light Mode**: Seamless theme switching with persistent preferences
- **Responsive Layout**: Mobile-first design that adapts perfectly to all screen sizes
- **SEO Optimized**: Complete meta tags, structured data, and semantic HTML5
- **Performance**: Optimized loading with lazy images and modular JavaScript

### Client Portal (`/portal/`)

- **User Authentication**: Firebase-based login/signup with role-based access control (RBAC)
- **Dashboard**: Comprehensive admin interface with analytics and management tools
- **Project Management**: Track projects, contracts, invoices, and client communications
- **Content Management**: Article composer, newsletter management, and media handling
- **Real-time Features**: Live chat, notifications, and collaborative tools

## 🛠 Technology Stack

### Frontend

- **HTML5**: Semantic markup with accessibility features
- **Tailwind CSS**: Utility-first framework with custom glassmorphic components
- **Vanilla JavaScript**: Modular ES6+ architecture with no framework dependencies
- **Google Fonts**: Futuristic multi-font system (Orbitron, Rajdhani, Exo 2, Space Grotesk)

### Backend & Services

- **Firebase**: Authentication, Firestore database, Cloud Storage
- **Google Apps Script**: Email notifications and workflow automation
- **Google Analytics**: Advanced tracking and insights
- **Gmail API**: Transactional email delivery

### Infrastructure

- **Firebase Hosting**: CDN-enabled, SSL-secured hosting
- **GitHub Pages**: Primary deployment with custom domain (eqbis.com)
- **Cloudflare**: DNS management and performance optimization

## 📁 Project Structure

```
├── 📄 index.html                 # Corporate homepage
├── 📄 about.html                 # About us page
├── 📄 contact.html               # Contact form
├── 📄 legal.html                 # Legal & privacy
├──
├── 📂 portal/                    # Client portal directory
│   ├── 📄 index.html            # Portal dashboard
│   ├── 📄 login.html            # Authentication
│   ├── 📄 signup.html           # User registration
│   ├── 📄 profile.html          # User profile management
│   ├── 📄 projects.html         # Project management
│   ├── 📄 contracts.html        # Contract management
│   ├── 📄 invoice.html          # Invoice system
│   ├── 📄 composer.html          # Content composer
│   ├── 📄 newsletter.html       # Newsletter management
│   ├── 📄 users.html            # User administration
│   ├── 📄 roles.html            # Role management
│   └── 📂 partials/             # Portal components
│
├── 📂 assets/                   # Static assets
│   ├── 📂 css/
│   │   └── 📄 styles.css       # Custom styles & animations
│   ├── 📂 js/
│   │   ├── 📄 app.js           # Main application logic
│   │   ├── 📄 firebase-config.js # Firebase configuration
│   │   ├── 📄 firebase-modules.js # Firebase operations
│   │   ├── 📄 rbac.js          # Role-based access control
│   │   ├── 📄 composer.js      # Content editor
│   │   └── 📄 email-notifications.js # Email integration
│   └── 📂 images/              # Static images and assets
│
├── 📂 global/                  # Shared components
│   ├── 📄 header.html          # Reusable header
│   ├── 📄 footer.html          # Reusable footer
│   ├── 📄 mobile-menu.html     # Mobile navigation
│   └── 📄 cookie-consent.html  # Privacy compliance
│
├── 📂 docs/                    # Documentation
│   ├── 📄 email-notification-setup.md # Email setup guide
│   └── 📄 google-apps-script.gs      # Email automation script
│
├── 📄 firebase.json           # Firebase hosting config
├── 📄 firestore.rules         # Database security rules
├── 📄 storage.rules           # Storage security rules
├── 📄 .gitignore              # Git ignore patterns
├── 📄 CNAME                   # Custom domain configuration
└── 📄 README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 16+** (recommended for modern development)
- **Python 3.x** (alternative local server)
- **Firebase Project** (for portal functionality)
- **Google Account** (for email notifications)

### Local Development

1. **Clone Repository**

   ```bash
   git clone https://github.com/adhirat/adhirat.github.io.git
   cd adhirat.github.io
   ```

2. **Start Local Server**

   **Option A: Using Python (Recommended)**

   ```bash
   python3 -m http.server 8000
   ```

   **Option B: Using Node.js**

   ```bash
   npx http-server -p 8000 -c-1
   ```

3. **Access Application**
   - Corporate Site: `http://localhost:8000`
   - Client Portal: `http://localhost:8000/portal/`

### Firebase Setup (Portal Features)

1. **Create Firebase Project**
   - Visit [Firebase Console](https://console.firebase.google.com)
   - Create new project: "adhirat-technologies"

2. **Enable Services**
   - Authentication (Email/Password)
   - Firestore Database
   - Cloud Storage

3. **Configure Security Rules**

   ```bash
   # Apply existing rules
   firebase deploy --only firestore:rules,storage:rules
   ```

4. **Update Configuration**
   - Edit `/assets/js/firebase-config.js`
   - Replace placeholder with your Firebase config

## 🎨 Customization Guide

### Branding & Colors

Update the futuristic color palette in `/assets/js/app.js`:

```javascript
colors: {
    "neon-cyan": "#00f5ff",      // Primary accent
    "neon-violet": "#8b5cf6",    // Secondary accent
    "neon-magenta": "#ff00ff",   // Tertiary accent
    // ... more colors
}
```

### Typography

The project uses a multi-font system for a futuristic look:

- **Display**: Orbitron (headings)
- **Body**: Inter (content)
- **Accent**: Space Grotesk (highlights)

### Portal Customization

- **User Roles**: Modify `/assets/js/rbac.js` for permission levels
- **Email Templates**: Update `/docs/google-apps-script.gs`
- **Dashboard Widgets**: Edit `/portal/index.html`

## 🔧 Configuration

### Email Notifications

Follow the comprehensive setup guide in `/docs/email-notification-setup.md` to enable:

- Contact form notifications
- Newsletter subscription alerts
- System notifications

### Analytics & Tracking

- **Google Analytics**: Track page views and user behavior
- **Custom Events**: Monitor portal interactions
- **Performance**: Core Web Vitals monitoring

## 🌐 Deployment

### GitHub Pages (Production)

1. Push to `main` branch
2. Automatic deployment via GitHub Actions
3. Custom domain: `eqbis.com`

### Firebase Hosting (Alternative)

```bash
firebase init hosting
firebase deploy
```

## 🔐 Security Features

- **RBAC System**: Granular role-based permissions
- **Firebase Security Rules**: Database and storage protection
- **XSS Protection**: Input sanitization and CSP headers
- **HTTPS Only**: All communications encrypted
- **Rate Limiting**: Protection against abuse

## 📊 Performance Metrics

- **Lighthouse Score**: 95+ across all categories
- **Core Web Vitals**: Optimized for user experience
- **Bundle Size**: Minimal JavaScript footprint
- **Image Optimization**: Lazy loading and WebP support

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📝 License

© 2024 Eqbis Technologies. All rights reserved.

---

**Note**: This is a production-ready enterprise application with advanced features. For simple website hosting, only the corporate pages (outside `/portal/`) are required. The portal requires proper Firebase configuration and authentication setup.
