/* ============================================================
   AB HUB+ Client-Side Router
   ============================================================ */
window.AB = window.AB || {};

AB.Router = {
    currentView: null,

    // Navigation config per role
    navConfig: {
        cliente: [
            { id: 'home', label: 'Inicio', icon: 'layout-dashboard', section: 'Principal' },
            { id: 'warranty', label: 'Mi Garantia', icon: 'shield-check', section: 'Principal' },
            { id: 'checklist', label: 'Checklist', icon: 'check-square', section: 'Cuidado' },
            { id: 'tutorials', label: 'Tutoriales', icon: 'play-circle', section: 'Cuidado' },
            { id: 'accessories', label: 'Accesorios', icon: 'shopping-bag', section: 'Tienda' },
            { id: 'pqrs', label: 'PQRs', icon: 'message-circle', section: 'Soporte' },
            { id: 'benefits', label: 'Beneficios', icon: 'gift', section: 'Programa' },
            { id: 'profile', label: 'Mi Perfil', icon: 'user', section: 'Cuenta' }
        ],
        especialista: [
            { id: 'home', label: 'Inicio', icon: 'layout-dashboard', section: 'Principal' },
            { id: 'patients', label: 'Pacientes', icon: 'users', section: 'Clinica' },
            { id: 'devices', label: 'Dispositivos', icon: 'cpu', section: 'Clinica' },
            { id: 'tutorials', label: 'Recursos', icon: 'book-open', section: 'Formacion' },
            { id: 'profile', label: 'Mi Perfil', icon: 'user', section: 'Cuenta' }
        ],
        distribuidor: [
            { id: 'home', label: 'Inicio', icon: 'layout-dashboard', section: 'Principal' },
            { id: 'inventory', label: 'Inventario', icon: 'package', section: 'Operaciones' },
            { id: 'warranty-request', label: 'Solicitar Garantia', icon: 'file-plus', section: 'Garantias' },
            { id: 'tracking', label: 'Seguimiento', icon: 'map-pin', section: 'Garantias' },
            { id: 'profile', label: 'Mi Perfil', icon: 'user', section: 'Cuenta' }
        ],
        admin: [
            { id: 'home', label: 'Dashboard', icon: 'layout-dashboard', section: 'Principal' },
            { id: 'users', label: 'Usuarios', icon: 'users', section: 'Base de Datos' },
            { id: 'tables', label: 'Tablas', icon: 'table', section: 'Base de Datos' },
            { id: 'claims', label: 'Garantias', icon: 'shield', section: 'Operaciones' },
            { id: 'pqrs-admin', label: 'PQRs', icon: 'message-circle', section: 'Operaciones' },
            { id: 'import', label: 'Importar Datos', icon: 'upload', section: 'Herramientas' },
            { id: 'profile', label: 'Mi Perfil', icon: 'user', section: 'Cuenta' }
        ],
        superadmin: [
            { id: 'home', label: 'Dashboard', icon: 'layout-dashboard', section: 'Principal' },
            { id: 'users', label: 'Usuarios', icon: 'users', section: 'Base de Datos' },
            { id: 'tables', label: 'Tablas', icon: 'table', section: 'Base de Datos' },
            { id: 'claims', label: 'Garantias', icon: 'shield', section: 'Operaciones' },
            { id: 'pqrs-admin', label: 'PQRs', icon: 'message-circle', section: 'Operaciones' },
            { id: 'campaigns', label: 'Campanas', icon: 'megaphone', section: 'Marketing' },
            { id: 'benefits-config', label: 'Beneficios', icon: 'gift', section: 'Marketing' },
            { id: 'import', label: 'Importar Datos', icon: 'upload', section: 'Herramientas' },
            { id: 'profile', label: 'Mi Perfil', icon: 'user', section: 'Cuenta' }
        ]
    },

    // Bottom nav config (mobile - max 5 items)
    bottomNavConfig: {
        cliente: ['home', 'warranty', 'checklist', 'benefits', 'profile'],
        especialista: ['home', 'patients', 'devices', 'tutorials', 'profile'],
        distribuidor: ['home', 'inventory', 'warranty-request', 'tracking', 'profile'],
        admin: ['home', 'users', 'tables', 'claims', 'profile'],
        superadmin: ['home', 'users', 'campaigns', 'claims', 'profile']
    },

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
    },

    navigate(viewId) {
        window.location.hash = viewId;
    },

    handleRoute() {
        const hash = window.location.hash.replace('#', '') || 'home';
        this.renderView(hash);
    },

    renderView(viewId) {
        this.currentView = viewId;
        const role = AB.Auth.getRole();
        if (!role) return;

        // Update nav active states
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.view === viewId);
        });
        document.querySelectorAll('.bottom-nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.view === viewId);
        });

        // Update breadcrumb
        const navItem = this.getNavItems().find(n => n.id === viewId);
        const breadcrumb = document.getElementById('breadcrumb');
        if (breadcrumb && navItem) {
            breadcrumb.innerHTML = `
                <span class="breadcrumb-item">${AB.Auth.getRoleLabel(role)}</span>
                <span class="breadcrumb-sep">/</span>
                <span class="breadcrumb-item current">${navItem.label}</span>
            `;
        }

        // Render content
        const content = document.getElementById('main-content');
        if (!content) return;

        // Show loading skeleton
        content.innerHTML = `
            <div style="padding: var(--sp-4);">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text" style="width:80%"></div>
                <div class="skeleton skeleton-card" style="margin-top:var(--sp-4)"></div>
            </div>
        `;

        // Render actual view after brief delay for UX
        setTimeout(() => {
            const renderer = this.getViewRenderer(role, viewId);
            if (renderer) {
                content.innerHTML = renderer();
            } else {
                content.innerHTML = `
                    <div class="empty-state">
                        <i data-lucide="construction"></i>
                        <h3>Vista en construccion</h3>
                        <p>Esta seccion estara disponible pronto.</p>
                    </div>
                `;
            }
            if (window.lucide) lucide.createIcons();
            this.bindViewEvents(viewId);
        }, 200);
    },

    getNavItems() {
        const role = AB.Auth.getRole();
        return this.navConfig[role] || [];
    },

    getBottomNavItems() {
        const role = AB.Auth.getRole();
        const ids = this.bottomNavConfig[role] || [];
        const allItems = this.navConfig[role] || [];
        return ids.map(id => allItems.find(n => n.id === id)).filter(Boolean);
    },

    getViewRenderer(role, viewId) {
        // Map to view functions
        const views = {
            // Shared
            'home': () => AB.Views[role]?.home(),
            'profile': () => AB.Views.shared.profile(),

            // Cliente
            'warranty': () => AB.Views.cliente?.warranty(),
            'checklist': () => AB.Views.cliente?.checklist(),
            'tutorials': () => AB.Views.shared?.tutorials(),
            'accessories': () => AB.Views.cliente?.accessories(),
            'pqrs': () => AB.Views.cliente?.pqrs(),
            'benefits': () => AB.Views.cliente?.benefits(),

            // Especialista
            'patients': () => AB.Views.especialista?.patients(),
            'devices': () => AB.Views.especialista?.devices(),

            // Distribuidor
            'inventory': () => AB.Views.distribuidor?.inventory(),
            'warranty-request': () => AB.Views.distribuidor?.warrantyRequest(),
            'tracking': () => AB.Views.distribuidor?.tracking(),

            // Admin / SuperAdmin
            'users': () => AB.Views.admin?.users(),
            'tables': () => AB.Views.admin?.tables(),
            'claims': () => AB.Views.admin?.claims(),
            'pqrs-admin': () => AB.Views.admin?.pqrsAdmin(),
            'import': () => AB.Views.admin?.importData(),
            'campaigns': () => AB.Views.superadmin?.campaigns(),
            'benefits-config': () => AB.Views.superadmin?.benefitsConfig()
        };

        const renderer = views[viewId];
        if (!renderer) return null;
        try { return renderer; } catch { return null; }
    },

    bindViewEvents(viewId) {
        // Delegated event binding for dynamic content
        const content = document.getElementById('main-content');
        if (!content) return;

        // Generic click handlers using data attributes
        content.querySelectorAll('[data-action]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const action = el.dataset.action;
                const id = el.dataset.id;
                if (AB.Actions && AB.Actions[action]) {
                    AB.Actions[action](id, el);
                }
            });
        });
    },

    renderSideNav() {
        const nav = document.getElementById('side-nav');
        if (!nav) return;
        const items = this.getNavItems();
        const sections = {};
        items.forEach(item => {
            if (!sections[item.section]) sections[item.section] = [];
            sections[item.section].push(item);
        });

        let html = '';
        for (const [section, sectionItems] of Object.entries(sections)) {
            html += `<div class="nav-section">
                <div class="nav-section-title">${section}</div>`;
            sectionItems.forEach(item => {
                const isActive = this.currentView === item.id;
                html += `<div class="nav-item ${isActive ? 'active' : ''}" data-view="${item.id}" onclick="AB.Router.navigate('${item.id}')">
                    <i data-lucide="${item.icon}"></i>
                    <span>${item.label}</span>
                </div>`;
            });
            html += '</div>';
        }
        nav.innerHTML = html;
    },

    renderBottomNav() {
        const nav = document.getElementById('bottom-nav');
        if (!nav) return;
        const items = this.getBottomNavItems();
        nav.innerHTML = items.map(item => `
            <div class="bottom-nav-item ${this.currentView === item.id ? 'active' : ''}"
                 data-view="${item.id}" onclick="AB.Router.navigate('${item.id}')">
                <i data-lucide="${item.icon}"></i>
                <span>${item.label}</span>
            </div>
        `).join('');
    }
};
