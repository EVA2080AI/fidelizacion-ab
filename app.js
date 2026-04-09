const app = {
    apiKey: 'AIzaSyCNdm_eWA65yTRVnikOCMuG6-mwHRiwFAc',
    currentUser: JSON.parse(localStorage.getItem('ab_enterprise_user')) || null,
    chatHistory: JSON.parse(localStorage.getItem('ab_chat_history_v11')) || [],
    userPoints: parseInt(localStorage.getItem('ab_user_points')) || 850,
    careState: JSON.parse(localStorage.getItem('ab_care_state')) || { tmic: false, cable: false, dryer: false, battery: false },
    userSettings: JSON.parse(localStorage.getItem('ab_user_settings')) || { notif_tmic: true, notif_dryer: true, reminder_time: "21:00" },

    init() {
        this.bindEvents();
        this.checkAuth();
        this.registerSW();
        console.log("AB Total Hub Completion V18 Online");
        this.startMaintEngine();
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
        if (!name) { this.toast("Nombre requerido", "error"); return; }
        this.currentUser = { name, role, country, id: 'USR-' + Math.floor(Math.random()*1000) };
        localStorage.setItem('ab_enterprise_user', JSON.stringify(this.currentUser));
        this.checkAuth();
    },

    logout() { localStorage.clear(); location.reload(); },

    setupHeader() {
        document.getElementById('header-user-name').innerText = this.currentUser.name;
        document.getElementById('current-country-badge').innerText = this.currentUser.country;
        document.getElementById('current-role-badge').innerText = this.currentUser.role;
        document.querySelector('.user-avatar').innerText = this.currentUser.name[0];
    },

    // --- V18 UI Engine Components ---
    toggleSidebar() {
        document.getElementById('app-sidebar').classList.toggle('active');
    },

    openModal(title, html) {
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-body').innerHTML = html;
        document.getElementById('global-modal').classList.add('active');
        if (window.lucide) lucide.createIcons();
    },

    closeModal() {
        document.getElementById('global-modal').classList.remove('active');
    },

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

    startMaintEngine() {
        setInterval(() => {
            if (this.currentUser?.role === 'CLIENTE' && this.userSettings.notif_tmic && Math.random() > 0.95) {
                this.toast("Recordatorio: Verificar limpieza de Procesador.", "warning");
            }
        }, 15000);
    },

    switchView(viewId) {
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-view') === viewId));
        if (window.innerWidth < 768) document.getElementById('app-sidebar').classList.remove('active');
        this.renderRoleView(viewId);
    },

    renderRoleView(viewId) {
        const main = document.getElementById('main-content');
        main.innerHTML = `<div class="ab-skeleton heading shimmer"></div><div class="stat-grid" style="margin-top:24px;"><div class="ab-card shimmer" style="height:120px;"></div><div class="ab-card shimmer" style="height:120px;"></div></div>`;
        
        setTimeout(() => {
            main.innerHTML = '';
            const section = document.createElement('div');
            section.className = 'view active';
            
            switch(viewId) {
                case 'home': section.innerHTML = this.getHomeHTML(); break;
                case 'maintenance': section.innerHTML = this.getMaintHTML(); break;
                case 'profile': section.innerHTML = this.getProfileHTML(); break;
                case 'tools': section.innerHTML = this.getToolsHTML(); break;
            }
            
            main.appendChild(section);
            if (window.lucide) lucide.createIcons();
            this.initRoleFeatures();
        }, 350);
    },

    getHomeHTML() {
        const role = this.currentUser.role;
        if (role === 'ADMIN') return this.getAdminHome();
        if (role === 'ESPECIALISTA') return this.getSpecHome();
        if (role === 'DISTRIBUIDOR') return this.getDistHome();
        return this.getPatientHome();
    },

    getAdminHome() {
        return `
            <div style="margin-bottom:32px;"><h1>Enterprise Insight</h1><p>Control global Advance Bionics.</p></div>
            <div class="stat-grid">
                <div class="ab-card">
                    <span class="stat-label">Registros Hoy</span>
                    <span class="stat-val">1,204</span>
                    <p style="font-size:0.75rem; color:var(--success);">+12% vs ayer</p>
                </div>
                <div class="ab-card">
                    <span class="stat-label">Alertas Clínicas</span>
                    <span class="stat-val" style="color:var(--danger);">42</span>
                    <p style="font-size:0.75rem; color:var(--slate-500);">Requieren atención inmediata</p>
                </div>
            </div>
            <div class="ab-card shadow-premium" style="margin-top:24px;">
                <h4 style="margin-bottom:20px;">MAPA DE OPERACIONES (COL/MEX/ARG)</h4>
                <div style="height:200px; background:var(--bg-light); border-radius:var(--radius-sm); border:1px dashed var(--slate-300); display:flex; align-items:center; justify-content:center;">
                    <span class="text-caps" style="opacity:0.5;">Visualizador de Territorio Interactivo</span>
                </div>
            </div>
        `;
    },

    getSpecHome() {
        return `
            <div style="margin-bottom:32px;"><h1>Especialista Pro</h1><p>Monitor de salud poblacional.</p></div>
            <div class="stat-grid">
                <div class="ab-card">
                    <span class="stat-label">Mapeos Pendientes</span>
                    <span class="stat-val">8</span>
                </div>
                <div class="ab-card">
                    <span class="stat-label">Promedio Impedancias</span>
                    <span class="stat-val">7.2 <small>kΩ</small></span>
                </div>
            </div>
            <div class="ab-table-container" style="margin-top:24px;">
                <table class="ab-table">
                    <thead><tr><th>Paciente</th><th>Última Rev.</th><th>Acción</th></tr></thead>
                    <tbody>
                        <tr><td><b>Mario Galvis</b></td><td>Ayer</td><td><button class="ab-btn ab-btn-primary" onclick="app.openModal('Historial Clínico: Mario', '<p>Auditoría de logs completada: 98% estabilidad.</p>')">Ver Detalle</button></td></tr>
                    </tbody>
                </table>
            </div>
        `;
    },

    getDistHome() {
        return `
            <div style="margin-bottom:32px;"><h1>Distribuidor Hub</h1><p>Gestión comercial y logística.</p></div>
            <div class="stat-grid">
                <div class="ab-card">
                    <span class="stat-label">Pedidos en Tránsito</span>
                    <span class="stat-val">15</span>
                </div>
                <div class="ab-card">
                    <span class="stat-label">Tickets VAL</span>
                    <span class="stat-val">4</span>
                </div>
            </div>
            <div class="ab-card shadow-premium" style="margin-top:24px;">
                <h4>ORDENES RECIENTES</h4>
                <div style="margin-top:16px;">
                    <div style="padding:12px; background:var(--bg-light); border-radius:var(--radius-sm); margin-bottom:8px; display:flex; justify-content:space-between;">
                        <span>VAL-82914 - Marvel CI</span><span class="ab-badge success">Enviado</span>
                    </div>
                </div>
            </div>
        `;
    },

    getPatientHome() {
        const completed = Object.values(this.careState).filter(val => val).length;
        const progress = (completed / 4) * 100;
        return `
            <div style="margin-bottom:32px;"><h1>Hola, ${this.currentUser.name}</h1></div>
            <div class="stat-grid">
                <div class="ab-card shadow-premium" style="display:flex; justify-content:space-between; align-items:center;">
                    <div><span class="stat-label">Racha de Cuidado</span><span class="stat-val">${this.streakDays}</span></div>
                    <div style="color:var(--gold);"><i data-lucide="zap" size="32"></i></div>
                </div>
                <div class="ab-card shadow-premium">
                    <span class="stat-label">Puntos Plus</span><span class="stat-val">${this.userPoints}</span>
                </div>
            </div>
            <div class="ab-card shadow-premium" style="margin-top:24px; text-align:center;">
                <h4 style="margin-bottom:16px;">Checklist de Hoy</h4>
                <div style="display:flex; justify-content:center; gap:16px;">
                    ${Object.keys(this.careState).map(k => `<div class="ab-card ${this.careState[k]?'success':''}" style="width:70px; height:70px; display:flex; align-items:center; justify-content:center; border-radius:50%;">${this.careState[k]?'<i data-lucide="check"></i>':k[0].toUpperCase()}</div>`).join('')}
                </div>
            </div>
        `;
    },

    getMaintHTML() { 
        return `<div class="ab-card"><h1>Configuración de Cuidados</h1><p>Próximamente: Integración con sensores Marvel.</p></div>`; 
    },
    getProfileHTML() { 
        return `<div class="ab-card"><h1>Mi Perfil</h1><p>${this.currentUser.name} [${this.currentUser.role}]</p><button class="ab-btn" style="color:var(--danger)" onclick="app.logout()">Cerrar Sistema</button></div>`; 
    },
    getToolsHTML() { 
        return `<div class="ab-card"><h1>UI Kit Preview</h1><p>Todos los componentes V18 activos.</p></div>`; 
    },

    initRoleFeatures() {
        if (window.lucide) lucide.createIcons();
    },

    sendMessageSidebar() {
        const input = document.getElementById('sidebar-ai-input');
        const text = input.value.trim();
        if (!text) return;
        this.addMessageToSidebar(text, 'user');
        this.chatHistory.push({ role: 'user', parts: [{ text }] });
        input.value = '';
        this.callGeminiTotal();
    },

    async callGeminiTotal() {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
        const payload = { 
            system_instruction: { parts: [{ text: `Clinical Enterprise Hub V18. Role: ${this.currentUser.role}.` }] },
            contents: this.chatHistory.slice(-10)
        };
        try {
            const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await resp.json();
            const text = data.candidates[0].content.parts[0].text;
            this.addMessageToSidebar(text, 'ai');
            this.chatHistory.push({ role: 'model', parts: [{ text }] });
        } catch (e) { this.toast("Modo offline", "error"); }
    },

    addMessageToSidebar(text, type) {
        const chat = document.getElementById('sidebar-chat-messages');
        const msg = document.createElement('div');
        msg.className = `message-wrapper ${type}`;
        msg.innerHTML = `<div class="message" style="padding:10px 14px; font-size:0.8rem; border-radius:10px; ${type === 'user' ? 'background:var(--primary); color:white; align-self:flex-end;' : 'background:var(--bg-light);'}"><span>${text}</span></div>`;
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
