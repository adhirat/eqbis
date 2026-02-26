tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Futuristic Multi-Color Palette
                "primary": "#8b5cf6",
                "primary-light": "#a78bfa",
                "primary-dark": "#7c3aed",
                "neon-cyan": "#00f5ff",
                "neon-magenta": "#ff00ff",
                "neon-violet": "#8b5cf6",
                "neon-blue": "#0ea5e9",
                "neon-pink": "#ec4899",
                "neon-green": "#22d3ee",
                "accent": "#ec4899",
                "accent-alt": "#f97316",
                "background-light": "#f8fafc",
                "background-subtle": "#f1f5f9",
                "dark-bg": "#0f0f23",
                "dark-card": "#1a1a3e",
                "dark-surface": "#2d1b4e",
            },
            fontFamily: {
                // Futuristic Multi-Font System
                "futuristic": ["Orbitron", "Space Grotesk", "sans-serif"],
                "display": ["Rajdhani", "Space Grotesk", "sans-serif"],
                "heading": ["Exo 2", "Space Grotesk", "sans-serif"],
                "body": ["Inter", "Noto Sans", "sans-serif"],
                "accent": ["Space Grotesk", "sans-serif"],
            },
            borderRadius: {
                "DEFAULT": "0.5rem",
                "lg": "0.75rem",
                "xl": "1rem",
                "2xl": "1.25rem",
                "3xl": "1.5rem",
                "full": "9999px"
            },
            backgroundImage: {
                'gradient-futuristic': 'linear-gradient(135deg, #00f5ff 0%, #8b5cf6 50%, #ff00ff 100%)',
                'gradient-aurora': 'linear-gradient(135deg, #00f5ff 0%, #22d3ee 25%, #8b5cf6 50%, #ec4899 75%, #ff00ff 100%)',
                'gradient-cosmic': 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 25%, #2d1b4e 50%, #1e1e4a 75%, #0a0a1a 100%)',
                'gradient-neon': 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)',
            },
            boxShadow: {
                'neon': '0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(0, 245, 255, 0.2)',
                'neon-lg': '0 0 40px rgba(139, 92, 246, 0.4), 0 0 80px rgba(0, 245, 255, 0.3)',
                'glow-cyan': '0 0 30px rgba(0, 245, 255, 0.5)',
                'glow-violet': '0 0 30px rgba(139, 92, 246, 0.5)',
                'glow-magenta': '0 0 30px rgba(255, 0, 255, 0.5)',
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
                'gradient-flow': 'gradientFlow 6s ease infinite',
                'glow-pulse': 'glowPulse 3s ease-in-out infinite',
                'aurora-shift': 'auroraShift 10s ease-in-out infinite',
                'neon-flicker': 'neonFlicker 3s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                gradientFlow: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                glowPulse: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(0, 245, 255, 0.5)' },
                },
                auroraShift: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '25%': { backgroundPosition: '50% 0%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '75%': { backgroundPosition: '50% 100%' },
                },
                neonFlicker: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.8' },
                    '75%': { opacity: '1' },
                    '85%': { opacity: '0.9' },
                }
            }
        },
    },
}

// Simple script to handle theme toggling for demonstration
function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}

// Initialize mobile menu to ensure it's hidden by default
function initMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) {
        // Force menu to be hidden initially with multiple methods
        menu.classList.add('translate-x-full');
        menu.classList.remove('show');
        menu.style.transform = 'translateX(100%)';
        document.body.classList.remove('overflow-hidden');

        // Also hide any potential backdrop overlay
        const backdrop = document.querySelector('.mobile-menu-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
    }
}

// Script to handle mobile menu toggling
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const body = document.body;

    if (!menu) return;

    const isOpen = !menu.classList.contains('translate-x-full');

    if (isOpen) {
        // Close menu
        menu.classList.add('translate-x-full');
        menu.classList.remove('show');
        menu.style.transform = 'translateX(100%)';
        body.classList.remove('overflow-hidden');

        // Remove any backdrop
        const backdrop = document.querySelector('.mobile-menu-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
    } else {
        // Open menu
        menu.classList.remove('translate-x-full');
        menu.classList.add('show');
        menu.style.transform = 'translateX(0)';
        body.classList.add('overflow-hidden');

        // Create backdrop if needed
        if (!document.querySelector('.mobile-menu-backdrop')) {
            const backdrop = document.createElement('div');
            backdrop.className = 'mobile-menu-backdrop fixed inset-0 bg-black/50 z-50';
            backdrop.onclick = toggleMobileMenu;
            document.body.appendChild(backdrop);
        }
    }
}

// Global logout handler for portal pages
// Uses dynamic import to load Firebase signOut
async function handleLogout() {
    try {
        const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
        const { auth } = await import('./firebase-config.js');
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed. Please try again.');
    }
}

// Check for saved theme preference - default to system preference
if ('theme' in localStorage) {
    // Use saved user preference
    if (localStorage.theme === 'light') {
        document.documentElement.classList.remove('dark');
    } else {
        document.documentElement.classList.add('dark');
    }
} else {
    // No saved preference - use system preference (but don't persist it)
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// Cache version - increment this when you update header/footer/mobile-menu
const CACHE_VERSION = 'v11';

function loadHTML(id, file) {
    const cacheKey = `${file}_${CACHE_VERSION}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
        document.getElementById(id).innerHTML = cached;
        afterLoad();
        return;
    }

    // Clear old cached versions of this file
    Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith(file)) {
            sessionStorage.removeItem(key);
        }
    });

    fetch(file)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${file}`);
            }
            return response.text();
        })
        .then(html => {
            sessionStorage.setItem(cacheKey, html);
            document.getElementById(id).innerHTML = html;
            afterLoad();
        })
        .catch(error => console.error(error));
}


function afterLoad() {
    // Re-initialize mobile menu to ensure it's hidden after loading
    initMobileMenu();
    highlightActiveNav();
    initScrollAnimations();
    initTiltEffect();
    initSidebarSections();
    initSidebarToggle();
    initSidebarSearch();
    initSidebarExpandToggle();
    initSidebarTooltips();
    initHeaderScroll();
    generateBreadcrumbs(); // Initialize breadcrumbs for portal pages

    // Try to update user UI if firebase module is already loaded
    if (window.refreshGlobalUserUI) {
        window.refreshGlobalUserUI();
    }
}

