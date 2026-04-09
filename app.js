const app = {
    apiKey: 'AIzaSyCNdm_eWA65yTRVnikOCMuG6-mwHRiwFAc',
    currentView: 'assistant', // Default to Assistant
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
        console.log("AB Care Hub V3 WhatsApp Bridge Initialized");
    },

    startBridge() {
        const splash = document.getElementById('bridge-splash');
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
                if (this.chatHistory.length === 0) {
                    this.sendGreeting();
                }
            }, 600);
        }, 2000);
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
        if (!completed) {
            document.getElementById('onboarding-overlay').classList.add('visible');
        }
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
        return `
            <div class="header-section">
                <h1>Conversación con Melody</h1>
                <p>Transferencia segura desde WhatsApp finalizada.</p>
            </div>
            <div class="chat-container">
                <div id="chat-messages"></div>
                <div class="chat-input-area">
                    <button onclick="app.simulateUpload()" class="nav-item" style="padding: 10px; background: #f1f5f9;">
                        <i data-lucide="image"></i>
                    </button>
                    <input type="text" id="ai-input" placeholder="Escribe tu mensaje aquí..." style="flex: 1; padding: 14px; border-radius: 12px; border: 1px solid var(--border); outline: none; font-size: 1rem;">
                    <button onclick="app.sendMessage()" style="background: var(--primary); color: white; border: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        Enviar <i data-lucide="send" style="width: 18px; height: 18px;"></i>
                    </button>
                </div>
            </div>
            <div style="display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap;">
                <button class="nav-item" style="border: 1px solid var(--border); background: white; font-size: 0.85rem;" onclick="app.quickQuery('¿Cómo solicito garantía?')">📦 Solicitar Garantía (RMA)</button>
                <button class="nav-item" style="border: 1px solid var(--border); background: white; font-size: 0.85rem;" onclick="app.quickQuery('no escucho nada')">🔇 No escucho sonidos</button>
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
            console.error(error);
            this.addMessageToUI("Lo siento, estoy experimentando dificultades técnicas. Revisa tu conexión.", 'ai');
        }
    },

    addMessageToUI(text, type) {
        const chat = document.getElementById('chat-messages');
        if (!chat) return;
        const msg = document.createElement('div');
        msg.className = `message ${type}`;
        msg.innerHTML = `<span>${text}</span>`;
        chat.appendChild(msg);
        chat.scrollTop = chat.scrollHeight;
    },

    async callGemini() {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
        const payload = {
            system_instruction: {
                parts: [{ text: `Eres Melody, de Advance Bionics. Haz recibido al usuario de WhatsApp.
                1. RMA/Garantía: Pide fotos y da el link https://forms.kommo.com/rdrvrxx.
                2. Si no escucha: Check T-Mic y humedad.
                3. Usa un tono cálido y empático.` }]
            },
            contents: this.chatHistory.slice(-10)
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    },

    getHomeHTML() {
        return `
            <div class="header-section"><h1>Dashboard</h1><p>Bienvenido, Juan.</p></div>
            <div class="dashboard-grid">
                <div class="card"><h3>Garantía</h3><div style="font-size: 3rem; font-weight: 800; color: var(--primary);">730</div><p>Días restantes</p></div>
            </div>
        `;
    },

    saveHistory() { localStorage.setItem('ab_chat_history', JSON.stringify(this.chatHistory.slice(-15))); },
    clearChat() { this.chatHistory = []; this.saveHistory(); this.switchView('assistant'); },
    simulateUpload() { this.addMessageToUI("[Simulado] Foto subida exitosamente.", 'ai'); },
    quickQuery(text) { const i = document.getElementById('ai-input'); if(i){ i.value=text; this.sendMessage(); } },
    getBenefitsHTML() { return `<div class="card"><h1>Beneficios</h1><p>Nivel Gold activo.</p></div>`; },
    getCareHTML() { return `<div class="card"><h1>Cuidado Técnico</h1><p>Sigue tu checklist.</p></div>`; },
    getProfileHTML() { return `<div class="card"><h1>Perfil</h1><p>Sincronizado con Salesforce.</p></div>`; }
};

document.addEventListener('DOMContentLoaded', () => { app.init(); window.app = app; });
