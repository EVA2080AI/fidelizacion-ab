const app = {
    apiKey: 'AIzaSyCNdm_eWA65yTRVnikOCMuG6-mwHRiwFAc',
    currentView: 'assistant',
    onboardingStep: 1,
    userName: localStorage.getItem('ab_user_name') || 'Juan Manuel',
    deviceModel: 'Naída CI M90',
    chatHistory: JSON.parse(localStorage.getItem('ab_chat_history')) || [],
    careState: JSON.parse(localStorage.getItem('ab_care_state')) || {
        tmic: false,
        cable: false,
        dryer: false,
        battery: false
    },

    init() {
        this.bindEvents();
        this.checkOnboarding();
        this.renderView('assistant');
        this.startBridge();
        console.log("AB Care Hub V4 Desktop Premium Initialized");
    },

    startBridge() {
        const splash = document.getElementById('bridge-splash');
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
                if (this.chatHistory.length === 0) this.sendGreeting();
            }, 600);
        }, 1500);
    },

    sendGreeting() {
        const greeting = `Hola ${this.userName}, he recibido tu transferencia desde WhatsApp. Soy Melody, tu especialista de Advance Bionics. ¿En qué puedo apoyarte con tu ${this.deviceModel} hoy?`;
        this.addMessageToUI(greeting, 'ai');
        this.chatHistory.push({ role: 'model', parts: [{ text: greeting }] });
        this.saveHistory();
    },

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.getAttribute('data-view');
                if (view) this.switchView(view);
            });
        });
    },

    checkOnboarding() {
        const completed = localStorage.getItem('ab_onboarding_completed');
        if (!completed) document.getElementById('onboarding-overlay').classList.add('visible');
    },

    nextOnboarding(step) {
        document.querySelectorAll('.onboarding-content').forEach(c => c.style.display = 'none');
        document.querySelectorAll('.step-dot').forEach(d => d.classList.remove('active'));
        document.getElementById(`onboarding-step-${step}`).style.display = 'block';
        document.getElementById(`dot-${step}`).classList.add('active');
        this.onboardingStep = step;
    },

    finishOnboarding() {
        const overlay = document.getElementById('onboarding-overlay');
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.classList.remove('visible');
            localStorage.setItem('ab_onboarding_completed', 'true');
        }, 300);
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
        const careProgress = Object.values(this.careState).filter(v => v).length * 25;
        return `
            <div class="header-section">
                <h1>Asistente Melody</h1>
                <p>Centro de mando y soporte técnico especializado.</p>
            </div>
            
            <div class="assistant-layout">
                <!-- Desktop Sidebar -->
                <div class="assistant-sidebar desktop-only">
                    <div class="sidebar-card">
                        <div class="badge-row">
                            <span class="status-dot"></span>
                            <small>SISTEMA ONLINE</small>
                        </div>
                        <h3>${this.deviceModel}</h3>
                        <p style="font-size: 0.8rem; color: var(--text-muted);">Sincronizado con Salesforce</p>
                    </div>

                    <div class="sidebar-card">
                        <h4>Garantía</h4>
                        <div class="stat-row">
                            <span class="stat-value">730</span>
                            <span class="stat-unit">DÍAS</span>
                        </div>
                        <div class="mini-progress"><div class="fill" style="width: 85%;"></div></div>
                    </div>

                    <div class="sidebar-card">
                        <h4>Meta de Cuidado</h4>
                        <div class="stat-row">
                            <span class="stat-value">${careProgress}%</span>
                        </div>
                        <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 8px;">Checklist de hoy</p>
                        <div class="mini-progress"><div class="fill" style="width: ${careProgress}%; background: var(--success);"></div></div>
                    </div>
                </div>

                <!-- Main Chat -->
                <div class="chat-container">
                    <div id="chat-messages"></div>
                    <div class="chat-input-area">
                        <button onclick="app.simulateUpload()" class="btn-icon">
                            <i data-lucide="camera"></i>
                        </button>
                        <input type="text" id="ai-input" placeholder="Escribe tu mensaje..." onkeypress="if(event.key==='Enter')app.sendMessage()">
                        <button onclick="app.sendMessage()" class="btn-send">
                            <i data-lucide="send"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="quick-queries">
                <button onclick="app.quickQuery('¿Cómo inicio una garantía?')">📦 Solicitar RMA</button>
                <button onclick="app.quickQuery('no escucho por el microfono')">🔇 Problema de sonido</button>
                <button onclick="app.quickQuery('Revisar mis puntos Gold')">🏆 Mis Puntos</button>
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
            this.addMessageToUI("Lo siento, estoy teniendo problemas de conexión. Por favor reintenta.", 'ai');
        }
    },

    addMessageToUI(text, type) {
        const chat = document.getElementById('chat-messages');
        if (!chat) return;
        const msg = document.createElement('div');
        msg.className = `message-wrapper ${type}`;
        
        const avatar = type === 'ai' ? '<div class="avatar">M</div>' : '';
        msg.innerHTML = `
            ${avatar}
            <div class="message">
                <span>${text}</span>
            </div>
        `;
        chat.appendChild(msg);
        chat.scrollTop = chat.scrollHeight;
    },

    async callGemini() {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
        const payload = {
            system_instruction: {
                parts: [{ text: `Eres Melody, Specialist de Advance Bionics. 
                1. RMA: Pide fotos y da link https://forms.kommo.com/rdrvrxx.
                2. Fallo sonido: T-Mic check.
                3. Tono: Profesional, técnico pero empático.` }]
            },
            contents: this.chatHistory.slice(-12)
        };
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    },

    getHomeHTML() { return `<div class="card"><h1>Dashboard</h1><p>Visualiza tu estado auditivo.</p></div>`; },
    getBenefitsHTML() { return `<div class="card"><h1>Beneficios</h1><p>Nivel Gold activo.</p></div>`; },
    getCareHTML() { return `<div class="card"><h1>Cuidado</h1><p>Checklist persistente.</p></div>`; },
    getProfileHTML() { return `<div class="card"><h1>Perfil</h1><p>Sincronizado.</p></div>`; },
    saveHistory() { localStorage.setItem('ab_chat_history', JSON.stringify(this.chatHistory.slice(-15))); },
    clearChat() { this.chatHistory = []; this.saveHistory(); this.switchView('assistant'); },
    simulateUpload() { this.addMessageToUI("[Simulado] Imagen enviada correctamente.", 'ai'); },
    quickQuery(text) { const i = document.getElementById('ai-input'); if(i){i.value=text; this.sendMessage();} }
};

document.addEventListener('DOMContentLoaded', () => { app.init(); window.app = app; });
