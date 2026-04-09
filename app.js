const app = {
    apiKey: 'AIzaSyCNdm_eWA65yTRVnikOCMuG6-mwHRiwFAc',
    currentUser: JSON.parse(localStorage.getItem('ab_enterprise_user')) || null,
    chatHistory: JSON.parse(localStorage.getItem('ab_chat_history_v11')) || [],
    userPoints: 850,
    careState: { tmic: false, cable: false, dryer: false, battery: false },

    // --- V21 Integrated Data Layer ---
    pendingApprovals: [
        { id: 101, name: 'Dra. Ana Costa', role: 'ESPECIALISTA', country: 'MEX', email: 'ana.costa@imss.mx' },
        { id: 103, name: 'Dr. Luis Torres', role: 'ESPECIALISTA', country: 'COL', email: 'ltorres@clinica.co' },
        { id: 105, name: 'Dra. Elena Soler', role: 'ESPECIALISTA', country: 'MEX', email: 'esoler@hospital.mx' }
    ],

    patientDatabase: [
        { id: 'P-001', name: 'Mario Galvis', age: 45, implant: 'Marvel CI', lastMap: '2026-03-15' },
        { id: 'P-002', name: 'Lucía Ortega', age: 12, implant: 'HiRes Ultra 3D', lastMap: '2026-04-01' },
        { id: 'P-004', name: 'Valeria Sossa', age: 28, implant: 'Naída CI', lastMap: '2026-04-05' }
    ],

    init() {
        this.bindEvents();
        this.checkAuth();
        this.registerSW();
        console.log("AB Marvel Core V21 - Ultra Premium Online");
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
        if (!this.currentUser) { 
            loginScreen.classList.add('active'); 
            appShell.style.display = 'none'; 
        } else { 
            loginScreen.classList.remove('active'); 
            appShell.style.display = 'flex'; 
            this.setupHeader(); 
            this.switchView('home'); 
            this.renderHistorySidebar(); 
        }
    },

    login() {
        const name = document.getElementById('login-name').value.trim();
        const role = document.getElementById('login-role').value;
        const country = document.getElementById('login-country').value;
        if (!name) { this.toast("Nombre requerido para credencial", "error"); return; }
        
        // V21 Cinematic Login Sequence
        const btn = document.querySelector('.login-side-form .ab-btn-primary');
        btn.innerHTML = '<div class="spinner"></div>';
        
        setTimeout(() => {
            this.currentUser = { name, role, country, id: 'USR-' + Math.floor(Math.random()*1000) };
            localStorage.setItem('ab_enterprise_user', JSON.stringify(this.currentUser));
            this.checkAuth();
            this.toast(`Bienvenido al Ecosistema Marvel: ${name}`, "success");
        }, 800);
    },

    logout() { localStorage.clear(); location.reload(); },

    setupHeader() {
        document.getElementById('header-user-name').innerText = this.currentUser.name;
        document.getElementById('current-country-badge').innerText = this.currentUser.country;
        document.getElementById('current-role-badge').innerText = this.currentUser.role;
        document.querySelector('.user-avatar').innerText = this.currentUser.name[0];
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
        // V21 Premium Skeletons
        main.innerHTML = `
            <div class="ab-skeleton heading shimmer" style="width:200px;"></div>
            <div class="stat-grid" style="margin-top:24px;">
                <div class="ab-card shimmer" style="height:100px; border:none; background:var(--white);"></div>
                <div class="ab-card shimmer" style="height:100px; border:none; background:var(--white);"></div>
            </div>
        `;
        
        setTimeout(() => {
            main.innerHTML = '';
            const section = document.createElement('div');
            section.className = 'view active view-enter';
            
            switch(viewId) {
                case 'home': section.innerHTML = this.getHomeHTML(); break;
                case 'profile': section.innerHTML = this.getProfileHTML(); break;
                case 'tools': section.innerHTML = this.getToolsHTML(); break;
                case 'maintenance': section.innerHTML = this.getMaintHTML(); break;
            }
            
            main.appendChild(section);
            if (window.lucide) lucide.createIcons();
        }, 350);
    },

    getHomeHTML() {
        const role = this.currentUser.role;
        if (role === 'ADMIN') return this.getAdminHome();
        if (role === 'ESPECIALISTA') return this.getSpecHome();
        return this.getPatientHome();
    },

    getAdminHome() {
        return `
            <div style="margin-bottom:32px;"><h1>Marvel Enterprise Hub</h1><p class="text-caps">Data Intelligence Core</p></div>
            <div class="stat-grid">
                <div class="ab-card">
                    <span class="text-caps">Validaciones</span>
                    <h2 style="font-size:2.4rem; color:var(--primary);">${this.pendingApprovals.length}</h2>
                    <p style="font-size:0.75rem; color:var(--success);">Sincronizado con Global Cloud</p>
                </div>
                <div class="ab-card">
                    <span class="text-caps">Países Activos</span>
                    <h2 style="font-size:2.4rem;">04</h2>
                </div>
            </div>
            <div class="ab-table-container shadow-sm" style="margin-top:24px;">
                <table class="ab-table">
                    <thead><tr><th>Profesional</th><th>Territorio</th><th>Email</th><th>Acción</th></tr></thead>
                    <tbody>
                        ${this.pendingApprovals.map(u => `<tr><td><b>${u.name}</b></td><td>${u.country}</td><td>${u.email}</td><td><button class="ab-btn ab-btn-primary" style="padding:4px 12px; font-size:0.7rem;" onclick="app.toast('Validado', 'success')">Validar</button></td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    getSpecHome() {
        return `
            <div style="margin-bottom:32px;"><h1>Clinical Monitor</h1><p class="text-caps">Patient Lifecycle Management</p></div>
            <div class="stat-grid">
                <div class="ab-card"><span class="text-caps">Pacientes</span><h2 style="font-size:2.4rem;">${this.patientDatabase.length}</h2></div>
                <div class="ab-card"><span class="text-caps">Marvel Metrics</span><h2 style="color:var(--primary); font-size:2.4rem;">98.4%</h2><p style="font-size:0.7rem;">Clinical Stability Index</p></div>
            </div>
            <div style="margin-top:24px; display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
                ${this.patientDatabase.map(p => `
                    <div class="ab-card shadow-sm" onclick="app.toast('Abriendo expediente', 'warning')">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <b>${p.name}</b>
                            <span class="ab-badge" style="background:var(--primary-soft); color:var(--primary);">${p.implant}</span>
                        </div>
                        <p style="font-size:0.75rem; color:var(--slate-400); margin-top:12px;">Último Mapeo: ${p.lastMap}</p>
                    </div>
                `).join('')}
            </div>
        `;
    },

    getPatientHome() {
        return `
            <div style="margin-bottom:32px;"><h1>Bienvenido</h1><p class="text-caps">My Care Marvel Suite</p></div>
            <div class="stat-grid">
                <div class="ab-card" style="background:linear-gradient(135deg, var(--primary), var(--primary-deep)); color:white;">
                    <span class="text-caps" style="color:rgba(255,255,255,0.6)">Puntos Plus</span>
                    <h2 style="font-size:2.4rem;">1,250</h2>
                </div>
                <div class="ab-card"><span class="text-caps">Racha Vital</span><h2 style="font-size:2.4rem;">12 Días</h2></div>
            </div>
        `;
    },

    getProfileHTML() { return `<div class="ab-card"><h1>Perfil Marvel</h1><button class="ab-btn ab-btn-primary" style="margin-top:24px; color:var(--danger);" onclick="app.logout()">Cerrar Sistema</button></div>`; },
    getToolsHTML() { return `<div class="ab-card"><h1>UI Kit Marvel Core</h1><p>Tokens V21 Aplicados.</p></div>`; },
    getMaintHTML() { return `<div class="ab-card"><h1>Cuidados Marvel</h1><p>Personalización de Alertas.</p></div>`; },

    sendMessageSidebar() {
        const input = document.getElementById('sidebar-ai-input');
        const text = input.value.trim();
        if (!text) return;
        this.addMessageToSidebar(text, 'user');
        this.chatHistory.push({ role: 'user', parts: [{ text }] });
        input.value = '';
        this.callGeminiMarvel();
    },

    async callGeminiMarvel() {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
        const payload = { 
            system_instruction: { parts: [{ text: `V21 Marvel Elite Consultant. Technical clinical dashboard specialist. Role: ${this.currentUser.role}.` }] },
            contents: this.chatHistory.slice(-10)
        };
        try {
            const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await resp.json();
            const text = data.candidates[0].content.parts[0].text;
            this.addMessageToSidebar(text, 'ai');
            this.chatHistory.push({ role: 'model', parts: [{ text }] });
        } catch (e) { this.toast("Error Sincronización", "error"); }
    },

    addMessageToSidebar(text, type) {
        const chat = document.getElementById('sidebar-chat-messages');
        const msg = document.createElement('div');
        msg.className = `message-wrapper ${type} view-enter`;
        msg.innerHTML = `<div class="message" style="padding:12px 16px; font-size:0.85rem; border-radius:12px; ${type === 'user' ? 'background:var(--primary); color:white; align-self:flex-end;' : 'background:var(--slate-100);'}"><span>${text}</span></div>`;
        chat.appendChild(msg);
        chat.scrollTop = chat.scrollHeight;
    },

    renderHistorySidebar() {
        const chat = document.getElementById('sidebar-chat-messages');
        chat.innerHTML = '';
        this.chatHistory.forEach(msg => this.addMessageToSidebar(msg.parts[0].text, msg.role === 'user' ? 'user' : 'ai'));
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
window.app = app;
