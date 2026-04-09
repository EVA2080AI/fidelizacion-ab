const app = {
    apiKey: 'AIzaSyCNdm_eWA65yTRVnikOCMuG6-mwHRiwFAc',
    currentUser: JSON.parse(localStorage.getItem('ab_enterprise_user')) || null,
    chatHistory: JSON.parse(localStorage.getItem('ab_chat_history_v11')) || [],
    userPoints: 850,
    careState: { tmic: false, cable: false, dryer: false, battery: false },

    // --- V19 Reality Dataset (Mock Enterprise Volume) ---
    pendingApprovals: [
        { id: 101, name: 'Dra. Ana Costa', role: 'ESPECIALISTA', country: 'MEX', email: 'ana.costa@imss.mx' },
        { id: 102, name: 'MedLabs S.A.', role: 'DISTRIBUIDOR', country: 'ARG', email: 'ventas@medlabs.ar' },
        { id: 103, name: 'Dr. Luis Torres', role: 'ESPECIALISTA', country: 'COL', email: 'ltorres@clinica.co' },
        { id: 104, name: 'Equipos Médicos CR', role: 'DISTRIBUIDOR', country: 'CRI', email: 'cr@equipos.cr' },
        { id: 105, name: 'Dra. Elena Soler', role: 'ESPECIALISTA', country: 'MEX', email: 'esoler@hospital.mx' },
        { id: 106, name: 'Distribuidora Austral', role: 'DISTRIBUIDOR', country: 'ARG', email: 'info@austral.ar' },
        { id: 107, name: 'Dr. Roberto Diaz', role: 'ESPECIALISTA', country: 'COL', email: 'rdiaz@otomed.co' },
        { id: 108, name: 'Suministros Médicos', role: 'DISTRIBUIDOR', country: 'MEX', email: 'suministros@mex.mx' }
    ],

    patientDatabase: [
        { id: 'P-001', name: 'Mario Galvis', age: 45, implant: 'HiRes Ultra 3D', surgeon: 'Dr. J. Pérez', lastMap: '2026-03-15' },
        { id: 'P-002', name: 'Lucía Ortega', age: 12, implant: 'HiRes 90K Advantage', surgeon: 'Dra. E. Soler', lastMap: '2026-04-01' },
        { id: 'P-003', name: 'Ricardo Mendez', age: 62, implant: 'Marvel CI', surgeon: 'Dr. R. Diaz', lastMap: '2026-02-28' },
        { id: 'P-004', name: 'Valeria Sossa', age: 28, implant: 'Naída CI', surgeon: 'Dr. L. Torres', lastMap: '2026-04-05' },
        { id: 'P-005', name: 'Tomas Herrera', age: 5, implant: 'Chorus', surgeon: 'Dra. M. Ruiz', lastMap: '2026-03-30' }
    ],

    warrantyLogistics: [
        { id: 'VAL-8291', item: 'Marvel Processor', patient: 'M. Galvis', status: 'ENTREGADO', country: 'COL' },
        { id: 'VAL-0042', item: 'T-Mic 2 Filter', patient: 'L. Ortega', status: 'EVALUACION', country: 'MEX' },
        { id: 'VAL-4432', item: 'Cable Ultra', patient: 'R. Mendez', status: 'APROBADO', country: 'ARG' },
        { id: 'VAL-9910', item: 'Cargador Universal', patient: 'V. Sossa', status: 'PENDIENTE', country: 'COL' },
        { id: 'VAL-7721', item: 'Naída Cl 2', patient: 'T. Herrera', status: 'RECIBIDO', country: 'MEX' },
        { id: 'VAL-6651', item: 'Marvel Processor', patient: 'J. Doe', status: 'ENTREGADO', country: 'ARG' }
    ],

    init() {
        this.bindEvents();
        this.checkAuth();
        this.registerSW();
        console.log("AB Reality Hub V19 Online | Data Stress Test Active");
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
        this.toast(`Acceso Corporativo: ${name}`, "success");
    },

    logout() { localStorage.clear(); location.reload(); },

    setupHeader() {
        document.getElementById('header-user-name').innerText = this.currentUser.name;
        document.getElementById('current-country-badge').innerText = this.currentUser.country;
        document.getElementById('current-role-badge').innerText = this.currentUser.role;
        document.querySelector('.user-avatar').innerText = this.currentUser.name[0];
    },

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
        main.innerHTML = `<div class="ab-skeleton heading shimmer"></div><div class="stat-grid" style="margin-top:24px;"><div class="ab-card shimmer" style="height:120px;"></div><div class="ab-card shimmer" style="height:120px;"></div></div>`;
        
        setTimeout(() => {
            main.innerHTML = '';
            const section = document.createElement('div');
            section.className = 'view active';
            
            switch(viewId) {
                case 'home': section.innerHTML = this.getHomeHTML(); break;
                case 'profile': section.innerHTML = `<div class='ab-card'><h1>Perfil Oficial</h1><p>${this.currentUser.name}</p><button onclick='app.logout()' class='ab-btn' style='color:var(--danger)'>Cerrar Sesión</button></div>`; break;
                case 'tools': section.innerHTML = `<div class='ab-card'><h1>Intelligence Audit</h1><p>Sistema V19 operando con data de alta densidad.</p></div>`; break;
            }
            
            main.appendChild(section);
            if (window.lucide) lucide.createIcons();
        }, 300);
    },

    getHomeHTML() {
        const role = this.currentUser.role;
        const country = this.currentUser.country;

        if (role === 'ADMIN') {
            const filtered = this.pendingApprovals.filter(u => u.country === country);
            return `
                <div style="margin-bottom:32px;"><h1>Enterprise Insight: ${country}</h1><p>Control de acceso global.</p></div>
                <div class="stat-grid">
                    <div class="ab-card"><span class="stat-label">Pendientes de Validación</span><span class="stat-val">${filtered.length}</span></div>
                    <div class="ab-card"><span class="stat-label">Territorios Activos</span><span class="stat-val">4</span></div>
                </div>
                <div class="ab-table-container" style="margin-top:24px;">
                    <table class="ab-table">
                        <thead><tr><th>Profesional</th><th>Rol</th><th>Email</th><th>Acción</th></tr></thead>
                        <tbody>
                            ${filtered.map(u => `<tr><td><b>${u.name}</b></td><td>${u.role}</td><td>${u.email}</td><td><button class="ab-btn ab-btn-primary" onclick="app.approveUser(${u.id})">Validar</button></td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        if (role === 'ESPECIALISTA') {
            return `
                <div style="margin-bottom:32px;"><h1>Monitor Clínico Pro</h1><p>Gestión de pacientes Marvel CI.</p></div>
                <div class="stat-grid">
                    <div class="ab-card"><span class="stat-label">Total Pacientes</span><span class="stat-val">${this.patientDatabase.length}</span></div>
                    <div class="ab-card"><span class="stat-label">Mapeos del Mes</span><span class="stat-val">12</span></div>
                </div>
                <div class="ab-table-container" style="margin-top:24px;">
                    <table class="ab-table">
                        <thead><tr><th>Paciente</th><th>Implante</th><th>Mapeo</th><th>Detalle</th></tr></thead>
                        <tbody>
                            ${this.patientDatabase.map(p => `<tr><td><b>${p.name}</b></td><td>${p.implant}</td><td>${p.lastMap}</td><td><button class="ab-btn" style="border:1px solid var(--primary);" onclick="app.openPatientDetail('${p.id}')">Auditoría</button></td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        if (role === 'DISTRIBUIDOR') {
            const countryTickets = this.warrantyLogistics.filter(t => t.country === country);
            return `
                <div style="margin-bottom:32px;"><h1>Commercial Logistics</h1><p>Tracking de garantías VAL en tiempo real.</p></div>
                <div class="stat-grid">
                    <div class="ab-card"><span class="stat-label">En Evaluación</span><span class="stat-val">${countryTickets.filter(t => t.status === 'EVALUACION').length}</span></div>
                    <div class="ab-card"><span class="stat-label">Entregados</span><span class="stat-val">${countryTickets.filter(t => t.status === 'ENTREGADO').length}</span></div>
                </div>
                <div style="margin-top:24px; display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:16px;">
                    ${countryTickets.map(t => `
                        <div class="ab-card shadow-premium" style="border-left:4px solid ${t.status==='ENTREGADO'?'var(--success)':'var(--warning)'}">
                            <div style="display:flex; justify-content:space-between; align-items:start;">
                                <div><b>${t.id}</b><br><small>${t.item}</small></div>
                                <span class="ab-badge ${t.status==='ENTREGADO'?'success':'warning'}">${t.status}</span>
                            </div>
                            <p style="margin-top:12px; font-size:0.8rem; color:var(--slate-500);">Paciente: ${t.patient}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        return `<div class='ab-card'><h1>Paciente Hub</h1><p>Ver V15/V17 Walkthrough para Gamificación.</p></div>`;
    },

    openPatientDetail(id) {
        const p = this.patientDatabase.find(x => x.id === id);
        const html = `
            <div style="display:flex; flex-direction:column; gap:16px;">
                <div class="ab-card shadow-premium" style="background:var(--bg-light);">
                    <p><b>Implante:</b> ${p.implant}</p>
                    <p><b>Cirujano:</b> ${p.surgeon}</p>
                    <p><b>Último Mapeo:</b> ${p.lastMap}</p>
                </div>
                <h4>Historial de Impedancias (Logs Marvel)</h4>
                <div class="ab-skeleton shimmer" style="height:100px;"></div>
                <p style="font-size:0.85rem; color:var(--slate-500);">Data sincronizada vía Bluetooth Link...</p>
            </div>
        `;
        this.openModal(`Expediente: ${p.name}`, html);
    },

    approveUser(id) {
        this.pendingApprovals = this.pendingApprovals.filter(u => u.id !== id);
        this.toast("Profesional Validado y Sincronizado", "success");
        this.switchView('home');
    },

    startMaintEngine() { /* Simulated alerts... */ },

    sendMessageSidebar() {
        const input = document.getElementById('sidebar-ai-input');
        const text = input.value.trim();
        if (!text) return;
        this.addMessageToSidebar(text, 'user');
        this.chatHistory.push({ role: 'user', parts: [{ text }] });
        input.value = '';
        this.callGeminiReality();
    },

    async callGeminiReality() {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
        const payload = { 
            system_instruction: { parts: [{ text: `Clinical Data Analyst. Analyzing Hub V19 data volume. Role: ${this.currentUser.role}.` }] },
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
        msg.innerHTML = `<div class="message" style="padding:10px 14px; font-size:0.85rem; border-radius:10px; ${type === 'user' ? 'background:var(--primary); color:white; align-self:flex-end;' : 'background:var(--bg-light);'}"><span>${text}</span></div>`;
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
