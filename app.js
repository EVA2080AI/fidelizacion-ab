const app = {
    apiKey: 'AIzaSyCNdm_eWA65yTRVnikOCMuG6-mwHRiwFAc',
    currentUser: JSON.parse(localStorage.getItem('ab_enterprise_user')) || null,
    chatHistory: JSON.parse(localStorage.getItem('ab_chat_history_v11')) || [],
    userPoints: parseInt(localStorage.getItem('ab_user_points')) || 850,
    careState: JSON.parse(localStorage.getItem('ab_care_state')) || { tmic: false, cable: false, dryer: false, battery: false },
    streakDays: parseInt(localStorage.getItem('ab_streak')) || 5,
    userSettings: JSON.parse(localStorage.getItem('ab_user_settings')) || { 
        notif_tmic: true, notif_dryer: true, notif_battery: true, notif_cable: false, 
        night_mode: false, reminder_time: "21:00" 
    },

    init() {
        this.bindEvents();
        this.checkAuth();
        this.registerSW();
        console.log("AB Maintenance Hub V17 Online");
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
        const nameInput = document.getElementById('login-name');
        const name = nameInput.value.trim();
        const role = document.getElementById('login-role').value;
        const country = document.getElementById('login-country').value;
        if (!name) { nameInput.classList.add('error'); this.toast("Nombre requerido", "error"); return; }
        this.currentUser = { name, role, country, id: 'USR-' + Math.floor(Math.random()*1000) };
        localStorage.setItem('ab_enterprise_user', JSON.stringify(this.currentUser));
        this.checkAuth();
        this.toast(`Bienvenido, ${name}`, "success");
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
        toast.className = `ab-toast ${type}`;
        const icons = { success: 'check-circle', error: 'alert-circle', warning: 'bell' };
        toast.innerHTML = `<i data-lucide="${icons[type]}"></i> <div><b>${type.toUpperCase()}</b><p style="margin:0; font-size:0.8rem;">${text}</p></div>`;
        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 4000);
    },

    startMaintEngine() {
        setInterval(() => {
            if (this.currentUser?.role !== 'CLIENTE') return;
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            // Check for scheduled alert
            if (timeStr === this.userSettings.reminder_time && now.getSeconds() === 0) {
                this.toast("¡Cuidado Diario programado! Revisa tu checklist.", "warning");
            }
            
            // Random didactic alerts (if enabled)
            if (this.userSettings.notif_tmic && Math.random() > 0.99) {
                this.showPushNotif("Sugerencia AB", "Considera limpiar tu T-Mic hoy para mantener la claridad.");
            }
        }, 10000);
    },

    showPushNotif(title, msg) {
        const push = document.createElement('div');
        push.className = "ab-push-notif shadow-premium";
        push.style.position = "fixed"; push.style.top = "24px"; push.style.right = "24px"; push.style.zIndex="11000";
        push.innerHTML = `<div class="push-icon"><i data-lucide="bell"></i></div><div><b>${title}</b><p style="margin:0; font-size:0.75rem;">${msg}</p></div>`;
        document.body.appendChild(push);
        if (window.lucide) lucide.createIcons();
        setTimeout(() => { push.style.opacity = '0'; setTimeout(() => push.remove(), 500); }, 5000);
    },

    switchView(viewId) {
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-view') === viewId));
        this.renderRoleView(viewId);
    },

    renderRoleView(viewId) {
        const main = document.getElementById('main-content');
        main.innerHTML = `<div class="ab-skeleton heading shimmer"></div><div class="ab-card shimmer" style="height:200px; margin-top:20px;"></div>`;
        
        setTimeout(() => {
            main.innerHTML = '';
            const section = document.createElement('div');
            section.id = `view-${viewId}`;
            section.className = 'view active';
            
            switch(viewId) {
                case 'home': section.innerHTML = this.getHomeHTML(); break;
                case 'maintenance': section.innerHTML = this.getMaintConfigHTML(); break;
                case 'tools': section.innerHTML = `<div class='ab-card'><h1>UI Kit Gallery</h1><p>Ver V16 Walkthrough.</p></div>`; break;
                case 'profile': section.innerHTML = `<div class='ab-card'><h1>Perfil</h1><button onclick='app.logout()' class='ab-btn' style='color:var(--danger)'>Log out</button></div>`; break;
            }
            
            main.appendChild(section);
            if (window.lucide) lucide.createIcons();
            if (viewId === 'home') this.updateHomeAnims();
        }, 300);
    },

    getMaintConfigHTML() {
        return `
            <div style="margin-bottom:32px;"><h1>Centro de Cuidados</h1><p>Configura tus recordatorios de mantenimiento oficial.</p></div>
            
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:24px;">
                <div class="ab-card shadow-premium">
                    <h4 style="margin-bottom:24px;">GESTIÓN DE ALERTAS</h4>
                    ${Object.keys(this.userSettings).filter(k => k.startsWith('notif_')).map(key => `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                            <span style="font-weight:700; font-size:0.9rem;">${key.split('_')[1].toUpperCase()}</span>
                            <label class="ab-switch">
                                <input type="checkbox" ${this.userSettings[key] ? 'checked' : ''} style="display:none;" 
                                       onchange="app.updateSetting('${key}', this.checked)">
                                <div class="switch-track"><div class="switch-knob"></div></div>
                            </label>
                        </div>
                    `).join('')}
                </div>

                <div class="ab-card shadow-premium">
                    <h4 style="margin-bottom:24px;">PROGRAMACIÓN</h4>
                    <div class="ab-field">
                        <label>HORA DE RECORDATORIO DIARIO</label>
                        <input type="time" class="ab-input" value="${this.userSettings.reminder_time}" 
                               onchange="app.updateSetting('reminder_time', this.value)">
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:24px;">
                        <span style="font-weight:700; font-size:0.9rem;">REINICIO AUTOMÁTICO</span>
                        <label class="ab-switch">
                            <input type="checkbox" checked style="display:none;">
                            <div class="switch-track"><div class="switch-knob"></div></div>
                        </label>
                    </div>
                </div>
            </div>
        `;
    },

    updateSetting(key, value) {
        this.userSettings[key] = value;
        localStorage.setItem('ab_user_settings', JSON.stringify(this.userSettings));
        this.toast("Ajustes de cuidado actualizados", "success");
    },

    getHomeHTML() {
        const completed = Object.values(this.careState).filter(val => val).length;
        const progress = (completed / 4) * 100;
        return `
            <div style="margin-bottom:32px;"><h1>Hola, ${this.currentUser.name}</h1></div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap:24px;">
                <div class="ab-card shadow-premium animate-pop" style="display:flex; align-items:center; justify-content:space-between;">
                    <div><span class="text-caps">OBJETIVO DIARIO</span><h2 id="home-progress-text">${progress}%</h2></div>
                    <div class="progress-ring-container">
                        <svg class="progress-ring" width="80" height="80">
                            <circle class="progress-ring-bg" stroke-width="8" fill="transparent" r="36" cx="40" cy="40"/>
                            <circle class="progress-ring-circle" id="home-progress-circle" stroke-width="8" fill="transparent" r="36" cx="40" cy="40" style="stroke-dasharray: 283; stroke-dashoffset: 283;"/>
                        </svg>
                    </div>
                </div>
                <div class="streak-card shadow-premium">
                    <span class="text-caps">RACHA</span><h2>${this.streakDays} Días</h2>
                    <div class="streak-days">${[...Array(7)].map((_, i) => `<div class="day-dot ${i < this.streakDays ? 'active' : ''}">${i + 1}</div>`).join('')}</div>
                </div>
            </div>
        `;
    },

    updateHomeAnims() {
        const completed = Object.values(this.careState).filter(val => val).length;
        const progress = (completed / 4) * 100;
        const offset = 283 - (283 * progress) / 100;
        const circle = document.getElementById('home-progress-circle');
        if (circle) circle.style.strokeDashoffset = offset;
    },

    sendMessageSidebar() {
        const input = document.getElementById('sidebar-ai-input');
        const text = input.value.trim();
        if (!text) return;
        this.addMessageToSidebar(text, 'user');
        this.chatHistory.push({ role: 'user', parts: [{ text }] });
        input.value = '';
        this.callGeminiMaint();
    },

    async callGeminiMaint() {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
        const payload = { 
            system_instruction: { parts: [{ text: `Clinical Maintenance Specialist for AB. Assist user ${this.currentUser.name} with device care. Refer to V17 personalized alerts.` }] },
            contents: this.chatHistory.slice(-10)
        };
        try {
            const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await resp.json();
            const text = data.candidates[0].content.parts[0].text;
            this.addMessageToSidebar(text, 'ai');
            this.chatHistory.push({ role: 'model', parts: [{ text }] });
        } catch (e) { this.toast("Error Melody", "error"); }
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
