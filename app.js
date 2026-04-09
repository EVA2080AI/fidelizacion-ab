const app = {
    apiKey: 'AIzaSyCNdm_eWA65yTRVnikOCMuG6-mwHRiwFAc',
    currentView: 'assistant',
    userName: localStorage.getItem('ab_user_name') || '',
    deviceModel: localStorage.getItem('ab_user_device') || 'Naída CI M90',
    userPoints: parseInt(localStorage.getItem('ab_user_points')) || 0,
    userTier: localStorage.getItem('ab_user_tier') || 'BRONCE',
    
    chatHistory: JSON.parse(localStorage.getItem('ab_chat_history')) || [],
    careState: JSON.parse(localStorage.getItem('ab_care_state')) || { tmic: false, cable: false, dryer: false, battery: false },

    init() {
        this.bindEvents();
        this.checkAuth();
        this.updateLoyaltyUI();
        console.log("AB Care Hub V6 Visual Excellence Initialized");
    },

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = item.getAttribute('data-view');
                if (view) this.switchView(view);
            });
        });
    },

    checkAuth() {
        const loginScreen = document.getElementById('login-screen');
        if (!this.userName) {
            loginScreen.classList.add('active');
        } else {
            loginScreen.classList.remove('active');
            setTimeout(() => this.checkOnboarding(), 500);
        }
    },

    login() {
        const nameInput = document.getElementById('login-name');
        const deviceInput = document.getElementById('login-device');
        
        if (!nameInput.value.trim()) {
            this.toast("Nombre requerido para sincronizar", "error");
            return;
        }

        this.userName = nameInput.value.trim();
        this.deviceModel = deviceInput.value;
        
        localStorage.setItem('ab_user_name', this.userName);
        localStorage.setItem('ab_user_device', this.deviceModel);
        
        document.getElementById('login-screen').classList.remove('active');
        
        setTimeout(() => {
            this.startBridge();
            this.checkOnboarding();
            this.updateLoyaltyUI();
            this.switchView('assistant');
        }, 500);
    },

    logout() {
        localStorage.clear();
        location.reload();
    },

    checkOnboarding() {
        const completed = localStorage.getItem('ab_onboarding_completed');
        if (!completed) {
            document.getElementById('onboarding-overlay').classList.add('active');
        }
    },

    finishOnboarding() {
        document.getElementById('onboarding-overlay').classList.remove('active');
        localStorage.setItem('ab_onboarding_completed', 'true');
        this.toast("¡Bienvenido al Nivel Bronce!", "success");
    },

    startBridge() {
        const splash = document.getElementById('bridge-splash');
        splash.classList.add('active');
        setTimeout(() => {
            splash.classList.remove('active');
            if (this.chatHistory.length === 0) this.sendGreeting();
        }, 2000);
    },

    sendGreeting() {
        const greeting = `Hola ${this.userName}, Centro de Mando Plus activado. Soy Melody, tu especialista digital para tu ${this.deviceModel}. ¿Cómo va tu audición hoy?`;
        this.addMessageToUI(greeting, 'ai');
        this.chatHistory.push({ role: 'model', parts: [{ text: greeting }] });
        this.saveHistory();
    },

    toast(text, type = "success") {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast glass-card ${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 'alert-circle';
        toast.innerHTML = `<i data-lucide="${icon}"></i> <span>${text}</span>`;
        
        container.appendChild(toast);
        lucide.createIcons();
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => toast.remove(), 500);
        }, 3500);
    },

    updateLoyaltyUI() {
        if (this.userPoints >= 1000) this.userTier = 'PLATINO';
        else if (this.userPoints >= 500) this.userTier = 'ORO';
        else this.userTier = 'BRONCE';
        
        localStorage.setItem('ab_user_tier', this.userTier);

        const sidebarPoints = document.getElementById('sidebar-points');
        const sidebarTier = document.getElementById('sidebar-tier');
        const progressFill = document.getElementById('loyalty-progress-fill');
        
        if (sidebarPoints) sidebarPoints.innerText = this.userPoints;
        if (sidebarTier) sidebarTier.innerText = this.userTier;
        
        let progress = (this.userPoints / 1000) * 100;
        if (progress > 100) progress = 100;
        if (progressFill) progressFill.style.width = `${progress}%`;

        const mobileTier = document.getElementById('mobile-tier');
        if (mobileTier) mobileTier.innerText = this.userTier;
    },

    addPoints(pts) {
        this.userPoints += pts;
        localStorage.setItem('ab_user_points', this.userPoints);
        this.updateLoyaltyUI();
        this.toast(`+${pts} Puntos de Cuidado`, "success");
    },

    toggleCareTask(taskId) {
        this.careState[taskId] = !this.careState[taskId];
        localStorage.setItem('ab_care_state', JSON.stringify(this.careState));
        
        const total = 4;
        const done = Object.values(this.careState).filter(v => v).length;
        
        if (done === total) {
            this.addPoints(50);
            this.congratulateUser();
        }
        
        this.switchView('care');
    },

    congratulateUser() {
        const msg = `¡Excelente labor técnica, ${this.userName}! El mantenimiento de hoy está completo.`;
        this.addMessageToUI(msg, 'ai');
        this.chatHistory.push({ role: 'model', parts: [{ text: msg }] });
        this.saveHistory();
    },

    switchView(viewId) {
        // Find existing view if any and fade it out
        const activeView = document.querySelector('.view.active');
        if (activeView) {
            activeView.classList.remove('active');
        }

        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
        });

        const main = document.getElementById('main-content');
        // Clear except header
        const header = main.querySelector('.mobile-header');
        main.innerHTML = '';
        if (header) main.appendChild(header);

        // Render new view
        this.renderView(viewId);
        this.currentView = viewId;
        
        // Trigger entrance animation next frame
        setTimeout(() => {
            const newView = document.getElementById(`view-${viewId}`);
            if (newView) newView.classList.add('active');
        }, 50);
    },

    renderView(viewId) {
        const main = document.getElementById('main-content');
        const viewSection = document.createElement('section');
        viewSection.id = `view-${viewId}`;
        viewSection.className = 'view';

        let content = '';
        switch(viewId) {
            case 'home': content = this.getHomeHTML(); break;
            case 'benefits': content = this.getBenefitsHTML(); break;
            case 'care': content = this.getCareHTML(); break;
            case 'assistant': content = this.getAssistantHTML(); setTimeout(() => this.renderHistory(), 10); break;
            case 'profile': content = this.getProfileHTML(); break;
        }

        viewSection.innerHTML = content;
        main.appendChild(viewSection);
        if (window.lucide) lucide.createIcons();
    },

    getAssistantHTML() {
        const careP = Object.values(this.careState).filter(v => v).length * 25;
        return `
            <div class="header-section"><h1>Melody Plus</h1><p>Inteligencia técnica avanzada para tu ${this.deviceModel}.</p></div>
            <div class="assistant-layout">
                <div class="assistant-sidebar desktop-only">
                    <div class="sidebar-card glass-card">
                        <div class="badge-row"><span class="status-dot"></span><small style="font-weight:900; color:var(--success);">PROTEGIDO</small></div>
                        <h3 style="font-weight:900;">${this.userName}</h3>
                        <p style="color:var(--slate-500); font-size:0.85rem;">Hardware: ${this.deviceModel}</p>
                    </div>
                </div>
                <div class="chat-container glass-card">
                    <div id="chat-messages"></div>
                    <div class="chat-input-area">
                        <input type="text" id="ai-input" placeholder="Consultar soporte o beneficios..." onkeypress="if(event.key==='Enter')app.sendMessage()">
                        <button onclick="app.sendMessage()" class="btn-primary" style="padding: 12px 24px;">Enviar</button>
                    </div>
                </div>
            </div>
            <div style="margin-top:24px; display:flex; gap:12px; flex-wrap:wrap;">
                <button class="glass-card" style="padding:8px 16px; border-radius:12px; font-size:0.8rem; font-weight:700;" onclick="app.quickQuery('Pedir Garantía')">📦 Pedir RMA</button>
                <button class="glass-card" style="padding:8px 16px; border-radius:12px; font-size:0.8rem; font-weight:700;" onclick="app.quickQuery('Limpieza técnica')">🧼 Guía Limpieza</button>
            </div>
        `;
    },

    renderHistory() {
        const chat = document.getElementById('chat-messages');
        if (!chat) return;
        chat.innerHTML = '';
        this.chatHistory.forEach(msg => {
            this.addMessageToUI(msg.parts[0].text, msg.role === 'user' ? 'user' : 'ai');
        });
        chat.scrollTop = chat.scrollHeight;
    },

    async sendMessage() {
        const input = document.getElementById('ai-input');
        const text = input.value.trim();
        if (!text) return;

        this.addMessageToUI(text, 'user');
        this.chatHistory.push({ role: 'user', parts: [{ text }] });
        input.value = '';

        try {
            const response = await this.callGemini();
            this.addMessageToUI(response, 'ai');
            this.chatHistory.push({ role: 'model', parts: [{ text: response }] });
            this.saveHistory();
        } catch (error) {
            this.toast("Melody fuera de línea", "error");
        }
    },

    addMessageToUI(text, type) {
        const chat = document.getElementById('chat-messages');
        if (!chat) return;
        const msg = document.createElement('div');
        msg.className = `message-wrapper ${type}`;
        
        const avatar = type === 'ai' ? '<div class="avatar">M</div>' : '';
        msg.innerHTML = `${avatar}<div class="message"><span>${text}</span></div>`;
        
        chat.appendChild(msg);
        chat.scrollTop = chat.scrollHeight;
    },

    async callGemini() {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
        const payload = {
            system_instruction: {
                parts: [{ text: `Melody Plus (High-End Support Agent). User: ${this.userName}, Tier: ${this.userTier}. Focus on extreme technical precision and medical empathy.` }]
            },
            contents: this.chatHistory.slice(-12)
        };
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    },

    getHomeHTML() { return `<div class="header-section"><h1>Entorno Plus</h1><p>Tu ecosistema de audición inteligente está listo.</p></div><div class="glass-card" style="padding:40px; border-radius:24px;"><h3>Estado Sincronizado</h3><p style="margin-top:12px; color:var(--slate-500);">Todo funciona correctamente con tu ${this.deviceModel}.</p></div>`; },
    getBenefitsHTML() { return `<div class="header-section"><h1>Fidelidad</h1><p>Progreso hacia el nivel Platino.</p></div><div class="dashboard-grid"><div class="glass-card" style="padding:32px; border-radius:24px;"><h4>Beneficios ${this.userTier}</h4><p style="margin-top:12px;">Soporte Melody 24/7 y Sincronización Health Cloud activa.</p></div></div>`; },
    getCareHTML() {
        return `
            <div class="header-section"><h1>Gestión Técnica</h1><p>Completa el mantenimiento para ganar 50 puntos.</p></div>
            <div style="display:grid; gap:16px;">
                <div class="glass-card checklist-item ${this.careState.tmic?'completed':''}" style="padding:24px; border-radius:16px; cursor:pointer;" onclick="app.toggleCareTask('tmic')">Limpieza del Micrófono (T-Mic)</div>
                <div class="glass-card checklist-item ${this.careState.cable?'completed':''}" style="padding:24px; border-radius:16px; cursor:pointer;" onclick="app.toggleCareTask('cable')">Verificación de Cable de Antena</div>
                <div class="glass-card checklist-item ${this.careState.dryer?'completed':''}" style="padding:24px; border-radius:16px; cursor:pointer;" onclick="app.toggleCareTask('dryer')">Ciclo de Deshumidificación</div>
                <div class="glass-card checklist-item ${this.careState.battery?'completed':''}" style="padding:24px; border-radius:16px; cursor:pointer;" onclick="app.toggleCareTask('battery')">Estado de Carga de Batería</div>
            </div>
        `;
    },
    getProfileHTML() { return `<div class="header-section"><h1>Percepción</h1><p>Tu perfil clínico digital.</p></div><div class="glass-card" style="padding:32px; border-radius:20px;"><p><b>Asignado:</b> ${this.userName}</p><p><b>Hardware:</b> ${this.deviceModel}</p><p><b>Nivel:</b> ${this.userTier}</p></div>`; },
    saveHistory() { localStorage.setItem('ab_chat_history', JSON.stringify(this.chatHistory.slice(-15))); },
    quickQuery(t){ const i = document.getElementById('ai-input'); if(i){i.value=t; this.sendMessage();} }
};

document.addEventListener('DOMContentLoaded', () => { app.init(); window.app = app; });