// Portal Breadcrumb Logic
function generateBreadcrumbs() {
    const nav = document.getElementById('breadcrumb-nav');
    if (!nav) return;

    const pageConfig = {
        'index.html': { title: 'Home', parent: null },
        'profile.html': { title: 'Profile Settings', parent: 'index.html' },
        'users.html': { title: 'User Management', parent: 'index.html' },
        'organization.html': { title: 'Organisation', parent: 'index.html' },
        'roles.html': { title: 'Role Management', parent: 'index.html' },
        'activity-log.html': { title: 'Activity Log', parent: 'index.html' },
        'subscriptions.html': { title: 'Subscriptions', parent: 'index.html' },
        'submissions.html': { title: 'Form Submissions', parent: 'index.html' },
        'newsletter.html': { title: 'Newsletter Management', parent: 'index.html' },
        'articles.html': { title: 'Blog Articles', parent: 'index.html' },
        'clients.html': { title: 'Client Management', parent: 'index.html' },
        'projects.html': { title: 'Project Management', parent: 'index.html' },
        'contracts.html': { title: 'Contract Management', parent: 'index.html' },
        'invoice.html': { title: 'Invoices', parent: 'index.html' },
        'payslip.html': { title: 'Receipts', parent: 'index.html' },
        'timesheets.html': { title: 'Timesheets', parent: 'index.html' },
        'leaves.html': { title: 'Leave Management', parent: 'index.html' },
        'careers.html': { title: 'Careers', parent: 'index.html' },
        'applications.html': { title: 'Job Applications', parent: 'index.html' },
        'calendar.html': { title: 'Calendar', parent: 'index.html' },
        'documents.html': { title: 'Documents', parent: 'index.html' },
        'hierarchy.html': { title: 'Hierarchy', parent: 'index.html' },
        'settings.html': { title: 'Settings', parent: 'index.html' },
        'support.html': { title: 'Support Tickets', parent: 'index.html' },
        'store.html': { title: 'Online Store', parent: 'index.html' },
        'campaigns.html': { title: 'Fundraising Campaigns', parent: 'index.html' },
        'campaign-manage.html': { title: 'Manage Campaign', parent: 'campaigns.html' },
        'courses.html': { title: 'Learning Center', parent: 'index.html' },
        'course-view.html': { title: 'Course Content', parent: 'courses.html' },
        'real-estate.html': { title: 'Real Estate', parent: 'index.html' },
        'composer.html': { title: 'Composer', parent: 'websites.html' },
        'websites.html': { title: 'Websites', parent: 'index.html' },
        'media.html': { title: 'Media Manager', parent: 'index.html' },
        'reports.html': { title: 'Reports & Analytics', parent: 'index.html' },
        'knowledge-base.html': { title: 'Knowledge Base', parent: 'index.html' }
    };

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    // Handle root or empty paths
    const activePage = (currentPage === "" || currentPage === "/") ? "index.html" : currentPage;
    // Default to just the page title capitalized if not in config
    const defaultConfig = { title: activePage.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), parent: 'index.html' };

    // Build path from current page up to root
    const crumbs = [];
    let page = activePage;

    // Dynamic Context overrides
    if (page === 'profile.html' && window.location.search.includes('userId')) {
        pageConfig['profile.html'] = { title: 'User Profile', parent: 'users.html' };
    }

    let config = pageConfig[page] || defaultConfig;

    // Safety break to prevent infinite loops if config has cycles
    let depth = 0;
    while (page && (pageConfig[page] || page === activePage) && depth < 10) {
        config = pageConfig[page] || defaultConfig;
        crumbs.unshift({ page, title: config.title });
        page = config.parent;
        depth++;
    }

    // Always ensure Portal root is first
    if (crumbs.length === 0 || crumbs[0].page !== 'index.html') {
        const hasIndex = crumbs.find(c => c.page === 'index.html');
        if (!hasIndex) {
            crumbs.unshift({ page: 'index.html', title: 'Portal' });
        } else {
            // Rename 'Home' to 'Portal' for context
            hasIndex.title = 'Portal';
        }
    } else {
        crumbs[0].title = 'Portal';
    }

    // Generate HTML
    nav.innerHTML = crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        const separator = !isLast ? `<span class="material-symbols-outlined text-[16px] text-neon-violet/50 dark:text-neon-cyan/50 self-center mt-0.5">chevron_right</span>` : '';

        // Added 'flex items-center' to ensure vertical centering of text and separator
        if (isLast) {
            return `<div class="flex items-center"><span class="text-slate-900 dark:text-white font-display font-bold">${crumb.title}</span></div>`;
        } else {
            return `<div class="flex items-center"><a class="hover:text-neon-violet dark:hover:text-neon-cyan transition-colors" href="${crumb.page}">${crumb.title}</a>${separator}</div>`;
        }
    }).join('');
}

function highlightActiveNav() {
    const page = window.location.pathname.split("/").pop() || "index.html";
    // Standardize page name for home and handle directory roots
    const activePage = (page === "" || page === "/") ? "index.html" : page;

    // 1. Sidebar Nav Highlighting (Specific styles)
    const sidebarLinks = document.querySelectorAll("aside nav a");
    sidebarLinks.forEach(link => {
        const href = link.getAttribute("href");
        // Check for exact match or if the href ends with the active page name to handle potential relative path differences
        if (href === activePage || (href && href.endsWith(activePage))) {
            // Apply Active Styles
            link.classList.add("bg-blue-50", "dark:bg-blue-900/20", "text-primary", "dark:text-blue-400", "font-semibold");
            // Remove Inactive/Default Styles that conflict
            link.classList.remove("text-slate-600", "dark:text-[#9dabb9]", "hover:bg-slate-100", "dark:hover:bg-[#283039]", "hover:text-primary", "dark:hover:text-white");

            // Style the icon specifically
            const icon = link.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.classList.add('text-primary', 'dark:text-blue-400');
                icon.classList.remove('group-hover:text-primary');
            }
        } else {
            // Reset to Default Styles
            link.classList.remove("bg-blue-50", "dark:bg-blue-900/20", "text-primary", "dark:text-blue-400", "font-semibold");
            link.classList.add("text-slate-600", "dark:text-[#9dabb9]", "hover:bg-slate-100", "dark:hover:bg-[#283039]", "hover:text-primary", "dark:hover:text-white");

            const icon = link.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.classList.remove('text-primary', 'dark:text-blue-400');
                icon.classList.add('group-hover:text-primary');
            }
        }
    });

    // 2. Global Header/Other Nav Highlighting (Generic styles)
    // Filter out sidebar links to avoid conflicts
    const otherLinks = Array.from(document.querySelectorAll("nav a")).filter(link => !link.closest("aside"));
    otherLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (href === activePage || (href && href.endsWith(activePage))) {
            link.classList.add("text-primary", "font-semibold", "active");
        } else {
            link.classList.remove("text-primary", "font-semibold", "active");
        }
    });
}

function initScrollAnimations() {
    // Enhanced observer with different thresholds for different effects
    const observerOptions = {
        root: null,
        rootMargin: '-50px 0px -100px 0px',
        threshold: [0.1, 0.25, 0.5]
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
                entry.target.classList.add('visible');
                // Once visible, stop observing
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all reveal elements
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => {
        observer.observe(el);
    });

    // Initialize parallax effects
    initParallax();

    // Initialize stat counter animations
    initCounterAnimations();

    // Initialize mouse tracking for glow effects
    initMouseTracking();

    // Initialize staggered grid animations
    initGridStagger();
}

// Parallax scrolling effect
function initParallax() {
    const parallaxElements = document.querySelectorAll('.parallax-slow, .parallax-medium, .parallax-fast');
    if (parallaxElements.length === 0) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;

                parallaxElements.forEach(el => {
                    const speed = el.classList.contains('parallax-fast') ? 0.15
                        : el.classList.contains('parallax-medium') ? 0.08
                            : 0.04;
                    const rect = el.getBoundingClientRect();
                    const elementCenter = rect.top + rect.height / 2;
                    const viewportCenter = window.innerHeight / 2;
                    const distanceFromCenter = elementCenter - viewportCenter;

                    el.style.transform = `translateY(${distanceFromCenter * speed}px)`;
                });

                ticking = false;
            });
            ticking = true;
        }
    });
}

// Animate number counters when they come into view
function initCounterAnimations() {
    const counters = document.querySelectorAll('[data-count], .counter-animate');
    if (counters.length === 0) return;

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const text = el.textContent;
                const match = text.match(/(\d+)/);

                if (match) {
                    const targetNum = parseInt(match[1]);
                    const suffix = text.replace(/\d+/g, '').trim();
                    const prefix = text.split(/\d/)[0];
                    const duration = 2000;
                    const startTime = performance.now();

                    function updateCounter(currentTime) {
                        const elapsedTime = currentTime - startTime;
                        const progress = Math.min(elapsedTime / duration, 1);

                        // Easing function for smooth animation
                        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                        const currentNum = Math.floor(easeOutQuart * targetNum);

                        el.textContent = prefix + currentNum + suffix;

                        if (progress < 1) {
                            requestAnimationFrame(updateCounter);
                        } else {
                            el.textContent = text; // Ensure final value is exact
                        }
                    }

                    requestAnimationFrame(updateCounter);
                }

                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));
}

// Track mouse position for interactive glow effects
function initMouseTracking() {
    const glowElements = document.querySelectorAll('.hover-glow, .cursor-glow');

    glowElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;

            el.style.setProperty('--mouse-x', `${x}%`);
            el.style.setProperty('--mouse-y', `${y}%`);
        });
    });
}

