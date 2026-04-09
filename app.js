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
        console.log("AB Care Hub V5 Identity & Loyalty Initialized");
    },

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
        if (!this.userName) {
            loginScreen.classList.add('active');
        } else {
            loginScreen.classList.remove('active');
            // Wait for login screen to fade before showing onboarding
            setTimeout(() => this.checkOnboarding(), 400);
        }
    },

    login() {
        const nameInput = document.getElementById('login-name');
        const deviceInput = document.getElementById('login-device');
        
        if (!nameInput.value.trim()) {
            alert("Por favor, ingresa tu nombre.");
            return;
        }

        this.userName = nameInput.value.trim();
        this.deviceModel = deviceInput.value;
        
        localStorage.setItem('ab_user_name', this.userName);
        localStorage.setItem('ab_user_device', this.deviceModel);
        
        document.getElementById('login-screen').classList.remove('active');
        
        // Sequence: Start Bridge -> Then see if onboarding is needed
        setTimeout(() => {
            this.startBridge();
            this.checkOnboarding();
            this.updateLoyaltyUI();
            this.switchView('assistant');
        }, 400);
    },

    logout() {
        if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
            localStorage.clear();
            location.reload();
        }
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
    },

    startBridge() {
        const splash = document.getElementById('bridge-splash');
        splash.style.display = 'flex';
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
                if (this.chatHistory.length === 0) this.sendGreeting();
            }, 600);
        }, 1200);
    },

    sendGreeting() {
        const greeting = `Hola ${this.userName}, bienvenido a tu Hub Plus. He sincronizado tu perfil y tu ${this.deviceModel} está listo para ser monitoreado. Soy Melody, ¿en qué puedo ayudarte?`;
        this.addMessageToUI(greeting, 'ai');
        this.chatHistory.push({ role: 'model', parts: [{ text: greeting }] });
        this.saveHistory();
    },

    updateLoyaltyUI() {
        // Thresholds: Gold at 500, Platinum at 1000
        if (this.userPoints >= 1000) this.userTier = 'PLATINO';
        else if (this.userPoints >= 500) this.userTier = 'ORO';
        else this.userTier = 'BRONCE';
        
        localStorage.setItem('ab_user_tier', this.userTier);

        // Sidebar Update
        const sidebarPoints = document.getElementById('sidebar-points');
        const sidebarTier = document.getElementById('sidebar-tier');
        const progressFill = document.getElementById('loyalty-progress-fill');
        
        if (sidebarPoints) sidebarPoints.innerText = this.userPoints;
        if (sidebarTier) sidebarTier.innerText = this.userTier;
        
        // Progress Logic
        let progress = (this.userPoints / 1000) * 100;
        if (progress > 100) progress = 100;
        if (progressFill) progressFill.style.width = `${progress}%`;

        // Mobile update
        const mobileTier = document.getElementById('mobile-tier');
        if (mobileTier) mobileTier.innerText = this.userTier;
    },

    addPoints(pts) {
        this.userPoints += pts;
        localStorage.setItem('ab_user_points', this.userPoints);
        this.updateLoyaltyUI();
        alert(`¡Has ganado ${pts} puntos por cuidar tu audición! 🎉`);
    },

    toggleCareTask(taskId) {
        this.careState[taskId] = !this.careState[taskId];
        localStorage.setItem('ab_care_state', JSON.stringify(this.careState));
        
        const total = Object.keys(this.careState).length;
        const done = Object.values(this.careState).filter(v => v).length;
        
        if (done === total) {
            this.addPoints(50);
            this.congratulateUser();
        }
        
        this.switchView('care');
    },

    congratulateUser() {
        const msg = `¡Increíble ${this.userName}! Checklist completado. He sumado 50 puntos a tu cuenta Plus.`;
        this.chatHistory.push({ role: 'model', parts: [{ text: msg }] });
        this.saveHistory();
    },

    switchView(viewId) {
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
        });
        const main = document.getElementById('main-content');
        main.innerHTML = '';
        this.renderView(viewId);
        this.currentView = viewId;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    renderView(viewId) {
        const main = document.getElementById('main-content');
        const viewSection = document.createElement('section');
        viewSection.id = `view-${viewId}`;
        viewSection.className = 'view active';

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
        return `
            <div class="header-section"><h1>Melody Plus</h1><p>Consultor técnico optimizado para ${this.deviceModel}.</p></div>
            <div class="assistant-layout">
                <div class="assistant-sidebar desktop-only">
                    <div class="sidebar-card">
                        <div class="badge-row"><span class="status-dot"></span><small>SISTEMA SEGURADO</small></div>
                        <h3>${this.userName}</h3>
                        <p style="font-size: 0.8rem; color: var(--text-muted);">${this.deviceModel}</p>
                    </div>
                </div>
                <div class="chat-container">
                    <div id="chat-messages"></div>
                    <div class="chat-input-area">
                        <input type="text" id="ai-input" placeholder="¿En qué puedo ayudarte hoy?" onkeypress="if(event.key==='Enter')app.sendMessage()">
                        <button onclick="app.sendMessage()" class="btn-primary" style="padding: 12px 24px;">Enviar</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderHistory() {
        const chat = document.getElementById('chat-messages');
        if (!chat) return;
        chat.innerHTML = '';
        this.chatHistory.forEach(msg => {
            const wrapper = document.createElement('div');
            wrapper.className = `message-wrapper ${msg.role === 'user' ? 'user' : 'ai'}`;
            wrapper.innerHTML = `<div class="message"><span>${msg.parts[0].text}</span></div>`;
            chat.appendChild(wrapper);
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
            this.addMessageToUI("Error de conexión con Melody Plus.", 'ai');
        }
    },

    addMessageToUI(text, type) {
        const chat = document.getElementById('chat-messages');
        if (!chat) return;
        const msg = document.createElement('div');
        msg.className = `message-wrapper ${type}`;
        msg.innerHTML = `<div class="message"><span>${text}</span></div>`;
        chat.appendChild(msg);
        chat.scrollTop = chat.scrollHeight;
    },

    async callGemini() {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
        const payload = {
            system_instruction: {
                parts: [{ text: `Eres Melody Plus de Advance Bionics. El usuario es ${this.userName} con un ${this.deviceModel}. 
                Su nivel es ${this.userTier}. Si llega al 100% de cuidado gana 50 puntos.` }]
            },
            contents: this.chatHistory.slice(-10)
        };
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    },

    getHomeHTML() { return `<div class="card"><h1>Dashboard Plus</h1><p>Bienvenido de nuevo, ${this.userName}. Tu ${this.deviceModel} está en óptimas condiciones.</p></div>`; },
    getCareHTML() {
        const done = Object.values(this.careState).filter(v => v).length;
        const total = 4;
        return `
            <div class="header-section"><h1>Checklist de Cuidado</h1><p>Gana 50 puntos hoy (${done}/${total})</p></div>
            <div class="checklist-container">
                <div class="checklist-item ${this.careState.tmic ? 'completed':''}" onclick="app.toggleCareTask('tmic')"><label>Limpieza T-Mic</label></div>
                <div class="checklist-item ${this.careState.cable ? 'completed':''}" onclick="app.toggleCareTask('cable')"><label>Revisión de Cable</label></div>
                <div class="checklist-item ${this.careState.dryer ? 'completed':''}" onclick="app.toggleCareTask('dryer')"><label>Deshumidificador</label></div>
                <div class="checklist-item ${this.careState.battery ? 'completed':''}" onclick="app.toggleCareTask('battery')"><label>Carga Batería</label></div>
            </div>
        `;
    },
    getBenefitsHTML() {
        return `
            <div class="header-section"><h1>Programa de Fidelidad</h1><p>Tu nivel actual: ${this.userTier}</p></div>
            <div class="dashboard-grid">
                <div class="card"><h3>Beneficios ${this.userTier}</h3><p>• Soporte de Melody prioritario • Sincronización Salesforce</p></div>
                <div class="card"><h3>Próximo Nivel</h3><p>Llega a 500 para ORO o 1000 para PLATINO.</p></div>
            </div>
        `;
    },
    getProfileHTML() { return `<div class="card"><h1>Mi Perfil</h1><p>Usuario: ${this.userName}</p><p>Modelo: ${this.deviceModel}</p></div>`; },
    saveHistory() { localStorage.setItem('ab_chat_history', JSON.stringify(this.chatHistory.slice(-15))); }
};

document.addEventListener('DOMContentLoaded', () => { app.init(); window.app = app; });
