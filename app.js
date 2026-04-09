const app = {
    apiKey: 'AIzaSyAMDSqSymAmIHDrvwZFG767dwOHvTpV_o4',
    currentView: 'home',
    onboardingStep: 1,
    userName: localStorage.getItem('ab_user_name') || 'Juan Manuel',
    deviceModel: 'Naída CI M90',
    chatHistory: JSON.parse(localStorage.getItem('ab_chat_history')) || [],

    init() {
        this.bindEvents();
        this.checkOnboarding();
        console.log("AB Care Hub V2.1 Initialized");
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

        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        const targetView = document.getElementById(`view-${viewId}`);
        if (targetView) {
            targetView.classList.add('active');
            if (viewId === 'assistant') this.renderHistory();
        } else {
            this.renderView(viewId);
        }

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
                <h1>Melody AI Assistant</h1>
                <p>Especialista en Advance Bionics con memoria técnica y de procesos.</p>
            </div>
            <div class="card chat-container" style="display: flex; flex-direction: column; gap: 16px; padding: 0; overflow: hidden;">
                <div id="chat-messages" style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; background: #fcfcfc;">
                    <div class="message ai">
                        <span>Hola Juan Manuel, soy Melody, tu especialista de Advance Bionics. ¿En qué puedo apoyarte con tu Naída CI M90 hoy?</span>
                    </div>
                </div>
                <div style="padding: 20px; border-top: 1px solid var(--border); display: flex; gap: 12px; align-items: center;">
                    <button onclick="app.simulateUpload()" class="btn-icon" title="Subir foto del dispositivo">
                        <i data-lucide="image"></i>
                    </button>
                    <input type="text" id="ai-input" placeholder="Escribe tu consulta o describe el daño..." style="flex: 1; padding: 12px 16px; border-radius: 8px; border: 1px solid var(--border); outline: none;">
                    <button onclick="app.sendMessage()" style="background: var(--primary); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">Enviar</button>
                </div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap;">
                <button class="nav-item-btn" onclick="app.quickQuery('no escucho por el microfono')">No escucho por el micrófono</button>
                <button class="nav-item-btn" onclick="app.quickQuery('¿Cómo solicito garantía?')">¿Cómo solicito garantía?</button>
                <button class="nav-item-btn" onclick="app.quickQuery('Mis puntos del nivel Gold')">Mis beneficios Gold</button>
            </div>
        `;
    },

    renderHistory() {
        const chat = document.getElementById('chat-messages');
        if (!chat) return;
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
            this.addMessageToUI("Lo siento, estoy experimentando dificultades técnicas. Por favor, intenta de nuevo en un momento.", 'ai');
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
        
        const systemPrompt = `Eres Melody, Specialist Assistant de Advance Bionics. 
        REGLAS DE NEGOCIO (KNOWLEDGE BASE):
        1. RMA/Garantía: Si el usuario reporta daño, falta de sonido o mal funcionamiento, es URGENTE.
           - DEBES pedir fotos del dispositivo y componentes (cable, bobina, micro).
           - Menciona el link seguro de formulario RMA: https://forms.kommo.com/rdrvrxx.
           - Informa que se generará un número de caso con formato "VAL-XXXX" en el CRM de la clínica.
        2. T-Mic™: Si mencionan no escuchar, sugiere revisar protectores del micrófono T-Mic.
        3. Identidad: Eres Melody. Saluda a Juan Manuel al inicio (ya lo hiciste, mantén el tono).
        4. Contexto: Juan Manuel tiene un Naída CI M90 y nivel Gold.
        5. Memoria: Responde basándote en la historia que recibes. No olvides lo que el usuario dijo antes.
        6. Empatía: Usa un lenguaje profesional pero cálido ("Entiendo lo frustrante que puede ser...").`;

        const contents = [
            { role: 'user', parts: [{ text: `INSTRUCCIÓN DE SISTEMA: ${systemPrompt}` }] },
            ...this.chatHistory
        ];

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.candidates[0].content.parts[0].text;
    },

    saveHistory() {
        localStorage.setItem('ab_chat_history', JSON.stringify(this.chatHistory.slice(-20)));
    },

    clearChat() {
        this.chatHistory = [];
        this.saveHistory();
        this.switchView('assistant');
    },

    simulateUpload() {
        this.addMessageToUI("[Simulación] Subiendo 2 fotos del procesador Naída CI M90...", 'user');
        setTimeout(() => {
            this.addMessageToUI("He recibido tus fotos, Juan Manuel. Las estoy adjuntando a tu expediente en Salesforce para que el equipo técnico las revise de inmediato. ¿Alguna otra parte del dispositivo que quieras mostrar?", 'ai');
        }, 1500);
    },

    quickQuery(text) {
        const input = document.getElementById('ai-input');
        if (input) {
            input.value = text;
            this.sendMessage();
        }
    },

    getBenefitsHTML: function() { /* snippet... */ return `
        <div class="header-section">
            <h1>Tus Beneficios</h1>
            <p>Nivel Gold: Ventajas exclusivas.</p>
        </div>
        <div class="dashboard-grid">
            <div class="card" style="grid-column: span 2; background: linear-gradient(135deg, #0066b2, #0ea5e9); color: white;">
                <h3>Puntos Gold</h3>
                <div style="font-size: 3rem; font-weight: 800; margin: 16px 0;">750 <small style="font-size: 1rem; opacity: 0.8;">PTS</small></div>
                <div class="progress-bar-container" style="background: rgba(255,255,255,0.2);">
                    <div class="progress-bar" style="width: 75%; background: white;"></div>
                </div>
            </div>
            <div class="card">
                <i data-lucide="award"></i><h4>Garantía +12 meses</h4>
            </div>
            <div class="card">
                <i data-lucide="package"></i><h4>Kit de Limpieza Pro</h4>
            </div>
        </div>
    `},

    getCareHTML: function() { return `
        <div class="header-section"><h1>Cuidado Diario</h1><p>Mantenimiento preventivo.</p></div>
        <div class="card"><h3>Checklist</h3><p>• Limpiar cable • Verificar bobina • Deshumidificar</p></div>
    `},

    getProfileHTML: function() { return `
        <div class="header-section"><h1>Mi Perfil</h1><p>Datos sincronizados.</p></div>
        <div class="card"><p>Usuario: Juan Manuel</p><p>Dispositivo: Naída CI M90</p></div>
    `}
};

document.addEventListener('DOMContentLoaded', () => { app.init(); window.app = app; });