// Apply staggered animation delays to grid children
function initGridStagger() {
    const staggerGrids = document.querySelectorAll('.grid-stagger');

    staggerGrids.forEach(grid => {
        const children = grid.children;
        Array.from(children).forEach((child, index) => {
            // Add reveal class if not already present
            if (!child.classList.contains('reveal')) {
                child.classList.add('reveal', 'reveal-up');
            }
            // Set custom delay based on index
            child.style.transitionDelay = `${index * 100}ms`;
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Ensure mobile menu is hidden immediately and then after content loads
    initMobileMenu();

    // Double-check after a short delay to catch any timing issues
    setTimeout(() => {
        initMobileMenu();
    }, 100);

    // Initial load of global components
    const components = [
        { id: "header", file: "global/header.html" },
        { id: "footer", file: "global/footer.html" },
        { id: "mobile-menu-container", file: "global/mobile-menu.html" },
        { id: "portal-header", file: "partials/header.html" },
        { id: "portal-sidebar", file: "partials/sidebar.html" }
    ];

    let loadedCount = 0;
    components.forEach(comp => {
        const el = document.getElementById(comp.id);
        if (el) {
            loadHTML(comp.id, comp.file);
        }
    });

    // Also initialize animations for static content
    initScrollAnimations();

    // Ensure mobile menu is hidden after all content is loaded
    setTimeout(() => {
        initMobileMenu();
    }, 200);

    // Cookie Consent Logic
    initCookieConsent();

    // Initialize AI Chat Widget
    injectChatWidget();

    // Ensure mobile menu is hidden on window load (for page refreshes/navigations)
    window.addEventListener('load', () => {
        setTimeout(() => {
            initMobileMenu();
        }, 50);
    });

    // New Feature initializations
    initBackToTop();
    initNewsletterFeedback();
    initScrollSpy();
    initContentFilters();
    initReviewsSlider();
    initTiltEffect();
    initHeaderScroll();
});

// Tilt on hover effect
function initTiltEffect() {
    const tiltElements = document.querySelectorAll('.hover-tilt');

    tiltElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            el.style.transition = 'transform 0.1s ease-out';
        });

        el.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                // Max rotation 15 degrees
                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;

                el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
            });
        });
        el.addEventListener('mouseleave', () => {
            el.style.transition = 'transform 0.5s ease-out';
            el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });
}


// Notification Dropdown Logic
function toggleNotifications() {
    const dropdown = document.getElementById("notification-dropdown");
    if (dropdown) {
        if (dropdown.classList.contains("hidden")) {
            dropdown.classList.remove("hidden");
            dropdown.classList.add("animate-fade-in-up");
        } else {
            dropdown.classList.add("hidden");
            dropdown.classList.remove("animate-fade-in-up");
        }
    }
}

// Close notifications when clicking outside
document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("notification-dropdown");
    const btn = document.getElementById("notification-btn");

    if (dropdown && !dropdown.classList.contains("hidden")) {
        if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
            dropdown.classList.add("hidden");
        }
    }
});
function initCookieConsent() {
    if (localStorage.getItem('cookieConsent')) return;

    // Create container
    const container = document.createElement('div');
    container.id = 'cookie-consent-container';
    document.body.appendChild(container);

    // Determine correct path based on location
    const pathPrefix = window.location.pathname.includes('/portal/') ? '../' : '';

    // Load content
    fetch(`${pathPrefix}global/cookie-consent.html`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.text();
        })
        .then(html => {
            container.innerHTML = html;

            const banner = document.getElementById('cookie-banner');
            if (banner) {
                // Show with slight delay
                setTimeout(() => {
                    banner.classList.remove('translate-y-[150%]');
                }, 1000);
            }

            // Event Listeners
            const acceptBtn = document.getElementById('accept-cookies');
            if (acceptBtn) {
                acceptBtn.addEventListener('click', () => handleCookieChoice('accepted'));
            }

            const declineBtn = document.getElementById('decline-cookies');
            if (declineBtn) {
                declineBtn.addEventListener('click', () => handleCookieChoice('declined'));
            }

            const settingsBtn = document.getElementById('cookie-settings');
            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => {
                    window.location.href = `${pathPrefix}legal.html#cookies`;
                });
            }
        })
        .catch(e => {
            console.warn('Cookie consent banner failed to load:', e);
            if (container.parentNode) container.parentNode.removeChild(container);
        });
}

function handleCookieChoice(choice) {
    localStorage.setItem('cookieConsent', choice);
    const banner = document.getElementById('cookie-banner');
    banner.classList.add('translate-y-[150%]');

    // Remove from DOM after transition
    setTimeout(() => {
        document.getElementById('cookie-consent-container').remove();
    }, 700);
}

// Back to Top Logic
function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top p-3 rounded-full bg-primary text-white shadow-2xl hover:bg-primary/90 hover:-translate-y-1 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-primary/20';
    btn.innerHTML = '<span class="material-symbols-outlined">arrow_upward</span>';
    btn.setAttribute('aria-label', 'Back to top');
    document.body.appendChild(btn);

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > 500) {
                    btn.classList.add('visible');
                } else {
                    btn.classList.remove('visible');
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Toast Notification System
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'glass-toast flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl';

    const icon = type === 'success' ? 'check_circle' : 'info';
    const iconColor = type === 'success' ? 'text-green-500' : 'text-blue-500';

    toast.innerHTML = `
        <span class="material-symbols-outlined ${iconColor}">${icon}</span>
        <span class="text-sm font-bold text-slate-800 dark:text-white">${message}</span>
    `;

    document.body.appendChild(toast);

    // Show
    setTimeout(() => toast.classList.add('visible'), 100);

    // Hide and Remove
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// Newsletter Simulation
function initNewsletterFeedback() {
    // We use event delegation since footers are loaded dynamically
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        const container = btn?.closest('#newsletter-container');

        if (btn && container) {
            const emailInput = container.querySelector('input[type="email"]');
            if (emailInput && emailInput.value) {
                e.preventDefault();
                if (emailInput.checkValidity()) {
                    const originalContent = btn.innerHTML;
                    btn.disabled = true;
                    btn.innerHTML = '<span class="animate-spin material-symbols-outlined text-xs">progress_activity</span>';

                    try {
                        // Dynamically import the firebase module
                        const { subscribeNewsletter } = await import('./firebase-modules.js' + '?v=' + Date.now());
                        const result = await subscribeNewsletter(emailInput.value);

                        if (result.success) {
                            showToast('Success! You have been subscribed to our newsletter.');
                            emailInput.value = '';
                        } else {
                            showToast('Something went wrong. Please try again.', 'info');
                        }
                    } catch (err) {
                        console.error("Newsletter error:", err);
                        showToast('Error connecting to subscription service.', 'info');
                    } finally {
                        btn.disabled = false;
                        btn.innerHTML = originalContent;
                    }
                } else {
                    showToast('Please enter a valid email address.', 'info');
                }
            }
            // If no email value, let the existing onclick handler (redirect) work if it exists
        }
    });
}

// Unified Scroll-Spy Logic (for Legal & Solutions pages)
function initScrollSpy() {
    const sidebarLinks = document.querySelectorAll('aside nav a[href^="#"], aside div.flex a[href^="#"], .lg\\:hidden a[href^="#"]');
    if (sidebarLinks.length === 0) return;

    const sections = Array.from(new Set(Array.from(sidebarLinks)
        .map(link => {
            const href = link.getAttribute('href');
            return (href && href.length > 1) ? document.querySelector(href) : null;
        })
        .filter(s => s !== null)));

    const activeClasses = ['bg-primary', 'text-white', 'shadow-md', 'shadow-primary/20'];
    const mobileActiveClasses = ['bg-primary', 'text-white', 'shadow-md', 'shadow-primary/20'];
    const inactiveClasses = ['text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800', 'hover:text-slate-900', 'dark:hover:text-white'];
    const mobileInactiveClasses = ['text-slate-500', 'dark:text-gray-300', 'hover:bg-gray-50', 'dark:hover:bg-[#1a2538]'];

    function setActive(id) {
        sidebarLinks.forEach(link => {
            const isTarget = link.getAttribute('href') === `#${id}`;
            const isMobile = link.closest('.lg\\:hidden');

            if (isTarget) {
                link.classList.add(...(isMobile ? mobileActiveClasses : activeClasses));
                link.classList.remove(...(isMobile ? mobileInactiveClasses : inactiveClasses));
                if (!isMobile) {
                    const textSpan = link.querySelector('span:not(.material-symbols-outlined)');
                    if (textSpan) { textSpan.classList.add('font-bold'); textSpan.classList.remove('font-medium'); }
                    const icon = link.querySelector('.material-symbols-outlined');
                    if (icon) icon.setAttribute('data-weight', 'fill');
                }
            } else {
                link.classList.remove(...activeClasses, ...mobileActiveClasses);
                link.classList.add(...(isMobile ? mobileInactiveClasses : inactiveClasses));
                if (!isMobile) {
                    const textSpan = link.querySelector('span:not(.material-symbols-outlined)');
                    if (textSpan) { textSpan.classList.remove('font-bold'); textSpan.classList.add('font-medium'); }
                    const icon = link.querySelector('.material-symbols-outlined');
                    if (icon) icon.removeAttribute('data-weight');
                }
            }
        });
    }

    const observerOptions = { root: null, rootMargin: '-120px 0px -70% 0px', threshold: 0 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) setActive(entry.target.getAttribute('id'));
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
}

