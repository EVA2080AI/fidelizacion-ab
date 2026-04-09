const app = {
    apiKey: 'AIzaSyCNdm_eWA65yTRVnikOCMuG6-mwHRiwFAc',
    currentUser: JSON.parse(localStorage.getItem('ab_enterprise_user')) || null,
    chatHistory: JSON.parse(localStorage.getItem('ab_chat_history_v11')) || [],
    userPoints: parseInt(localStorage.getItem('ab_user_points')) || 850,
    careState: JSON.parse(localStorage.getItem('ab_care_state')) || { tmic: false, cable: false, dryer: false, battery: false },
    streakDays: parseInt(localStorage.getItem('ab_streak')) || 5,

    init() {
        this.bindEvents();
        this.checkAuth();
        this.registerSW();
        console.log("AB Interactive Care Hub V15 Online");
        this.startMaintEngine();
    },

    registerSW() { if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js'); },

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.getAttribute('data-view');
                if (view === 'chat') { /* Persistent sidebar handled by CSS/Layout */ }
                else if (view) this.switchView(view);
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
        this.toast(`Acceso oficial AB: ${name}`, "success");
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

    showInteractiveNotif(msg, type = "info") {
        const bubble = document.createElement('div');
        bubble.className = "ab-notif shadow-premium animate-pop";
        bubble.innerHTML = `<i data-lucide="bell"></i> <div><b>Recordatorio AB</b><p style='font-size:0.8rem; margin:0;'>${msg}</p></div>`;
        document.body.appendChild(bubble);
        lucide.createIcons();
        setTimeout(() => { bubble.style.opacity = '0'; setTimeout(() => bubble.remove(), 500); }, 5000);
    },

    startMaintEngine() {
        setInterval(() => {
            const now = new Date();
            if (now.getSeconds() === 0 && Math.random() > 0.8 && this.currentUser?.role === 'CLIENTE') {
                this.showInteractiveNotif("Es hora de revisar tu deshumidificador nocturno.", "warning");
            }
        }, 10000);
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
            case 'home': section.innerHTML = this.getHomeHTML(); break;
            case 'store': section.innerHTML = `<div class='ab-card'><h1>Tienda Oficial</h1><p>Equipos autorizados por Advance Bionics ${this.currentUser.country}.</p></div>`; break;
            case 'tools': section.innerHTML = `<div class='ab-card'><h1>Herramientas Técnicas</h1><p>Terminal de diagnóstico para ${this.currentUser.role}.</p></div>`; break;
            case 'profile': section.innerHTML = `<div class='ab-card'><h1>Perfil</h1><button class='ab-btn' style='color:var(--danger)' onclick='app.logout()'>Cerrar Sesión</button></div>`; break;
        }
        
        main.appendChild(section);
        if (window.lucide) lucide.createIcons();
    },

    getHomeHTML() {
        const role = this.currentUser.role;
        if (role === 'CLIENTE') {
            const completed = Object.values(this.careState).filter(val => val).length;
            const progress = (completed / 4) * 100;
            const offset = 283 - (283 * progress) / 100;

            return `
                <div style="margin-bottom:32px;"><h1>Buen día, ${this.currentUser.name}</h1><p style="color:var(--slate-500);">Tu salud auditiva es nuestra prioridad.</p></div>
                
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:24px;">
                    <!-- Progress Card (Temu Style) -->
                    <div class="ab-card shadow-premium animate-pop" style="display:flex; align-items:center; justify-content:space-between;">
                        <div>
                            <span class="text-caps" style="color:var(--primary);">CUIDADO DIARIO</span>
                            <h2 style="margin:8px 0;">${progress}%</h2>
                            <p style="font-size:0.8rem; color:var(--slate-500);">${4 - completed} tareas pendientes.</p>
                        </div>
                        <div class="progress-ring-container">
                            <svg class="progress-ring" width="80" height="80">
                                <circle class="progress-ring-bg" stroke-width="8" fill="transparent" r="36" cx="40" cy="40"/>
                                <circle class="progress-ring-circle" stroke-width="8" fill="transparent" r="36" cx="40" cy="40" 
                                        style="stroke-dasharray: 283; stroke-dashoffset: ${offset}; --offset: ${offset};"/>
                            </svg>
                        </div>
                    </div>

                    <!-- Streak Card -->
                    <div class="streak-card shadow-premium" style="grid-column: span 1;">
                        <span class="text-caps" style="opacity:0.8;">RECHA ACTUAL</span>
                        <h3>${this.streakDays} Días Sin Parar</h3>
                        <div class="streak-days">
                            ${[...Array(7)].map((_, i) => `<div class="day-dot ${i < this.streakDays ? 'active' : ''}">${i + 1}</div>`).join('')}
                        </div>
                        <div style="margin-top:20px; font-size:0.75rem; font-weight:700;">+50 Puntos al llegar a 7 días.</div>
                    </div>

                    <!-- Maintenance Tasks -->
                    <div class="ab-card shadow-premium" style="grid-column: span 2;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                            <span class="text-caps">CHECKLIST TÉCNICO</span>
                            <span class="ab-badge success">VIGENTE</span>
                        </div>
                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:16px;">
                            ${Object.keys(this.careState).map(key => `
                                <div class="ab-card ${this.careState[key] ? 'success' : 'glass-effect'}" 
                                     style="text-align:center; padding:16px; position:relative; cursor:pointer;"
                                     onclick="app.completeTask('${key}')">
                                    ${this.careState[key] ? '<i data-lucide="check-circle" style="color:white;"></i>' : `<i data-lucide="circle"></i>`}
                                    <p style="margin-top:8px; font-weight:800; font-size:0.85rem;">${key.toUpperCase()}</p>
                                    ${!this.careState[key] ? '<span class="maint-bubble">¡TOCA!</span>' : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `<div class='ab-card'><h1>Bienvenido al Panel de ${role}</h1><p>Sistema oficial Advance Bionics.</p></div>`;
        }
    },

    completeTask(id) {
        if (this.careState[id]) return;
        this.careState[id] = true;
        localStorage.setItem('ab_care_state', JSON.stringify(this.careState));
        this.userPoints += 25;
        this.renderRoleView('home');
        this.toast(`¡Tarea completada! +25 Puntos`, "success");
        this.showInteractiveNotif("Has ganado 25 puntos de fidelidad. ¡Vas por buen camino!", "success");
    },

    sendMessageSidebar() {
        const input = document.getElementById('sidebar-ai-input');
        const text = input.value.trim();
        if (!text) return;
        this.addMessageToSidebar(text, 'user');
        this.chatHistory.push({ role: 'user', parts: [{ text }] });
        input.value = '';
        this.callGeminiOfficial();
    },

    async callGeminiOfficial() {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
        const payload = { 
            system_instruction: { parts: [{ text: `Official Advance Bionics Assistant. Clinical Brand: Teal #00A3DA. Role: ${this.currentUser.role}. Tone: Professional, authoritative, supportive. Focused on Maintenance and Clinical Outcomes.` }] },
            contents: this.chatHistory.slice(-10)
        };
        try {
            const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await resp.json();
            const text = data.candidates[0].content.parts[0].text;
            this.addMessageToSidebar(text, 'ai');
            this.chatHistory.push({ role: 'model', parts: [{ text }] });
        } catch (e) { this.toast("Error de Conexión AB", "error"); }
    },

    addMessageToSidebar(text, type) {
        const chat = document.getElementById('sidebar-chat-messages');
        const msg = document.createElement('div');
        msg.className = `message-wrapper ${type}`;
        msg.innerHTML = `<div class="message" style="padding:12px 16px; font-size:0.85rem; border-radius:var(--radius-md); ${type === 'user' ? 'background:var(--primary); color:white; align-self:flex-end;' : 'background:var(--bg-light);'}"><span>${text}</span></div>`;
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
