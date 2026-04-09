const app = {
    apiKey: 'AIzaSyCNdm_eWA65yTRVnikOCMuG6-mwHRiwFAc',
    currentView: 'home',
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
        console.log("AB Care Hub V2.2 iPhone Optimized Initialized");
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
                    <button onclick="app.simulateUpload()" class="btn-icon">
                        <i data-lucide="image"></i>
                    </button>
                    <input type="text" id="ai-input" placeholder="Escribe tu consulta..." style="flex: 1; padding: 12px 16px; border-radius: 8px; border: 1px solid var(--border); outline: none;">
                    <button onclick="app.sendMessage()" style="background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600;">Enviar</button>
                </div>
            </div>
        `;
    },

    getCareHTML() {
        const progress = this.updateCareProgress();
        return `
            <div class="header-section">
                <h1>Cuidado del Dispositivo</h1>
                <p>Responsabilidad diaria para una audición excelente.</p>
            </div>
            
            <div class="card care-progress-card" style="margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h3>Progreso de Hoy</h3>
                    <span id="progress-percent" style="font-weight: 800; font-size: 1.2rem;">${progress}%</span>
                </div>
                <div class="progress-bar-container" style="background: rgba(255,255,255,0.1); height: 12px;">
                    <div id="care-bar" class="progress-bar" style="width: ${progress}%; background: #10b981;"></div>
                </div>
            </div>

            <div class="checklist-container">
                ${this.renderCheckItem('tmic', 'Limpiar filtros T-Mic™', 'Garantiza que los micrófonos estén libres de cerumen.')}
                ${this.renderCheckItem('cable', 'Revisar cable y bobina', 'Busca signos de desgaste o rotura.')}
                ${this.renderCheckItem('dryer', 'Deshumidificador nocturno', 'Elimina la humedad acumulada durante el día.')}
                ${this.renderCheckItem('battery', 'Verificar carga de batería', 'Asegúrate de tener energía para todo el día.')}
            </div>
        `;
    },

    renderCheckItem(id, title, desc) {
        const completed = this.careState[id] ? 'completed' : '';
        return `
            <div class="checklist-item ${completed}" onclick="app.toggleCareTask('${id}')">
                <div class="check-circle">
                    <i data-lucide="check" style="width: 14px; height: 14px;"></i>
                </div>
                <div>
                    <label>${title}</label>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">${desc}</p>
                </div>
            </div>
        `;
    },

    toggleCareTask(taskId) {
        this.careState[taskId] = !this.careState[taskId];
        localStorage.setItem('ab_care_state', JSON.stringify(this.careState));
        
        const progress = this.updateCareProgress();
        this.switchView('care'); // Refresh view
        
        if (progress === 100) {
            this.congratulateUser();
        }
    },

    updateCareProgress() {
        const total = Object.keys(this.careState).length;
        const done = Object.values(this.careState).filter(v => v).length;
        return Math.round((done / total) * 100);
    },

    congratulateUser() {
        const msg = "¡Felicidades Juan Manuel! Has completado todo el mantenimiento preventivo de hoy. Tu Naída CI M90 te lo agradecerá.";
        this.chatHistory.push({ role: 'model', parts: [{ text: msg }] });
        this.saveHistory();
        alert(msg);
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
            this.addMessageToUI("Lo siento, estoy experimentando dificultades técnicas.", 'ai');
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
                parts: [{ text: `Eres Melody, Specialist Assistant de Advance Bionics. 
                1. RMA/Garantía: Pide fotos y menciona el link https://forms.kommo.com/rdrvrxx.
                2. T-Mic™: Sugiere revisar filtros.
                3. Juan Manuel tiene un Naída CI M90.
                4. Usa el historial para ser coherente.` }]
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

    saveHistory() { localStorage.setItem('ab_chat_history', JSON.stringify(this.chatHistory.slice(-20))); },
    clearChat() { this.chatHistory = []; this.saveHistory(); this.switchView('assistant'); },
    simulateUpload() { /* ... */ },

    getBenefitsHTML() { return `<div class="card"><h3>Premios Gold</h3><p>Puntos: 750</p></div>`; },
    getProfileHTML() { return `<div class="card"><h3>Perfil</h3><p>Juan Manuel</p></div>`; }
};

document.addEventListener('DOMContentLoaded', () => { app.init(); window.app = app; });