// Content Filtering Logic (for Portfolio & Blog pages)
function initContentFilters() {
    const filterButtons = document.querySelectorAll('[data-filter]');
    const filterItems = document.querySelectorAll('[data-category]');
    if (filterButtons.length === 0) return;

    const activeClasses = ['bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/20', 'ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-slate-50', 'dark:ring-offset-slate-900'];
    const inactiveClasses = ['bg-white', 'dark:bg-slate-800', 'border', 'border-slate-200', 'dark:border-slate-700', 'text-slate-600', 'dark:text-slate-300', 'hover:text-primary', 'hover:border-primary'];

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterValue = btn.getAttribute('data-filter');

            // Update button states
            filterButtons.forEach(b => {
                b.classList.remove(...activeClasses);
                b.classList.add(...inactiveClasses);
                const checkIcon = b.querySelector('.material-symbols-outlined');
                if (checkIcon) checkIcon.textContent = b.getAttribute('data-icon') || '';
            });

            btn.classList.add(...activeClasses);
            btn.classList.remove(...inactiveClasses);
            const activeIcon = btn.querySelector('.material-symbols-outlined');
            if (activeIcon) activeIcon.textContent = 'check';

            // Filter items
            filterItems.forEach(item => {
                const category = item.getAttribute('data-category');
                if (filterValue === 'all' || category === filterValue) {
                    item.style.display = '';
                    setTimeout(() => item.classList.add('visible'), 10);
                } else {
                    item.classList.remove('visible');
                    setTimeout(() => item.style.display = 'none', 500);
                }
            });
        });
    });
}

// Reviews Slider (for Testimonials section)
function initReviewsSlider() {
    const slider = document.getElementById('reviews-slider');
    const dots = document.querySelectorAll('.review-dot');
    if (!slider || dots.length === 0) return;

    let currentIndex = 0;
    const totalSlides = dots.length;
    let interval;

    // Touch swipe variables
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 50;

    function updateSlider(index) {
        currentIndex = index;
        const offset = -index * 100;
        slider.style.transform = `translateX(${offset}%)`;

        // Update dots
        dots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('bg-gradient-to-r', 'from-neon-cyan', 'to-neon-violet', 'shadow-neon');
                dot.classList.remove('bg-slate-300', 'dark:bg-slate-600');
            } else {
                dot.classList.remove('bg-gradient-to-r', 'from-neon-cyan', 'to-neon-violet', 'shadow-neon');
                dot.classList.add('bg-slate-300', 'dark:bg-slate-600');
            }
        });
    }

    function startAutoSlide() {
        stopAutoSlide();
        interval = setInterval(() => {
            let nextIndex = (currentIndex + 1) % totalSlides;
            updateSlider(nextIndex);
        }, 5000);
    }

    function stopAutoSlide() {
        if (interval) clearInterval(interval);
    }

    function goToNext() {
        let nextIndex = (currentIndex + 1) % totalSlides;
        updateSlider(nextIndex);
        startAutoSlide();
    }

    function goToPrev() {
        let prevIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        updateSlider(prevIndex);
        startAutoSlide();
    }

    function handleSwipe() {
        const swipeDistance = touchEndX - touchStartX;
        if (Math.abs(swipeDistance) < minSwipeDistance) return;

        if (swipeDistance > 0) {
            // Swiped right - go to previous
            goToPrev();
        } else {
            // Swiped left - go to next
            goToNext();
        }
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            updateSlider(index);
            startAutoSlide(); // Reset interval on manual click
        });
    });

    // Touch event listeners for swipe
    slider.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoSlide();
    }, { passive: true });

    slider.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    // Start auto slide
    startAutoSlide();

    // Pause on hover
    slider.addEventListener('mouseenter', stopAutoSlide);
    slider.addEventListener('mouseleave', startAutoSlide);
}

// Header Hide/Show on Scroll Logic
function initHeaderScroll() {
    const header = document.querySelector('.fixed.top-0');
    if (!header) return;

    let lastScrollY = window.scrollY;
    let ticking = false;
    const headerHeight = header.offsetHeight;
    const scrollThreshold = 100; // Minimum scroll before header starts hiding

    function updateHeader() {
        const currentScrollY = window.scrollY;

        // Don't hide header if at the top of the page
        if (currentScrollY <= scrollThreshold) {
            header.style.transform = 'translateY(0)';
            header.classList.remove('header-hidden');
        } else if (currentScrollY > lastScrollY) {
            // Scrolling down - hide header
            header.style.transform = `translateY(-${headerHeight}px)`;
            header.classList.add('header-hidden');
        } else {
            // Scrolling up - show header
            header.style.transform = 'translateY(0)';
            header.classList.remove('header-hidden');
        }

        lastScrollY = currentScrollY;
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestTick, { passive: true });
}

// Sidebar Sections Logic (Accordions)
function initSidebarSections() {
    const sections = document.querySelectorAll('.sidebar-section');
    const page = window.location.pathname.split("/").pop() || "index.html";
    const activePage = (page === "" || page === "/") ? "index.html" : page;
    const alwaysExpanded = localStorage.getItem('portalSidebarAlwaysExpanded') === 'true';

    sections.forEach(section => {
        const toggle = section.querySelector('.sidebar-section-toggle');
        const content = section.querySelector('.sidebar-section-content');
        const icon = section.querySelector('.material-symbols-outlined');
        if (!content || !toggle) return;

        // Check if this section contains the active page
        const links = content.querySelectorAll('a');
        let isActiveSection = false;

        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && (href === activePage || href.endsWith(activePage))) {
                isActiveSection = true;
            }
        });

        // Helper Functions using timeouts attached to the DOM element to avoid race conditions
        const expand = () => {
            // Clear any pending collapse
            if (section.collapseTimeout) clearTimeout(section.collapseTimeout);

            content.classList.remove('opacity-0');

            // If valid height already set or 'none', we might be good.
            // But if it's 0px, we animate.
            if (content.style.maxHeight === '0px' || !content.style.maxHeight) {
                content.style.maxHeight = content.scrollHeight + 'px';
            }

            if (icon) icon.textContent = 'expand_less';

            // Allow auto growth after transition
            if (section.expandTimeout) clearTimeout(section.expandTimeout);
            section.expandTimeout = setTimeout(() => {
                if (content.style.maxHeight !== '0px') {
                    content.style.maxHeight = 'none';
                }
            }, 300);
        };

        const collapse = () => {
            // Cancel pending expand finalization
            if (section.expandTimeout) clearTimeout(section.expandTimeout);

            // Set explicit height first to animate from if currently none
            if (content.style.maxHeight === 'none') {
                content.style.maxHeight = content.scrollHeight + 'px';
            }

            // Use requestAnimationFrame correctly
            requestAnimationFrame(() => {
                // Force separate frame for transition to take effect
                requestAnimationFrame(() => {
                    content.style.maxHeight = '0px';
                    if (icon) icon.textContent = 'expand_more';
                    content.classList.add('opacity-0');
                });
            });
        };

        // Initial State - Set immediately without animation logic if possible.
        // We set inline styles directly.
        if (isActiveSection || alwaysExpanded) {
            content.classList.remove('opacity-0');
            content.style.maxHeight = 'none';
            if (icon) icon.textContent = 'expand_less';
        } else {
            content.style.maxHeight = '0px';
            if (icon) icon.textContent = 'expand_more';
            content.classList.add('opacity-0');
        }

        // Hover Events
        section.addEventListener('mouseenter', () => {
            // Check if global sidebar is collapsed - if so, do nothing! (Desktop only)
            const globalSidebar = document.getElementById('global-sidebar');
            if (window.innerWidth >= 1024 && globalSidebar && globalSidebar.classList.contains('collapsed')) {
                return;
            }

            // If always expanded mode is on, do nothing
            if (localStorage.getItem('portalSidebarAlwaysExpanded') === 'true') return;

            // Expand on hover if it is not already fully open or is collapsed
            // We check maxHeight. If 'none', it's already permanently open.
            // If '0px', it needs opening.
            if (content.style.maxHeight === '0px') {
                expand();
            }
        });

        section.addEventListener('mouseleave', () => {
            // Check if global sidebar is collapsed - if so, do nothing! (Desktop only)
            const globalSidebar = document.getElementById('global-sidebar');
            if (window.innerWidth >= 1024 && globalSidebar && globalSidebar.classList.contains('collapsed')) {
                return;
            }

            // If always expanded mode is on, do nothing (keep open)
            if (localStorage.getItem('portalSidebarAlwaysExpanded') === 'true') return;

            // Only collapse if it's NOT the active section
            if (!isActiveSection) {
                collapse();
            }
            // Active section stays open.
        });

        // Manual Toggle override
        toggle.onclick = (e) => {
            e.preventDefault();

            // Disable toggle if sidebar is collapsed (Desktop only)
            const globalSidebar = document.getElementById('global-sidebar');
            if (window.innerWidth >= 1024 && globalSidebar && globalSidebar.classList.contains('collapsed')) {
                return;
            }

            // If always expanded mode is on, do nothing (prevent closing)
            if (localStorage.getItem('portalSidebarAlwaysExpanded') === 'true') {
                // Keep it open
                return;
            }

            // If active and open, close it.
            // If closed, open it.
            // Since we persist Active Section on leave, this allows manual override.

            if (content.style.maxHeight === '0px') {
                expand();
            } else {
                collapse();
            }
        };
    });
}

