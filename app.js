const app = {
    apiKey: 'AIzaSyCNdm_eWA65yTRVnikOCMuG6-mwHRiwFAc',
    currentUser: JSON.parse(localStorage.getItem('ab_enterprise_user')) || null,
    chatHistory: JSON.parse(localStorage.getItem('ab_chat_history_v11')) || [],
    
    pendingApprovals: [
        { id: 101, name: 'Dra. Elena Soler', role: 'ESPECIALISTA', country: 'MEX', email: 'elena@clinic.mx' },
        { id: 102, name: 'Equipos Médicos S.A.', role: 'DISTRIBUIDOR', country: 'ARG', email: 'ventas@emsa.ar' }
    ],
    warrantyTickets: [
        { id: 'VAL-8291', patient: 'C. Ramírez', status: 'EVALUACION', date: '2026-04-01' },
        { id: 'VAL-0042', patient: 'L. Moreno', status: 'APROBADO', date: '2026-03-28' }
    ],

    init() {
        this.bindEvents();
        this.checkAuth();
        this.registerSW();
        console.log("AB Intelligence Center V12 Online");
    },

    registerSW() { if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {}); },

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

    toast(text, type = "success") {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `ab-toast glass-effect ${type}`;
        toast.innerHTML = `<i data-lucide="${type==='success'?'check-circle':'alert-circle'}"></i> <span>${text}</span>`;
        if (container) container.appendChild(toast);
        lucide.createIcons();
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(-20px)'; setTimeout(() => toast.remove(), 500); }, 3000);
    },

    switchView(viewId) {
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-view') === viewId));
        this.renderRoleView(viewId);
    },

    renderRoleView(viewId) {
        const main = document.getElementById('main-content');
        main.innerHTML = '';
        const section = document.createElement('div');
        section.id = `view-${viewId}`;
        section.className = 'view active';
        
        switch(viewId) {
            case 'home': section.innerHTML = this.getHomeHTML(); setTimeout(() => this.renderCharts(), 50); break;
            case 'store': section.innerHTML = this.getStoreHTML(); break;
            case 'profile': section.innerHTML = this.getProfileHTML(); break;
            case 'tools': section.innerHTML = this.getToolsHTML(); break;
        }
        
        main.appendChild(section);
        if (window.lucide) lucide.createIcons();
    },

    getHomeHTML() {
        const role = this.currentUser.role;
        let content = `<div style="margin-bottom:32px;"><h1>Intelligence Dashboard</h1><p style="color:var(--slate-500);">Análisis avanzado de datos AB (${this.currentUser.country})</p></div>`;
        
        if (role === 'ADMIN') {
            content += `
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:24px; margin-bottom:32px;">
                    <div class="stat-card"><h2>${this.pendingApprovals.length}</h2><p>Solicitudes Pendientes</p></div>
                    <div class="ab-card shadow-premium" style="grid-column: span 2; min-height:300px;">
                        <h4>Tendencia de Registros Galobales</h4>
                        <canvas id="adminChart"></canvas>
                    </div>
                </div>
                <div class="ab-table-container">
                    <table class="ab-table">
                        <thead><tr><th>Usuario</th><th>Rol</th><th>País</th><th>Acción</th></tr></thead>
                        <tbody>
                            ${this.pendingApprovals.map(u => `<tr><td><b>${u.name}</b><br><small>${u.email}</small></td><td>${u.role}</td><td>${u.country}</td><td><button class="status-pill approved" onclick="app.approveUser(${u.id})">Aprobar</button></td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else if (role === 'DISTRIBUIDOR') {
            content += `
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:24px;">
                    <div class="ab-card shadow-premium" style="grid-column: span 2; min-height:300px;">
                        <h4>Rendimiento Comercial Mensual</h4>
                        <canvas id="distributorChart"></canvas>
                    </div>
                    <div class="stat-card"><h2>12</h2><p>Tickets de Garantía</p></div>
                </div>
                <h3 style="margin: 32px 0 16px;">Tracking Visual</h3>
                ${this.warrantyTickets.map(t => `<div class="ab-card shadow-premium" style="margin-bottom:20px;"><b>Ticket ${t.id}</b><span class="status-pill active" style="float:right;">${t.status}</span></div>`).join('')}
            `;
        } else if (role === 'ESPECIALISTA') {
            content += `
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap:24px;">
                    <div class="ab-card shadow-premium" style="min-height:350px;">
                        <h4>Salud de Electrodos (Promedio)</h4>
                        <canvas id="specChart"></canvas>
                    </div>
                    <div class="ab-card shadow-premium" style="min-height:350px;">
                        <h4>Historial Clínico del Mes</h4>
                        <div class="ab-table-container" style="border:none; margin-top:0;">
                            <table class="ab-table">
                                <thead><tr><th>Paciente</th><th>Evento</th></tr></thead>
                                <tbody>
                                    <tr><td><b>L. Ortega</b></td><td>Revisión Anual</td></tr>
                                    <tr><td><b>P. Castillo</b></td><td>Mapeo</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        } else {
            content += `
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
                    <div class="ab-card shadow-premium"><h4>Mis Puntos Plus</h4><h2>850</h2><canvas id="patientChart"></canvas></div>
                    <div class="stat-card"><h2>92%</h2><p>Calidad de Cuidado</p></div>
                </div>
            `;
        }
        return content;
    },

    renderCharts() {
        const role = this.currentUser.role;
        const ctxStyle = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

        if (role === 'ADMIN') {
            new Chart(document.getElementById('adminChart'), {
                type: 'line',
                data: { labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May'], datasets: [{ label: 'Registros', data: [120, 250, 480, 842, 1020], borderColor: '#0066b2', tension: 0.4 }] },
                options: ctxStyle
            });
        } else if (role === 'DISTRIBUIDOR') {
            new Chart(document.getElementById('distributorChart'), {
                type: 'bar',
                data: { labels: ['Q1', 'Q2', 'Q3', 'Q4'], datasets: [{ label: 'Ventas', data: [45, 82, 63, 110], backgroundColor: '#0066b2', borderRadius: 10 }] },
                options: ctxStyle
            });
        } else if (role === 'ESPECIALISTA') {
            new Chart(document.getElementById('specChart'), {
                type: 'radar',
                data: { labels: ['Bajos', 'Medios', 'Altos', 'Rango 1', 'Rango 2'], datasets: [{ label: 'Impedancia', data: [65, 59, 90, 81, 56], fill: true, backgroundColor: 'rgba(0, 102, 178, 0.2)', borderColor: '#0066b2' }] },
                options: { ...ctxStyle, plugins: { legend: { display: true } } }
            });
        }
    },

    approveUser(id) {
        this.pendingApprovals = this.pendingApprovals.filter(u => u.id !== id);
        this.toast("Especialista Validado Correctamente", "success");
        this.switchView('home');
    },

    sendMessageSidebar() {
        const input = document.getElementById('sidebar-ai-input');
        const text = input.value.trim();
        if (!text) return;
        this.addMessageToSidebar(text, 'user');
        this.chatHistory.push({ role: 'user', parts: [{ text }] });
        input.value = '';
        this.callGeminiIntelligence();
    },

    async callGeminiIntelligence() {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
        const payload = { 
            system_instruction: { parts: [{ text: `Melody Intelligence V12. Role: ${this.currentUser.role}, Country: ${this.currentUser.country}. Act as a clinical data analyst. Help verify warranties, clinical logs, and commercial targets.` }] },
            contents: this.chatHistory.slice(-10)
        };
        try {
            const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await resp.json();
            const text = data.candidates[0].content.parts[0].text;
            this.addMessageToSidebar(text, 'ai');
            this.chatHistory.push({ role: 'model', parts: [{ text }] });
            localStorage.setItem('ab_chat_history_v11', JSON.stringify(this.chatHistory.slice(-20)));
        } catch (e) { this.toast("Error de Análisis", "error"); }
    },

    addMessageToSidebar(text, type) {
        const chat = document.getElementById('sidebar-chat-messages');
        const msg = document.createElement('div');
        msg.className = `message-wrapper ${type}`;
        msg.innerHTML = `<div class="message ab-card" style="padding:10px 14px; font-size:0.85rem; border:none; ${type === 'user' ? 'background:var(--primary); color:white; align-self:flex-end;' : 'background:var(--slate-200);'}"><span>${text}</span></div>`;
        chat.appendChild(msg);
        chat.scrollTop = chat.scrollHeight;
    },

    renderHistorySidebar() {
        const chat = document.getElementById('sidebar-chat-messages');
        chat.innerHTML = '';
        this.chatHistory.forEach(msg => this.addMessageToSidebar(msg.parts[0].text, msg.role === 'user' ? 'user' : 'ai'));
    },

    getProfileHTML() { return `<div class="ab-card"><h3>${this.currentUser.name}</h3><p>${this.currentUser.role}</p><button class="ab-btn" style="color:var(--danger);" onclick="app.logout()">Log out</button></div>`; },
    getToolsHTML() { return `<div class="ab-card"><h3>Clinical Tools V12</h3><p>Acceso a logs de hardware y diagnóstico.</p></div>`; },
    getStoreHTML() { return `<div class="ab-card"><h3>Marketplace V12</h3><p>Cotizaciones y gestión de órdenes.</p></div>`; }
};
document.addEventListener('DOMContentLoaded', () => app.init());
window.app = app;
