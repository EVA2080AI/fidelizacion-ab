const app = {
    apiKey: 'AIzaSyCNdm_eWA65yTRVnikOCMuG6-mwHRiwFAc',
    currentUser: JSON.parse(localStorage.getItem('ab_enterprise_user')) || null,
    chatHistory: JSON.parse(localStorage.getItem('ab_chat_history_v11')) || [],
    
    // Global Storage Sim (In reality this comes from Backend)
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
        console.log("AB Enterprise Command Center V11 Online");
    },

    registerSW() {
        if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
    },

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.getAttribute('data-view');
                if (view === 'chat' && window.innerWidth < 768) { this.toggleMobileChat(); }
                else if (view) this.switchView(view);
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
        if (!name) { this.toast("Nombre requerido", "error"); return; }
        
        this.currentUser = { name, role, country, id: 'USR-' + Math.floor(Math.random()*1000) };
        localStorage.setItem('ab_enterprise_user', JSON.stringify(this.currentUser));
        this.checkAuth();
        this.toast(`Bienvenido ${name} (${role})`, "success");
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
        
        // Dynamic Content Selection per Role
        if (viewId === 'home') section.innerHTML = this.getHomeHTML();
        else if (viewId === 'store') section.innerHTML = this.getStoreHTML();
        else if (viewId === 'profile') section.innerHTML = this.getProfileHTML();
        else if (viewId === 'tools') section.innerHTML = this.getToolsHTML();
        
        main.appendChild(section);
        if (window.lucide) lucide.createIcons();
    },

    getHomeHTML() {
        const role = this.currentUser.role;
        let content = `<div style="margin-bottom:32px;"><h1>Panel de Gestión</h1><p style="color:var(--slate-500);">Alcance de usuario: ${this.currentUser.country}</p></div>`;
        
        if (role === 'ADMIN') {
            content += `
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:24px;">
                    <div class="stat-card"><h2>${this.pendingApprovals.length}</h2><p>Solicitudes Pendientes</p></div>
                    <div class="stat-card"><h2>842</h2><p>Pacientes Globales</p></div>
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
                    <div class="stat-card"><h2>12</h2><p>Garantías en Curso</p></div>
                    <button class="ab-btn ab-btn-primary" onclick="app.toast('Formulario de Garantía Abierto')">+ Nueva Garantía</button>
                </div>
                <h3 style="margin: 32px 0 16px;">Tracking de Solicitudes</h3>
                ${this.warrantyTickets.map(t => `
                    <div class="ab-card shadow-premium" style="margin-bottom:20px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;"><b>Ticket ${t.id}</b> <span class="status-pill active">${t.status}</span></div>
                        <div class="ab-tracker">
                            <div class="tracker-step completed"><div class="step-dot"></div><span class="step-label">RECIBIDO</span></div>
                            <div class="tracker-step ${t.status==='EVALUACION'?'active':''} completed"><div class="step-dot"></div><span class="step-label">EVALUACION</span></div>
                            <div class="tracker-step"><div class="step-dot"></div><span class="step-label">APROBADO</span></div>
                            <div class="tracker-step"><div class="step-dot"></div><span class="step-label">ENVIADO</span></div>
                        </div>
                    </div>
                `).join('')}
            `;
        } else if (role === 'ESPECIALISTA') {
            content += `
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
                    <div class="ab-card"><h4>Pacientes Asignados</h4><h2>48</h2></div>
                    <div class="ab-card"><h4>Revisiones Pendientes</h4><h2>5</h2></div>
                </div>
                <div class="ab-table-container">
                    <table class="ab-table">
                        <thead><tr><th>Paciente</th><th>Implante</th><th>Mapeo</th><th>Clínica</th></tr></thead>
                        <tbody>
                            <tr><td><b>Luisa Ortega</b></td><td>Marvel CI</td><td>Mar 2026</td><td>Sede Norte</td></tr>
                            <tr><td><b>Pedro Castillo</b></td><td>Sky CI</td><td>Ene 2026</td><td>Sede Clínica Central</td></tr>
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            content += `<div class="ab-card"><h4>Mis Puntos Plus</h4><h2>${localStorage.getItem('ab_user_points') || 0}</h2><p>Nivel ${this.currentUser.role}</p></div>`;
        }
        return content;
    },

    approveUser(id) {
        this.pendingApprovals = this.pendingApprovals.filter(u => u.id !== id);
        this.toast("Usuario aprobado exitosamente", "success");
        this.switchView('home');
    },

    sendMessageSidebar() {
        const input = document.getElementById('sidebar-ai-input');
        const text = input.value.trim();
        if (!text) return;
        this.addMessageToSidebar(text, 'user');
        this.chatHistory.push({ role: 'user', parts: [{ text }] });
        input.value = '';
        this.callGeminiSidebar();
    },

    async callGeminiSidebar() {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
        const payload = { 
            system_instruction: { parts: [{ text: `Expert Clinical Assistant Melody. Context: Role ${this.currentUser.role}, Country ${this.currentUser.country}. Provide professional technical answers.` }] },
            contents: this.chatHistory.slice(-10)
        };
        try {
            const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await resp.json();
            const text = data.candidates[0].content.parts[0].text;
            this.addMessageToSidebar(text, 'ai');
            this.chatHistory.push({ role: 'model', parts: [{ text }] });
            localStorage.setItem('ab_chat_history_v11', JSON.stringify(this.chatHistory.slice(-20)));
        } catch (e) { this.toast("Error de conexión con Melody", "error"); }
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

    getProfileHTML() {
        return `<div class="ab-card"><h3>${this.currentUser.name}</h3><p>${this.currentUser.role} | ${this.currentUser.country}</p><button class="ab-btn" style="margin-top:24px; color:var(--danger);" onclick="app.logout()">Cerrar Sesión</button></div>`;
    },

    getToolsHTML() { return `<div class="ab-card"><h3>Herramientas de ${this.currentUser.role}</h3><p>Acceso a módulos especializados de ${this.currentUser.country}.</p></div>`; },
    getStoreHTML() { return `<div class="ab-card"><h3>Tienda Regional</h3><p>Cotizaciones y Marketplace para ${this.currentUser.country}.</p></div>`; }
};

document.addEventListener('DOMContentLoaded', () => app.init());
window.app = app;