// Sidebar Expand Toggle Logic
function initSidebarExpandToggle() {
    const toggleBtn = document.getElementById('sidebar-expand-toggle');
    if (!toggleBtn) return;

    const icon = toggleBtn.querySelector('.material-symbols-outlined');
    const sections = document.querySelectorAll('.sidebar-section');

    // Initial State visual update
    const updateState = (isExpanded) => {
        if (isExpanded) {
            // Active Styles (Premium Gradient)
            toggleBtn.classList.add(
                'bg-gradient-to-br', 'from-neon-violet/20', 'to-neon-cyan/20',
                'border', 'border-neon-violet/40', 'dark:border-neon-cyan/40',
                'text-neon-violet', 'dark:text-neon-cyan',
                'shadow-lg', 'shadow-neon-violet/10'
            );
            toggleBtn.classList.remove(
                'bg-slate-100', 'dark:bg-slate-800/50',
                'text-slate-500', 'hover:bg-white', 'dark:hover:bg-slate-700'
            );

            if (icon) icon.textContent = 'unfold_less';
            toggleBtn.title = "Restore default behavior";
        } else {
            // Inactive Styles (Default)
            toggleBtn.classList.remove(
                'bg-gradient-to-br', 'from-neon-violet/20', 'to-neon-cyan/20',
                'border', 'border-neon-violet/40', 'dark:border-neon-cyan/40',
                'text-neon-violet', 'dark:text-neon-cyan',
                'shadow-lg', 'shadow-neon-violet/10'
            );
            toggleBtn.classList.add(
                'bg-slate-100', 'dark:bg-slate-800/50',
                'text-slate-500', 'hover:bg-white', 'dark:hover:bg-slate-700'
            );

            if (icon) icon.textContent = 'unfold_more';
            toggleBtn.title = "Keep sections expanded";
        }
    };

    // Set initial
    updateState(localStorage.getItem('portalSidebarAlwaysExpanded') === 'true');

    toggleBtn.onclick = () => {
        const wasExpanded = localStorage.getItem('portalSidebarAlwaysExpanded') === 'true';
        const isNowExpanded = !wasExpanded;
        localStorage.setItem('portalSidebarAlwaysExpanded', isNowExpanded);

        updateState(isNowExpanded);

        const page = window.location.pathname.split("/").pop() || "index.html";
        const activePage = (page === "" || page === "/") ? "index.html" : page;

        // Force update all sections immediately
        sections.forEach(section => {
            const content = section.querySelector('.sidebar-section-content');
            const sectionIcon = section.querySelector('.material-symbols-outlined');
            if (!content) return;

            if (isNowExpanded) {
                // Expanding All
                content.classList.remove('opacity-0');
                content.style.maxHeight = 'none';
                if (sectionIcon) sectionIcon.textContent = 'expand_less';
            } else {
                // Determine if this section is active
                const links = content.querySelectorAll('a');
                let isActiveSection = false;
                links.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && (href === activePage || href.endsWith(activePage))) {
                        isActiveSection = true;
                    }
                });

                if (isActiveSection) {
                    // Keep open
                    content.classList.remove('opacity-0');
                    content.style.maxHeight = 'none';
                    if (sectionIcon) sectionIcon.textContent = 'expand_less';
                } else {
                    // Collapse
                    content.style.maxHeight = '0px';
                    if (sectionIcon) sectionIcon.textContent = 'expand_more';
                    content.classList.add('opacity-0');
                }
            }
        });
    };
}

