const app = {
    apiKey: 'AIzaSyCNdm_eWA65yTRVnikOCMuG6-mwHRiwFAc',
    currentUser: JSON.parse(localStorage.getItem('ab_enterprise_user')) || null,
    chatHistory: JSON.parse(localStorage.getItem('ab_chat_history_v11')) || [],
    userPoints: 1250,
    careState: { tmic: true, cable: false, dryer: true, battery: false },

    // --- V24 Expert Dataset ---
    patientDatabase: [
        { id: 'P-001', name: 'Mario Galvis', implant: 'Marvel CI', lastMap: '2026-03-15', warrantyDate: '2026-12-12', impedanceSamples: [6.8, 7.1, 7.0, 6.9, 7.2, 7.1, 7.0, 7.1] },
        { id: 'P-002', name: 'Lucía Ortega', implant: 'HiRes Ultra 3D', lastMap: '2026-04-01', warrantyDate: '2026-05-15', impedanceSamples: [8.2, 8.5, 9.1, 8.8, 8.7, 8.9, 9.0, 9.2] },
        { id: 'P-004', name: 'Valeria Sossa', implant: 'Naída CI', lastMap: '2026-04-05', warrantyDate: '2027-10-20', impedanceSamples: [7.5, 7.6, 7.4, 7.5, 7.5, 7.6, 7.5, 7.4] }
    ],

    init() {
        this.bindEvents();
        this.checkAuth();
        this.registerSW();
        this.initExpertInteractions();
        this.checkAccessibility();
        console.log("AB Expert Signature V24 - Production Final Grade");
    },

    registerSW() { if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js'); },

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.getAttribute('data-view');
                if (view) this.switchView(view);
            });
        });
        document.addEventListener('mousedown', (e) => { if (e.target.closest('.ab-btn')) this.createRipple(e); });
    },

    initExpertInteractions() {
        // Spotlight Shadow Engine
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            document.documentElement.style.setProperty('--mouse-x', `${x}%`);
            document.documentElement.style.setProperty('--mouse-y', `${y}%`);
            
            // Magnetic Logic for CTAs
            const primaryBtn = document.querySelector('.ab-btn-primary');
            if (primaryBtn) {
                const rect = primaryBtn.getBoundingClientRect();
                const btnX = rect.left + rect.width / 2;
                const btnY = rect.top + rect.height / 2;
                const distX = e.clientX - btnX;
                const distY = e.clientY - btnY;
                const dist = Math.hypot(distX, distY);
                if (dist < 100) {
                    primaryBtn.style.transform = `translate(${distX * 0.2}px, ${distY * 0.2}px) scale(1.05)`;
                } else {
                    primaryBtn.style.transform = '';
                }
            }
        });
    },

    checkAccessibility() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.style.setProperty('--transition-cinematic', 'none');
            document.documentElement.style.setProperty('--liquid-ease', 'none');
        }
    },

    checkAuth() {
        const loginScreen = document.getElementById('login-screen');
        const appShell = document.querySelector('.app-shell');
        if (!this.currentUser) { loginScreen.classList.add('active'); appShell.style.display = 'none'; } 
        else { loginScreen.classList.remove('active'); appShell.style.display = 'flex'; this.setupHeader(); this.switchView('home'); }
    },

    login() {
        const name = document.getElementById('login-name').value.trim();
        const role = document.getElementById('login-role').value;
        const country = document.getElementById('login-country').value;
        if (!name) { this.toast("Validación Requerida", "error"); return; }
        
        // V24 Expert Biometric Flow
        this.showClinicalLoading();
        setTimeout(() => {
            this.currentUser = { name, role, country, id: 'USR-' + Math.floor(Math.random()*1000) };
            localStorage.setItem('ab_enterprise_user', JSON.stringify(this.currentUser));
            this.checkAuth();
            this.toast(`Marvel Core: ${name} Autenticado`, "success");
        }, 1800);
    },

    showClinicalLoading() {
        const l = document.createElement('div');
        l.className = 'glass-master';
        l.style.position='fixed'; l.style.inset='0'; l.style.zIndex='100000';
        l.style.display='flex'; l.style.alignItems='center'; l.style.justifyContent='center';
        l.innerHTML = `<div style="text-align:center;"><div class="signal-pulse" style="width:50px; height:50px; background:var(--primary); border-radius:50%; margin:0 auto;"></div><h4 class="text-caps" style="margin-top:20px;">Sincronizando Marvel...</h4></div>`;
        document.body.appendChild(l);
        setTimeout(() => l.style.opacity='0', 1600);
        setTimeout(() => l.remove(), 1800);
    },

    createRipple(e) {
        const btn = e.target.closest('.ab-btn');
        const ripple = document.createElement('span');
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size/2}px`;
        ripple.style.top = `${e.clientY - rect.top - size/2}px`;
        ripple.classList.add('ripple-effect');
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    },

    logout() { localStorage.clear(); location.reload(); },
    setupHeader() {
        document.getElementById('header-user-name').innerText = this.currentUser.name;
        document.getElementById('current-country-badge').innerText = this.currentUser.country;
        document.getElementById('current-role-badge').innerText = this.currentUser.role;
        document.querySelector('.user-avatar').innerText = this.currentUser.name[0];
    },

    switchView(viewId) {
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-view') === viewId));
        this.renderRoleView(viewId);
    },

    renderRoleView(viewId) {
        const main = document.getElementById('main-content');
        main.innerHTML = `<div class="ab-skeleton heading shimmer view-liquid-enter"></div>`;
        
        setTimeout(() => {
            main.innerHTML = '';
            const section = document.createElement('div');
            section.className = 'view active view-liquid-enter';
            
            switch(viewId) {
                case 'home': section.innerHTML = this.getHomeHTML(); break;
                case 'profile': section.innerHTML = `<div class="ab-card glass-master"><h1>Marvel Account</h1><button class="ab-btn ab-btn-primary" style="margin-top:32px;" onclick="app.logout()">Secure Log out</button></div>`; break;
            }
            
            main.appendChild(section);
            if (window.lucide) lucide.createIcons();
        }, 500);
    },

    getHomeHTML() {
        return `
            <div style="margin-bottom:32px;"><h1>Enterprise HUB: ${this.currentUser.country}</h1><p class="text-caps">Expert Management Console</p></div>
            <div class="stat-grid">
                <div class="ab-card glass-master" style="background:#fff;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="text-caps">System Integrity</span>
                        <div class="ab-status-glow signal-pulse"></div>
                    </div>
                    <h2 style="font-size:2.8rem; letter-spacing:-0.05em; margin-top:16px;">SECURE</h2>
                </div>
                <div class="ab-card glass-master">
                    <span class="text-caps">Active Latency</span>
                    <h2 style="font-size:2.2rem;">0.02ms</h2>
                </div>
            </div>
            <div style="margin-top:32px; display:grid; grid-template-columns: repeat(3, 1fr); gap:20px;">
                <div class="ab-card shadow-sm"><p class="text-caps">Pacientes</p><h2>${this.patientDatabase.length}</h2></div>
                <div class="ab-card shadow-sm"><p class="text-caps">Regiones</p><h2>06</h2></div>
                <div class="ab-card shadow-sm"><p class="text-caps">Alertas</p><h2>00</h2></div>
            </div>
        `;
    },

    toast(text, type = "success") {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `ab-toast ${type} glass-master view-liquid-enter`;
        toast.innerHTML = `<i data-lucide="bell" class="signal-pulse"></i> <div><b>${type.toUpperCase()}</b><p style="margin:0; font-size:0.8rem;">${text}</p></div>`;
        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
window.app = app;
