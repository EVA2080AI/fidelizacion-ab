const app = {
    apiKey: 'AIzaSyCNdm_eWA65yTRVnikOCMuG6-mwHRiwFAc',
    currentUser: JSON.parse(localStorage.getItem('ab_enterprise_user')) || null,
    chatHistory: JSON.parse(localStorage.getItem('ab_chat_history_v11')) || [],
    userPoints: 1250,
    careState: { tmic: true, cable: false, dryer: true, battery: false },

    // --- V22 Reality Dataset ---
    patientDatabase: [
        { id: 'P-001', name: 'Mario Galvis', implant: 'Marvel CI', lastMap: '2026-03-15', warrantyDate: '2026-10-12', impedanceSamples: [6.8, 7.1, 7.0, 6.9, 7.2, 7.1, 7.0, 7.1] },
        { id: 'P-002', name: 'Lucía Ortega', implant: 'HiRes Ultra 3D', lastMap: '2026-04-01', warrantyDate: '2026-05-15', impedanceSamples: [8.2, 8.5, 9.1, 8.8, 8.7, 8.9, 9.0, 9.2] },
        { id: 'P-004', name: 'Valeria Sossa', implant: 'Naída CI', lastMap: '2026-04-05', warrantyDate: '2027-12-20', impedanceSamples: [7.5, 7.6, 7.4, 7.5, 7.5, 7.6, 7.5, 7.4] }
    ],

    init() {
        this.bindEvents();
        this.checkAuth();
        this.registerSW();
        this.initLighting();
        console.log("AB Surgical Precision V23 - UI/UX Masterclass Active");
    },

    registerSW() { if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js'); },

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.getAttribute('data-view');
                if (view) this.switchView(view);
            });
        });
        
        // Haptic-Visual feedback for all buttons
        document.addEventListener('mousedown', (e) => {
            if (e.target.closest('.ab-btn')) this.createRipple(e);
        });
    },

    initLighting() {
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            document.documentElement.style.setProperty('--mouse-x', `${x}%`);
            document.documentElement.style.setProperty('--mouse-y', `${y}%`);
        });
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
        if (!name) { this.toast("Autenticación Requerida", "error"); return; }
        
        // V23 Cinematic Biometric Sequence
        const overlay = document.createElement('div');
        overlay.className = 'biometric-overlay glass-v3';
        overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.zIndex='10000';
        overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center';
        overlay.innerHTML = `
            <div style="text-align:center; color:var(--primary);">
                <div style="width:100px; height:100px; border:2px solid var(--primary); border-radius:50%; margin:0 auto 20px; position:relative; overflow:hidden;">
                    <div style="position:absolute; inset:0; background:linear-gradient(transparent, var(--primary), transparent); height:40%; animation: biometricScan 1.5s infinite linear;"></div>
                    <i data-lucide="scan" style="margin-top:25px; width:50px; height:50px;"></i>
                </div>
                <h3 class="text-caps">Escaneando Credencial Marvel...</h3>
            </div>
        `;
        document.body.appendChild(overlay);
        if (window.lucide) lucide.createIcons();
        
        setTimeout(() => {
            this.currentUser = { name, role, country, id: 'USR-' + Math.floor(Math.random()*1000) };
            localStorage.setItem('ab_enterprise_user', JSON.stringify(this.currentUser));
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                this.checkAuth();
                this.toast(`Acceso Concedido: ${name}`, "success");
            }, 500);
        }, 2200);
    },

    createRipple(e) {
        const btn = e.target.closest('.ab-btn');
        const ripple = document.createElement('span');
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
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

    // --- V23 UI Methods ---
    toggleSidebar() { document.getElementById('app-sidebar').classList.toggle('active'); },
    openModal(title, html) {
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-body').innerHTML = html;
        document.getElementById('global-modal').classList.add('active');
        if (window.lucide) lucide.createIcons();
    },
    closeModal() { document.getElementById('global-modal').classList.remove('active'); },

    toast(text, type = "success") {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `ab-toast ${type} glass-v3`;
        const icons = { success: 'check-circle', error: 'alert-circle', warning: 'bell' };
        toast.innerHTML = `<i data-lucide="${icons[type]}" class="signal-pulse"></i> <div><b>${type.toUpperCase()}</b><p style="margin:0; font-size:0.8rem;">${text}</p></div>`;
        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 3000);
    },

    switchView(viewId) {
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-view') === viewId));
        if (window.innerWidth < 768) document.getElementById('app-sidebar').classList.remove('active');
        this.renderRoleView(viewId);
    },

    renderRoleView(viewId) {
        const main = document.getElementById('main-content');
        main.innerHTML = `<div class="ab-skeleton heading shimmer view-cinematic-enter"></div><div class="stat-grid" style="margin-top:24px;"><div class="ab-card shimmer" style="height:120px;"></div></div>`;
        
        setTimeout(() => {
            main.innerHTML = '';
            const section = document.createElement('div');
            section.className = 'view active view-cinematic-enter';
            
            switch(viewId) {
                case 'home': section.innerHTML = this.getHomeHTML(); break;
                case 'profile': section.innerHTML = `<div class="ab-card"><h1>Surgical Account</h1><button class="ab-btn ab-btn-primary" style="margin-top:24px;" onclick="app.logout()">Log out</button></div>`; break;
                case 'tools': section.innerHTML = `<div class='ab-card'><h1>UI/UX Laboratory</h1><p>Surgical Precision v23 established.</p></div>`; break;
            }
            
            main.appendChild(section);
            if (window.lucide) lucide.createIcons();
        }, 400);
    },

    getHomeHTML() {
        const role = this.currentUser.role;
        return `
            <div style="margin-bottom:32px;"><h1>Control Center: ${this.currentUser.country}</h1><p class="text-caps">Precision Operational Hub</p></div>
            <div class="stat-grid">
                <div class="ab-card glass-v3">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="text-caps">Estado del Hub</span>
                        <div class="ab-status-glow signal-pulse"></div>
                    </div>
                    <h2 style="font-size:2.4rem; color:var(--primary); margin-top:12px;">ACTIVE</h2>
                </div>
                <div class="ab-card glass-v3">
                    <span class="text-caps">Signal Strength</span>
                    <h2 style="font-size:2.4rem;">0.4ms</h2>
                    <p style="font-size:0.75rem; color:var(--success);">Synchronized</p>
                </div>
            </div>
            <div class="ab-card glass-v3" style="margin-top:24px;">
                <h4 style="margin-bottom:20px;">SYSTEM AUDIT LOGS</h4>
                <div class="ab-skeleton shimmer" style="height:100px; border-radius:8px;"></div>
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
window.app = app;