// Sidebar Toggle Logic
function initSidebarToggle() {
    const sidebar = document.getElementById('global-sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    if (!sidebar || !toggleBtn) return;

    const labels = sidebar.querySelectorAll('.sidebar-label');
    const tooltips = sidebar.querySelectorAll('.collapsed-tooltip');
    const toggleIcon = toggleBtn.querySelector('.material-symbols-outlined');
    const logoImg = sidebar.querySelector('img');

    // Helper to apply state
    function setCollapsed(collapsed) {
        const sectionToggles = sidebar.querySelectorAll('.sidebar-section-toggle');
        const sectionContents = sidebar.querySelectorAll('.sidebar-section-content');

        if (collapsed) {
            // Desktop: Rail mode
            // Mobile: Full width (handled by w-72 base class not being removed, and lg:w-20 overriding on desktop)
            sidebar.classList.add('collapsed', 'lg:w-20');
            sidebar.classList.remove('lg:w-72'); // Ensure explicit expanded class is gone if used

            // Hide labels only on desktop
            labels.forEach(el => {
                el.classList.add('lg:hidden');
            });

            // Hide section toggles (headers) on desktop
            sectionToggles.forEach(el => el.classList.add('lg:hidden'));

            // Force expand contents for icons on desktop
            // On mobile, we want normal accordion behavior preferably, but for now consistency:
            // Actually, if we use lg:hidden for toggles, the contents need to be visible.
            sectionContents.forEach(el => {
                // We typically need opacity-100 and max-height:none for the icons to show in rail
                // But we only want this enforced on desktop rail.
                // On mobile, we want the user to still use accordions?
                // If toggles are hidden on desktop, how do we see content? 
                // Ah, rail mode shows *all* icons.
                // So we force open.

                // We add a class that forces visibility on desktop
                el.classList.add('lg:opacity-100', 'lg:max-h-full');

                // Note: 'max-h-full' isn't a default tailwind transition friendly value usually, 
                // but we need to override the inline styles set by accordion logic.
                // We might need to rely on the 'collapsed' class in initSidebarSections to force styles?
                // Actually, initSidebarSections checks for 'collapsed' class and aborts mouseenter/leave.
                // We should ensure styles are correct here.
                el.style.setProperty('--lg-max-height', 'none');
            });

            // For the inline styles issue: we can just clear them or set them?
            // The accordion logic sets inline max-height. 
            // We can't easily add 'lg:max-h-none' via class if inline style is present strictly?
            // Actually, !important utilities work.
            // Let's rely on specific css or js clearing.
            // Simplest: The existing logic forced them open.
            sectionContents.forEach(el => {
                el.classList.remove('opacity-0');
                el.style.maxHeight = 'none';
            });


            // Ensure dividers remain visible
            const dividers = sidebar.querySelectorAll('.sidebar-divider');
            dividers.forEach(el => el.classList.remove('hidden'));

            tooltips.forEach(el => el.classList.remove('hidden'));

            toggleIcon.textContent = 'chevron_right';
        } else {
            // Expand
            sidebar.classList.remove('collapsed', 'lg:w-20');
            sidebar.classList.add('lg:w-72'); // Optional, implicit in w-72 usually

            labels.forEach(el => {
                el.classList.remove('lg:hidden');
                el.classList.remove('hidden'); // Legacy cleanup
            });

            // Show section toggles
            sectionToggles.forEach(el => {
                el.classList.remove('lg:hidden');
                el.classList.remove('hidden');
            });

            // Restore accordion state logic
            initSidebarSections();

            tooltips.forEach(el => el.classList.add('hidden'));

            toggleIcon.textContent = 'chevron_left';
            if (logoImg) logoImg.classList.remove('scale-75');
        }
        localStorage.setItem('portalSidebarCollapsed', collapsed);
    }

    // Initial State
    const isCollapsed = localStorage.getItem('portalSidebarCollapsed') === 'true';
    setCollapsed(isCollapsed);

    toggleBtn.onclick = () => {
        const currentlyCollapsed = sidebar.classList.contains('collapsed');
        setCollapsed(!currentlyCollapsed);
    };
}

// Mobile Portal Sidebar Toggle (Global)
window.togglePortalSidebar = function () {
    const sidebar = document.getElementById('global-sidebar');
    const backdropId = 'portal-mobile-backdrop';
    let backdrop = document.getElementById(backdropId);

    if (!sidebar) return;

    // Check if open
    const isHidden = sidebar.classList.contains('hidden');

    if (isHidden) {
        // OPEN
        sidebar.classList.remove('hidden');
        sidebar.classList.add('fixed', 'inset-y-0', 'left-0', 'z-50', 'w-72', 'shadow-2xl');
        // Ensure standard width is reinforced in case rail mode messed it up, 
        // though our new initSidebarToggle handles the lg: prefix, we typically want w-72 on mobile.
        // The sidebar html usually has `w-72`.

        // Add Backdrop
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = backdropId;
            backdrop.className = 'fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity opacity-0';
            // Insert backdrop BEFORE the sidebar in the DOM to ensure sidebar sits on top (DOM order + z-index)
            // This prevents the backdrop from covering the menu due to stacking context issues
            sidebar.parentNode.insertBefore(backdrop, sidebar);

            // Trigger fade in
            requestAnimationFrame(() => backdrop.classList.remove('opacity-0'));

            // Click to close
            backdrop.onclick = window.togglePortalSidebar;
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

    } else {
        // CLOSE
        sidebar.classList.add('hidden');
        sidebar.classList.remove('fixed', 'inset-y-0', 'left-0', 'z-50', 'shadow-2xl');

        // Remove Backdrop
        if (backdrop) {
            backdrop.classList.add('opacity-0');
            setTimeout(() => backdrop.remove(), 300);
        }

        // Restore body scroll
        document.body.style.overflow = '';
    }
};

// Sidebar Search Logic
function initSidebarSearch() {
    const searchInput = document.getElementById('sidebar-search-input');
    const searchResults = document.getElementById('sidebar-search-results');
    const sidebar = document.getElementById('global-sidebar');

    if (!searchInput || !searchResults || !sidebar) return;

    // Index all sidebar text links
    const links = [];
    sidebar.querySelectorAll('a').forEach(link => {
        // We only want links with clear labels, excluding logo link if it has no text context we want searchable
        // But our logo link has "Adhirat Portal" text. We probably want menu items primarily.

        // Let's target links inside 'nav' specifically to avoid header confusion
        const nav = sidebar.querySelector('nav');
        if (!nav || !nav.contains(link)) return;

        const labelSpan = link.querySelector('.sidebar-label');
        if (!labelSpan) return; // Skip if no label (should not happen based on HTML)

        const text = labelSpan.textContent.trim();
        const href = link.getAttribute('href');
        const iconSpan = link.querySelector('.material-symbols-outlined');
        const iconName = iconSpan ? iconSpan.textContent : 'link';

        if (text && href && href !== '#') {
            links.push({ text, href, icon: iconName, element: link });
        }
    });

    // Event Listeners
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        if (query.length === 0) {
            searchResults.classList.add('hidden');
            return;
        }

        const matches = links.filter(item => item.text.toLowerCase().includes(query));

        if (matches.length > 0) {
            // Build HTML
            const html = matches.map(item => `
                <a href="${item.href}" class="flex items-center gap-3 px-4 py-3 hover:bg-neon-violet/5 dark:hover:bg-neon-cyan/5 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0 group">
                    <span class="material-symbols-outlined text-slate-400 group-hover:text-neon-violet dark:group-hover:text-neon-cyan transition-colors text-sm">${item.icon}</span>
                    <span class="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-neon-violet dark:group-hover:text-neon-cyan">${item.text}</span>
                </a>
            `).join('');

            searchResults.innerHTML = html;
            searchResults.classList.remove('hidden');
        } else {
            searchResults.innerHTML = `
                <div class="px-4 py-3 text-xs text-slate-500 text-center">
                    No results found
                </div>
            `;
            searchResults.classList.remove('hidden');
        }
    });


    // Blur / Click Outside
    // We use a slight timeout on blur to allow "click" events on the results to fire first
    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            searchResults.classList.add('hidden');
        }, 200);
    });

    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length > 0) {
            searchResults.classList.remove('hidden');
        }
    });
}

// Sidebar Hover Tooltips for Collapsed Mode
function initSidebarTooltips() {
    const sidebar = document.getElementById('global-sidebar');
    if (!sidebar) return;

    // Create Tooltip Element if not exists
    let tooltip = document.getElementById('sidebar-tooltip');
    if (!tooltip) {
        // Create tooltip container
        tooltip = document.createElement('div');
        tooltip.id = 'sidebar-tooltip';

        // Revised Styling for Seamless Blend:
        tooltip.className = `
            fixed z-[9999] hidden pointer-events-none px-4 flex items-center 
            font-display font-medium text-sm tracking-wide
            shadow-[4px_0_24px_rgba(0,0,0,0.1)] 
            transition-all duration-200 opacity-0 
            text-neon-violet dark:text-neon-cyan
            bg-white dark:bg-dark-card
            border-y border-r border-neon-violet/10 dark:border-neon-cyan/20 rounded-r-xl
        `;
        document.body.appendChild(tooltip);
    }

    // Attach listeners to all sidebar links
    const links = sidebar.querySelectorAll('a');

    // Initial Setup: Add transparent borders to all links to prevent layout shift on hover
    links.forEach(link => {
        // We ensure every link has a transparent border of 1px width, but 0px on right
        // This reserves the space so when we color it on hover, the height matches exactly.
        link.classList.add('border-y', 'border-l', 'border-transparent', 'border-r-0');

        link.addEventListener('mouseenter', (e) => {
            // Only show if collapsed and on desktop
            if (window.innerWidth < 1024 || !sidebar.classList.contains('collapsed')) return;

            // Get label text
            const label = link.querySelector('.sidebar-label');
            // If label is missing (e.g. logo), skip or handle?
            // Logo usually doesn't need this expansion behavior as it's at top.
            if (!label) return;

            const text = label.textContent.trim();
            if (!text) return;

            // Positioning
            const rect = link.getBoundingClientRect();

            // Set Content
            tooltip.textContent = text;

            // Flatten the link's right side to merge with tooltip
            link.classList.add('rounded-r-none');
            link.classList.remove('rounded-xl');
            link.classList.add('rounded-l-xl');

            // Colorize the existing border (no layout shift)
            link.classList.remove('border-transparent');
            link.classList.add('border-neon-violet/10', 'dark:border-neon-cyan/20');

            // Set Position
            tooltip.style.top = `${rect.top}px`;
            tooltip.style.left = `${rect.right}px`;
            tooltip.style.height = `${rect.height}px`;

            // Apply Hover Styles dynamically
            tooltip.classList.add('bg-neon-violet/10', 'dark:bg-neon-cyan/10', 'backdrop-blur-xl');
            tooltip.classList.remove('bg-white', 'dark:bg-dark-card');

            // Show
            tooltip.classList.remove('hidden');

            // Animate
            // We want it to "slide out" from the left
            requestAnimationFrame(() => {
                tooltip.style.transform = 'translateX(0)';
                tooltip.classList.remove('opacity-0', '-translate-x-4');
                tooltip.classList.add('opacity-100', 'translate-x-0');
            });
        });

        link.addEventListener('mouseleave', () => {
            // Restore link shape
            link.classList.remove('rounded-r-none', 'rounded-l-xl');
            link.classList.add('rounded-xl');

            // Revert border to transparent
            link.classList.remove('border-neon-violet/10', 'dark:border-neon-cyan/20');
            link.classList.add('border-transparent');

            // Hide animation
            tooltip.classList.remove('opacity-100', 'translate-x-0');
            tooltip.classList.add('opacity-0', '-translate-x-4');

            // Wait for transition before hiding completely
            setTimeout(() => {
                // Only hide if we haven't hovered another link (check opacity)
                if (tooltip.classList.contains('opacity-0')) {
                    tooltip.classList.add('hidden');
                    // Reset BG for next time
                    tooltip.classList.remove('bg-neon-violet/10', 'dark:bg-neon-cyan/10', 'backdrop-blur-xl');
                    tooltip.classList.add('bg-white', 'dark:bg-dark-card');
                }
            }, 300);
        });
    });
}

