const app = {
    apiKey: 'AIzaSyCNdm_eWA65yTRVnikOCMuG6-mwHRiwFAc',
    currentUser: JSON.parse(localStorage.getItem('ab_enterprise_user')) || null,
    chatHistory: JSON.parse(localStorage.getItem('ab_chat_history_v11')) || [],
    userPoints: 1250,
    careState: { tmic: true, cable: false, dryer: true, battery: false },

    // --- V22 Reality Dataset (Enhanced with Warranty & Clinical Samples) ---
    pendingApprovals: [
        { id: 101, name: 'Dra. Ana Costa', role: 'ESPECIALISTA', country: 'MEX', email: 'ana.costa@imss.mx' },
        { id: 103, name: 'Dr. Luis Torres', role: 'ESPECIALISTA', country: 'COL', email: 'ltorres@clinica.co' }
    ],

    patientDatabase: [
        { 
            id: 'P-001', name: 'Mario Galvis', implant: 'Marvel CI', lastMap: '2026-03-15',
            warrantyDate: '2026-10-12', 
            impedanceSamples: [6.8, 7.1, 7.0, 6.9, 7.2, 7.1, 7.0, 7.1] 
        },
        { 
            id: 'P-002', name: 'Lucía Ortega', implant: 'HiRes Ultra 3D', lastMap: '2026-04-01',
            warrantyDate: '2026-05-15', // Expiring soon
            impedanceSamples: [8.2, 8.5, 9.1, 8.8, 8.7, 8.9, 9.0, 9.2]
        },
        { 
            id: 'P-004', name: 'Valeria Sossa', implant: 'Naída CI', lastMap: '2026-04-05',
            warrantyDate: '2027-12-20',
            impedanceSamples: [7.5, 7.6, 7.4, 7.5, 7.5, 7.6, 7.5, 7.4]
        }
    ],

    init() {
        this.bindEvents();
        this.checkAuth();
        this.registerSW();
        console.log("AB Marvel Core V22 - Warranty Sentinel Online");
    },

    registerSW() { if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js'); },

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.getAttribute('data-view');
                if (view) this.switchView(view);
            });
        });
    },

    checkAuth() {
        const loginScreen = document.getElementById('login-screen');
        const appShell = document.querySelector('.app-shell');
        if (!this.currentUser) { loginScreen.classList.add('active'); appShell.style.display = 'none'; } 
        else { loginScreen.classList.remove('active'); appShell.style.display = 'flex'; this.setupHeader(); this.switchView('home'); this.renderHistorySidebar(); }
    },

    login() {
        const name = document.getElementById('login-name').value.trim();
        const role = document.getElementById('login-role').value;
        const country = document.getElementById('login-country').value;
        if (!name) { this.toast("Nombre requerido para credencial", "error"); return; }
        this.currentUser = { name, role, country, id: 'USR-' + Math.floor(Math.random()*1000) };
        localStorage.setItem('ab_enterprise_user', JSON.stringify(this.currentUser));
        this.checkAuth();
        this.toast(`Bienvenido a Marvel Clinical Hub`, "success");
    },

    logout() { localStorage.clear(); location.reload(); },

    setupHeader() {
        document.getElementById('header-user-name').innerText = this.currentUser.name;
        document.getElementById('current-country-badge').innerText = this.currentUser.country;
        document.getElementById('current-role-badge').innerText = this.currentUser.role;
        document.querySelector('.user-avatar').innerText = this.currentUser.name[0];
    },

    // --- V22 Warranty & Clinical Engine ---
    calculateWarrantyDays(expireDate) {
        const end = new Date(expireDate);
        const now = new Date();
        const diff = end - now;
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    },

    renderClinicalChart(canvasId, samples) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        if (window.myChart) window.myChart.destroy();
        
        window.myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: samples.map((_, i) => `S${i+1}`),
                datasets: [{
                    label: 'Impedancia (kΩ)',
                    data: samples,
                    borderColor: '#00A3DA',
                    backgroundColor: 'rgba(0, 163, 218, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#00A3DA'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: false, grid: { display: false }, ticks: { font: { size: 10 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                }
            }
        });
    },

    openIdPatient(id) {
        const p = this.patientDatabase.find(x => x.id === id);
        const days = this.calculateWarrantyDays(p.warrantyDate);
        const html = `
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div class="warranty-sentinel-mini ${days < 60 ? 'danger' : ''}">
                    <span class="text-caps">Estado de Garantía</span>
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:8px;">
                        <h2 style="margin:0;">${days} Días restantes</h2>
                        <small>${p.warrantyDate}</small>
                    </div>
                    <div class="warranty-bar"><div class="warranty-progress" style="width:${Math.min(100, (days/365)*100)}%"></div></div>
                </div>
                <div>
                    <h4 style="margin-bottom:12px;">Estabilidad Marvel (Impedancias)</h4>
                    <div style="height:180px;"><canvas id="clinical-chart"></canvas></div>
                </div>
            </div>
        `;
        this.openModal(`Expediente Marvel: ${p.name}`, html);
        setTimeout(() => this.renderClinicalChart('clinical-chart', p.impedanceSamples), 400);
    },

    // --- V21 UI Component Methods ---
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
        toast.className = `ab-toast ${type}`;
        const icons = { success: 'check-circle', error: 'alert-circle', warning: 'bell' };
        toast.innerHTML = `<i data-lucide="${icons[type]}"></i> <div><b>${type.toUpperCase()}</b><p style="margin:0; font-size:0.8rem;">${text}</p></div>`;
        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 3000);
    },

    switchView(viewId) {
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-view') === viewId));
        if (window.innerWidth < 768) document.getElementById('app-sidebar').classList.remove('active');
        this.renderRoleView(viewId);
    },

    renderRoleView(viewId) {
        const main = document.getElementById('main-content');
        main.innerHTML = `<div class="ab-skeleton heading shimmer" style="width:200px;"></div><div class="stat-grid" style="margin-top:24px;"><div class="ab-card shimmer" style="height:100px;"></div></div>`;
        setTimeout(() => {
            main.innerHTML = '';
            const section = document.createElement('div');
            section.className = 'view active view-enter';
            switch(viewId) {
                case 'home': section.innerHTML = this.getHomeHTML(); break;
                case 'profile': section.innerHTML = this.getProfileHTML(); break;
                case 'tools': section.innerHTML = `<div class='ab-card'><h1>UI Kit Marvel Core</h1></div>`; break;
            }
            main.appendChild(section);
            if (window.lucide) lucide.createIcons();
        }, 350);
    },

    getHomeHTML() {
        const role = this.currentUser.role;
        const country = this.currentUser.country;
        if (role === 'ADMIN') return this.getAdminHome();
        if (role === 'ESPECIALISTA') return this.getSpecHome();
        return this.getPatientHome();
    },

    getAdminHome() {
        return `
            <div style="margin-bottom:32px;"><h1>Marvel Enterprise Hub</h1><p class="text-caps">Data Intelligence Core</p></div>
            <div class="stat-grid">
                <div class="ab-card"><span class="text-caps">Validaciones</span><h2 style="font-size:2.4rem; color:var(--primary);">${this.pendingApprovals.length}</h2></div>
                <div class="ab-card"><span class="text-caps">Expiraciones (30d)</span><h2 style="font-size:2.4rem; color:var(--danger);">12</h2></div>
            </div>
            <div class="ab-table-container shadow-sm" style="margin-top:24px;">
                <table class="ab-table">
                    <thead><tr><th>Profesional</th><th>País</th><th>Acción</th></tr></thead>
                    <tbody>
                        ${this.pendingApprovals.map(u => `<tr><td><b>${u.name}</b></td><td>${u.country}</td><td><button class="ab-btn-primary ab-btn" style="padding:4px 12px; font-size:0.7rem;" onclick="app.toast('Validado', 'success')">Validar</button></td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    getSpecHome() {
        return `
            <div style="margin-bottom:32px;"><h1>Clinical Monitor</h1><p class="text-caps">Marvel CI Health Tracker</p></div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:24px;">
                ${this.patientDatabase.map(p => {
                    const days = this.calculateWarrantyDays(p.warrantyDate);
                    return `
                        <div class="ab-card shadow-sm" onclick="app.openIdPatient('${p.id}')">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <b>${p.name}</b>
                                <span class="ab-badge" style="background:${days < 60 ? 'var(--danger)' : 'var(--primary-soft)'}; color:${days < 60 ? 'white' : 'var(--primary)'};">${days}d Garantía</span>
                            </div>
                            <p style="font-size:0.7rem; color:var(--slate-400); margin-top:12px;">Implant: ${p.implant} | Last: ${p.lastMap}</p>
                            <div style="height:40px; margin-top:12px; opacity:0.3;"><canvas id="mini-chart-${p.id}"></canvas></div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    getPatientHome() {
        // Find self in database (Mock logic: assume Mario for demo)
        const p = this.patientDatabase[0];
        const days = this.calculateWarrantyDays(p.warrantyDate);
        return `
            <div style="margin-bottom:32px;"><h1>Hola, ${this.currentUser.name}</h1><p class="text-caps">Marvel Suite</p></div>
            <div class="warranty-sentinel-card ${days < 60 ? 'danger' : ''}">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="text-caps" style="color:${days < 60 ? 'white' : 'var(--primary)'}">TU GARANTÍA MARVEL</span>
                    <i data-lucide="shield-check" style="color:${days < 60 ? 'white' : 'var(--primary)'}"></i>
                </div>
                <h1 style="font-size:3.5rem; margin:12px 0;">${days} <small style="font-size:1.2rem; font-weight:400;">Días restantes</small></h1>
                <p style="font-size:0.85rem; opacity:0.8;">Tu dispositivo está protegido hasta el <b>${p.warrantyDate}</b>. ${days < 30 ? '¡Contacta a tu distribuidor hoy!' : ''}</p>
                <div class="warranty-bar" style="background:${days < 60 ? 'rgba(255,255,255,0.2)' : 'var(--primary-soft)'}; margin-top:20px;">
                    <div class="warranty-progress" style="width:${Math.min(100, (days/365)*100)}%; background:${days < 60 ? 'white' : 'var(--primary)'}"></div>
                </div>
            </div>
            
            <div class="stat-grid" style="margin-top:24px;">
                <div class="ab-card shadow-sm"><span class="text-caps">Puntos</span><h2>1,250</h2></div>
                <div class="ab-card shadow-sm"><span class="text-caps">Nivel</span><h2>Platino</h2></div>
            </div>
        `;
    },

    getProfileHTML() { return `<div class="ab-card"><h1>Perfil</h1><button class="ab-btn" onclick="app.logout()">Log out</button></div>`; },

    renderHistorySidebar() {
        const chat = document.getElementById('sidebar-chat-messages');
        chat.innerHTML = `<div class="message view-enter" style="padding:12px; background:var(--slate-100); border-radius:12px; font-size:0.8rem;">Melody Clinical AI activa. Consultar logs de garantía...</div>`;
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
window.app = app;