// ==========================================
// AI Chat Widget
// ==========================================
function injectChatWidget() {
    // Check if widget already exists to prevent duplicates
    if (document.getElementById('ai-chat-widget')) return;

    // Only inject on portal pages (pages with portal-sidebar/header) or if specifically requested
    if (!document.getElementById('portal-sidebar') && !document.getElementById('portal-header')) return;

    const chatHTML = `
    <!-- AI Assistant Widget -->
    <div id="ai-chat-widget" class="fixed bottom-6 right-6 z-[100] font-sans print:hidden flex flex-col items-end">
        
        <!-- Chat Window (Hidden by default) -->
        <div id="ai-chat-window" class="hidden flex-col w-[380px] h-[600px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 transform origin-bottom-right scale-95 opacity-0 mb-4">
            
            <!-- Header -->
            <div class="p-4 bg-gradient-to-r from-neon-violet to-indigo-600 flex items-center justify-between text-white shrink-0">
                <div class="flex items-center gap-3">
                    <div class="size-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                        <span class="material-symbols-outlined text-lg">smart_toy</span>
                    </div>
                    <div>
                        <h3 class="font-bold text-sm leading-tight">Adhirat AI</h3>
                        <p class="text-[10px] opacity-80 flex items-center gap-1">
                            <span class="size-1.5 rounded-full bg-emerald-400"></span> Online
                        </p>
                    </div>
                </div>
                <div class="flex gap-1">
                    <button class="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition">
                        <span class="material-symbols-outlined text-lg">refresh</span>
                    </button>
                    <button onclick="toggleChat()" class="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition">
                        <span class="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            </div>

            <!-- Messages Area -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-800/50 custom-scrollbar">
                <!-- AI Welcom Message -->
                <div class="flex gap-3">
                    <div class="size-8 rounded-full bg-gradient-to-br from-neon-violet to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                        <span class="material-symbols-outlined text-white text-sm">smart_toy</span>
                    </div>
                    <div class="bg-white dark:bg-dark-card border border-slate-100 dark:border-slate-700 p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-700 dark:text-slate-200">
                        <p>Hello! I'm your AI assistant. I can help you generate content, fill forms, or navigate the portal.</p>
                        <div class="mt-3 grid grid-cols-1 gap-2">
                            <button class="text-xs text-left px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition">✨ Generate description</button>
                            <button class="text-xs text-left px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition">📝 Fill current form</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Input Area -->
            <div class="p-4 bg-white dark:bg-dark-card border-t border-slate-200 dark:border-slate-700 shrink-0 mt-auto">
                <div class="relative flex items-center">
                    <button class="absolute left-2 p-1.5 rounded-lg text-slate-400 hover:text-neon-violet hover:bg-slate-200 dark:hover:bg-slate-700 transition" title="Attach file">
                        <span class="material-symbols-outlined text-lg">attach_file</span>
                    </button>
                    <input type="text" placeholder="Ask me anything..." class="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-neon-violet focus:ring-0 text-sm text-slate-900 dark:text-white transition-all shadow-inner">
                    <button class="absolute right-2 p-1.5 rounded-lg bg-neon-violet text-white shadow-lg shadow-neon-violet/20 hover:scale-105 transition active:scale-95">
                        <span class="material-symbols-outlined text-lg">send</span>
                    </button>
                </div>
                <div class="text-[10px] text-center text-slate-400 mt-2">
                    AI can make mistakes. Review generated content.
                </div>
            </div>
        </div>

        <!-- Floating Action Button -->
        <button onclick="toggleChat()" class="group flex items-center justify-center size-14 rounded-full bg-gradient-to-r from-neon-violet to-indigo-600 text-white shadow-xl shadow-neon-violet/30 hover:scale-110 hover:shadow-2xl hover:shadow-neon-violet/40 transition-all duration-300 relative overflow-hidden">
            <span class="material-symbols-outlined text-2xl group-hover:scale-125 transition-transform duration-300 relative z-10">auto_awesome</span>
            <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full"></div>
        </button>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatHTML);
}

// Global Toggle Function for Chat
// Global Toggle Function for Chat
window.toggleChat = function () {
    const chatWindow = document.getElementById('ai-chat-window');

    if (chatWindow.classList.contains('hidden')) {
        chatWindow.classList.remove('hidden');
        chatWindow.classList.add('flex');
        // Small delay to allow display flow before animating opacity
        setTimeout(() => {
            chatWindow.classList.remove('scale-95', 'opacity-0');
            chatWindow.classList.add('scale-100', 'opacity-100');
        }, 10);
    } else {
        chatWindow.classList.remove('scale-100', 'opacity-100');
        chatWindow.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            chatWindow.classList.add('hidden');
            chatWindow.classList.remove('flex');
        }, 300); // Wait for transition
    }
}

// ==========================================
// Help System
// ==========================================
// ==========================================
// Help System
// ==========================================
function injectHelpModal() {
    if (document.getElementById('help-modal')) return;

    const modalHTML = `
    <!-- Help Modal Overlay -->
    <div id="help-modal" class="fixed inset-0 z-[110] hidden" aria-labelledby="help-title" role="dialog" aria-modal="true">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity opacity-0" id="help-backdrop" onclick="toggleHelp()"></div>
        
        <!-- Modal Panel -->
        <div class="absolute inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl transform translate-x-full transition-transform duration-300 flex flex-col" id="help-panel">
            
            <!-- Header -->
            <div class="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <div>
                    <h2 id="help-title" class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span class="material-symbols-outlined text-neon-violet">support_agent</span>
                        Documentation
                    </h2>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1" id="help-subtitle">Guide for this module</p>
                </div>
                <button onclick="toggleHelp()" class="flex items-center justify-center p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <!-- Search Bar -->
            <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
                    <input type="text" id="help-search-input" placeholder="Search articles..." 
                        class="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-neon-violet transition-shadow"
                        onkeyup="searchHelp(this.value)">
                </div>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-6 scroll-smooth" id="help-content-container">
                <!-- Current Page Dynamic Content -->
                <div id="help-dynamic-content">
                    <div class="animate-pulse space-y-4">
                        <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                        <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                        <div class="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                </div>

                <!-- All Topics List -->
                <div class="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
                    <h3 class="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">All Topics</h3>
                    <div id="help-all-topics" class="space-y-1">
                        <!-- Topics List -->
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <a href="knowledge-base.html" class="flex items-center justify-center gap-2 w-full py-2.5 bg-neon-violet hover:bg-neon-violet/90 text-white rounded-xl font-medium transition shadow-neon-sm">
                    <span class="material-symbols-outlined text-lg">open_in_new</span>
                    View Full Knowledge Base
                </a>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Help Content Database
const helpDocs = {
    'index.html': {
        title: 'Dashboard',
        content: `
            <div class="prose dark:prose-invert prose-sm max-w-none">
                <p>Welcome to your <strong>Dashboard</strong>. This is your central command center for the Adhirat Portal.</p>
                <h3>Key Features:</h3>
                <ul>
                    <li><strong>Overview Stats:</strong> Real-time metrics on users, revenue, and system health.</li>
                    <li><strong>Quick Actions:</strong> Fast access to creating users, campaigns, or reports.</li>
                    <li><strong>Activity Feed:</strong> Recent actions taken within your organization.</li>
                </ul>
            </div>
        `
    },
    'websites.html': {
        title: 'Websites Dashboard',
        content: `
            <div class="prose dark:prose-invert prose-sm max-w-none">
                <p>The <strong>Websites Dashboard</strong> allows you to manage all your web projects in one place.</p>
                <h3>How to use:</h3>
                <ul>
                    <li><strong>Create New:</strong> Click the card or the top button to start the Composer.</li>
                    <li><strong>Edit:</strong> Click on any existing project card to open it in the Composer.</li>
                    <li><strong>Status:</strong> Quickly see which sites are Live vs Draft.</li>
                </ul>
            </div>
        `
    },
    'composer.html': {
        title: 'Website Composer',
        content: `
            <div class="prose dark:prose-invert prose-sm max-w-none">
                <p>Build beautiful pages with our <strong>Drag & Drop Composer</strong>.</p>
                <h3>Interface Guide:</h3>
                <ul>
                    <li><strong>Left Sidebar (Toolkit):</strong> Contains all available components (Sections, Text, Images, etc.). Drag these onto the canvas.</li>
                    <li><strong>Center (Canvas):</strong> Your workspace. Drop elements here to build your page.</li>
                    <li><strong>Right Sidebar (Properties):</strong> Select an element on the canvas to edit its specific properties here.</li>
                    <li><strong>Top Bar:</strong> Switch device views (Desktop/Tablet/Mobile) and Publish your site.</li>
                </ul>
            </div>
        `
    },
    'settings.html': {
        title: 'Settings',
        content: `
            <div class="prose dark:prose-invert prose-sm max-w-none">
                <p>Configure your global <strong>Portal Settings</strong> here.</p>
                <h3>Available Options:</h3>
                <ul>
                    <li><strong>General:</strong> Update organization details and logo.</li>
                    <li><strong>Users:</strong> Manage team access and roles.</li>
                    <li><strong>Billing:</strong> View subscription plans and payment history.</li>
                    <li><strong>Integrations:</strong> Connect with third-party tools.</li>
                </ul>
            </div>
        `
    },
    'knowledge-base.html': {
        title: 'Knowledge Base',
        content: `
            <div class="prose dark:prose-invert prose-sm max-w-none">
                <p>The <strong>Knowledge Base</strong> is your library for all Adhirat Portal documentation.</p>
                <h3>Features:</h3>
                <ul>
                    <li><strong>Search:</strong> Use the hero search bar to find specific topics.</li>
                    <li><strong>Categories:</strong> Browse guides by module (Websites, Billing, Team).</li>
                </ul>
            </div>
        `
    },
    // Default fallback
    'default': {
        title: 'Portal Help',
        content: `
            <div class="prose dark:prose-invert prose-sm max-w-none">
                <p>Welcome to Adhirat Portal Help. This context-aware guide provides specific information based on the page you are viewing.</p>
                <p>Please navigate to a specific module to see its documentation here.</p>
            </div>
        `
    }
};

window.toggleHelp = function () {
    const modal = document.getElementById('help-modal');
    const panel = document.getElementById('help-panel');
    const backdrop = document.getElementById('help-backdrop');

    if (!modal) {
        injectHelpModal();
        // Recurse once after injection
        setTimeout(toggleHelp, 50);
        return;
    }

    if (modal.classList.contains('hidden')) {
        // Open
        updateHelpContent();
        document.getElementById('help-search-input').value = ''; // Clear search
        searchHelp(''); // Reset content visibility

        modal.classList.remove('hidden');
        // Animation
        setTimeout(() => {
            backdrop.classList.remove('opacity-0');
            panel.classList.remove('translate-x-full');
        }, 10);
    } else {
        // Close
        backdrop.classList.add('opacity-0');
        panel.classList.add('translate-x-full');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}

function updateHelpContent() {
    const page = window.location.pathname.split("/").pop() || "index.html";
    const activePage = (page === "" || page === "/") ? "index.html" : page;

    // Update Dynamic Content
    const data = helpDocs[activePage] || helpDocs['default'];
    document.getElementById('help-subtitle').textContent = data.title;
    document.getElementById('help-dynamic-content').innerHTML = data.content;

    // Generate All Topics List
    const topicsContainer = document.getElementById('help-all-topics');
    let topicsHTML = '';

    Object.keys(helpDocs).forEach(key => {
        if (key === 'default') return; // Skip default
        const doc = helpDocs[key];
        topicsHTML += `
            <button onclick="loadTopic('${key}')" class="help-topic-item w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition flex items-center gap-2 group">
                <span class="material-symbols-outlined text-slate-400 group-hover:text-neon-violet text-lg transition-colors">article</span>
                <span class="text-sm font-medium">${doc.title}</span>
            </button>
        `;
    });
    topicsContainer.innerHTML = topicsHTML;
}

// Search and Filter Logic
window.searchHelp = function (query) {
    const filter = query.toLowerCase();
    const dynamicContent = document.getElementById('help-dynamic-content');
    const topicsContainer = document.getElementById('help-all-topics');
    const items = topicsContainer.getElementsByClassName('help-topic-item');

    // Toggle Dynamic Content (Hide if searching, Show if empty)
    if (filter.length > 0) {
        dynamicContent.style.display = 'none';
    } else {
        dynamicContent.style.display = 'block';
    }

    // Filter List Items
    for (let i = 0; i < items.length; i++) {
        const span = items[i].getElementsByTagName("span")[1]; // The text span
        if (span) {
            const txtValue = span.textContent || span.innerText;
            if (txtValue.toLowerCase().indexOf(filter) > -1) {
                items[i].style.display = "";
            } else {
                items[i].style.display = "none";
            }
        }
    }
}

// Load a specific topic from the list
window.loadTopic = function (key) {
    const data = helpDocs[key];
    if (data) {
        document.getElementById('help-subtitle').textContent = data.title;
        document.getElementById('help-dynamic-content').innerHTML = data.content;

        // Reset Search
        document.getElementById('help-search-input').value = '';
        searchHelp('');

        // Scroll to top
        document.getElementById('help-content-container').scrollTop = 0;
    }
}
// ==========================================
// Organization / Multi-Tenancy Logic
// ==========================================

let orgDropdownOpen = false;

window.toggleOrgDropdown = function () {
    const dropdown = document.getElementById('org-dropdown-menu');
    if (!dropdown) return;

    orgDropdownOpen = !orgDropdownOpen;

    if (orgDropdownOpen) {
        dropdown.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
        dropdown.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');

        // Refresh list when opening
        loadOrgSwitcher();
    } else {
        dropdown.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
        dropdown.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
    }
};

// Close dropdown when clicking outside
document.addEventListener('click', function (event) {
    const dropdown = document.getElementById('org-dropdown-menu');
    const button = event.target.closest('button[onclick="toggleOrgDropdown()"]');

    if (orgDropdownOpen && dropdown && !dropdown.contains(event.target) && !button) {
        toggleOrgDropdown();
    }
});

async function loadOrgSwitcher() {
    try {
        const { getUserOrganizations, getCurrentOrgId, switchOrganization } = await import('./firebase-modules.js');

        const orgs = await getUserOrganizations();
        const currentId = getCurrentOrgId();
        const container = document.getElementById('org-list-container');

        if (!container) return;

        // Render List
        container.innerHTML = orgs.map(org => {
            const isActive = org.id === currentId;
            const logoSrc = org.logo || '../assets/images/logo.svg'; // Fallback

            return `
            <button onclick="handleOrgSwitch('${org.id}')" class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all group ${isActive ? 'bg-neon-violet/10 border border-neon-violet/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'}">
                <div class="flex items-center gap-3">
                    <div class="size-8 rounded-lg bg-white dark:bg-slate-700 p-0.5 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                        ${org.logo ? `<img src="${org.logo}" class="w-full h-full object-contain">` : `<span class="text-xs font-bold text-slate-500">${org.name.substring(0, 2).toUpperCase()}</span>`}
                    </div>
                    <div class="text-left">
                        <p class="text-xs font-bold text-slate-800 dark:text-slate-200 ${isActive ? 'text-neon-violet dark:text-neon-cyan' : ''}">${org.name}</p>
                        <p class="text-[10px] text-slate-500 capitalize">${org.role}</p>
                    </div>
                </div>
                ${isActive ? '<span class="material-symbols-outlined text-neon-violet text-sm">check_circle</span>' : ''}
            </button>
            `;
        }).join('');

        // Update Header Display
        const currentOrg = orgs.find(o => o.id === currentId) || orgs[0];
        if (currentOrg) {
            const nameEl = document.getElementById('current-org-name');
            const logoEl = document.getElementById('current-org-logo');

            if (nameEl) nameEl.textContent = currentOrg.name;
            if (logoEl && currentOrg.logo) logoEl.src = currentOrg.logo;
        }

    } catch (e) {
        console.error("Failed to load org switcher:", e);
    }
}

window.handleOrgSwitch = async function (orgId) {
    try {
        const { switchOrganization } = await import('./firebase-modules.js');
        await switchOrganization(orgId);
        window.location.reload(); // Reload to apply context
    } catch (e) {
        console.error("Switch failed", e);
    }
};

window.createNewOrg = async function () {
    const name = prompt("Enter Organization Name:");
    if (name) {
        try {
            const { createOrganization } = await import('./firebase-modules.js');
            const result = await createOrganization(name);
            if (result.success) {
                window.location.reload();
            } else {
                alert("Failed: " + result.error);
            }
        } catch (e) {
            console.error(e);
        }
    }
};

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure firebase is ready if needed
    setTimeout(loadOrgSwitcher, 500);
});
