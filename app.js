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
        console.log("AB Care Hub V7 Expert Content Activated");
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
            setTimeout(() => this.checkOnboarding(), 500);
        }
    },

    login() {
        const nameInput = document.getElementById('login-name');
        const deviceInput = document.getElementById('login-device');
        if (!nameInput.value.trim()) { this.toast("Nombre requerido", "error"); return; }
        this.userName = nameInput.value.trim();
        this.deviceModel = deviceInput.value;
        localStorage.setItem('ab_user_name', this.userName);
        localStorage.setItem('ab_user_device', this.deviceModel);
        document.getElementById('login-screen').classList.remove('active');
        setTimeout(() => { this.startBridge(); this.checkOnboarding(); this.updateLoyaltyUI(); this.switchView('assistant'); }, 500);
    },

    logout() { localStorage.clear(); location.reload(); },
    checkOnboarding() { if (!localStorage.getItem('ab_onboarding_completed')) document.getElementById('onboarding-overlay').classList.add('active'); },
    finishOnboarding() { document.getElementById('onboarding-overlay').classList.remove('active'); localStorage.setItem('ab_onboarding_completed', 'true'); this.toast("Modo Experto Activado", "success"); },

    startBridge() {
        const splash = document.getElementById('bridge-splash');
        splash.classList.add('active');
        setTimeout(() => { splash.classList.remove('active'); if (this.chatHistory.length === 0) this.sendGreeting(); }, 2000);
    },

    sendGreeting() {
        const greeting = `Hola ${this.userName}, Centro de Mando Plus activado. Soy Melody. He sincronizado tu historial de casos VAL. ¿En qué soporte técnico te puedo apoyar hoy con tu ${this.deviceModel}?`;
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
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100px)'; setTimeout(() => toast.remove(), 500); }, 3500);
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

    addPoints(pts) { this.userPoints += pts; localStorage.setItem('ab_user_points', this.userPoints); this.updateLoyaltyUI(); this.toast(`+${pts} Puntos Plus`, "success"); },

    toggleCareTask(taskId) {
        this.careState[taskId] = !this.careState[taskId];
        localStorage.setItem('ab_care_state', JSON.stringify(this.careState));
        const done = Object.values(this.careState).filter(v => v).length;
        if (done === 4) { this.addPoints(50); this.congratulateUser(); }
        this.switchView('care');
    },

    congratulateUser() {
        const msg = `¡Excelente, ${this.userName}! Mantenimiento completo. He registrado la integridad de tu ${this.deviceModel} en el sistema.`;
        this.addMessageToUI(msg, 'ai');
        this.chatHistory.push({ role: 'model', parts: [{ text: msg }] });
        this.saveHistory();
    },

    switchView(viewId) {
        const activeView = document.querySelector('.view.active');
        if (activeView) activeView.classList.remove('active');
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-view') === viewId));
        const main = document.getElementById('main-content');
        const header = main.querySelector('.mobile-header');
        main.innerHTML = '';
        if (header) main.appendChild(header);
        this.renderView(viewId);
        this.currentView = viewId;
        setTimeout(() => { const newView = document.getElementById(`view-${viewId}`); if (newView) newView.classList.add('active'); }, 50);
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
        return `
            <div class="header-section"><h1>Melody Plus</h1><p>Consultor técnico especializado en Marvel y Ultra 3D.</p></div>
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
                        <input type="text" id="ai-input" placeholder="Consultar sobre RMA o Mantenimiento..." onkeypress="if(event.key==='Enter')app.sendMessage()">
                        <button onclick="app.sendMessage()" class="btn-primary" style="padding: 12px 24px;">Enviar</button>
                    </div>
                </div>
            </div>
            <div style="margin-top:24px; display:flex; gap:12px; flex-wrap:wrap;">
                <button class="glass-card" style="padding:10px 18px; border-radius:12px; font-size:0.85rem; font-weight:700;" onclick="app.quickQuery('¿Status de mi caso VAL?')">🔎 Status de Caso</button>
                <button class="glass-card" style="padding:10px 18px; border-radius:12px; font-size:0.85rem; font-weight:700;" onclick="app.launchRMA()">📦 Iniciar RMA (Kommo)</button>
            </div>
        `;
    },

    renderHistory() {
        const chat = document.getElementById('chat-messages');
        if (!chat) return;
        chat.innerHTML = '';
        this.chatHistory.forEach(msg => { this.addMessageToUI(msg.parts[0].text, msg.role === 'user' ? 'user' : 'ai'); });
        chat.scrollTop = chat.scrollHeight;
    },

    async sendMessage() {
        const input = document.getElementById('ai-input');
        const text = input.value.trim();
        if (!text) return;
        this.addMessageToUI(text, 'user');
        this.chatHistory.push({ role: 'user', parts: [{ text }] });
        input.value = '';
        try { const response = await this.callGemini(); this.addMessageToUI(response, 'ai'); this.chatHistory.push({ role: 'model', parts: [{ text: response }] }); this.saveHistory(); } catch (error) { this.toast("Error de conexión", "error"); }
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
                parts: [{ text: `Melody expert at AB. Format valid cases as VAL-825256. Form link: https://forms.kommo.com/rdrvrxx. User: ${this.userName}, Tier: ${this.userTier}.` }]
            },
            contents: this.chatHistory.slice(-10)
        };
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    },

    launchRMA() { window.open('https://forms.kommo.com/rdrvrxx', '_blank'); },

    getHomeHTML() {
        return `
            <div class="header-section"><h1>Entorno Plus</h1><p>Monitor de integridad y estado de garantía.</p></div>
            <div class="dashboard-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:24px;">
                <div class="glass-card" style="padding:32px; border-radius:24px; position:relative;">
                    <span class="status-tag caution">EN REVISIÓN</span>
                    <h3 style="margin-top:20px;">Caso VAL-906888</h3>
                    <p style="margin-top:12px; color:var(--slate-500); font-size:0.9rem;">Estado: Esperando fotos del daño del dispositivo.</p>
                    <button class="btn-primary" style="margin-top:24px; width:100%; font-size:0.8rem;" onclick="app.quickQuery('Ya envié las fotos')">Subir Imágenes</button>
                </div>
                <div class="glass-card" style="padding:32px; border-radius:24px;">
                    <h3>Integridad Marvel</h3>
                    <div style="font-size:3rem; font-weight:900; color:var(--success); margin:16px 0;">98%</div>
                    <p style="color:var(--slate-500); font-size:0.9rem;">Tu procesador ha mantenido un rendimiento óptimo los últimos 30 días.</p>
                </div>
            </div>
        `;
    },

    getBenefitsHTML() {
        return `
            <div class="header-section"><h1>Fidelidad AB</h1><p>Beneficios exclusivos por nivel de cuidado.</p></div>
            <div class="dashboard-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:24px;">
                <div class="glass-card" style="padding:28px; border-radius:24px; border-top:4px solid var(--warning);">
                    <i data-lucide="video" style="color:var(--warning); margin-bottom:16px;"></i>
                    <h4>AB Colegio</h4>
                    <p style="margin-top:10px; font-size:0.85rem; color:var(--slate-500);">Acceso ilimitado a videos de entrenamiento para familia y profesores.</p>
                    <button class="btn-primary" style="margin-top:20px; font-size:0.75rem;" onclick="app.toast('Redirigiendo a AB Colegio...')">Ver Videos</button>
                </div>
                <div class="glass-card" style="padding:28px; border-radius:24px; border-top:4px solid var(--primary);">
                    <i data-lucide="rocket" style="color:var(--primary); margin-bottom:16px;"></i>
                    <h4>Prioridad RMA</h4>
                    <p style="margin-top:10px; font-size:0.85rem; color:var(--slate-500);">Tu caso VAL tiene prioridad nivel ${this.userTier === 'ORO' ? '2' : '1'} en laboratorio técnico.</p>
                </div>
                <div class="glass-card" style="padding:28px; border-radius:24px; border-top:4px solid var(--success);">
                    <i data-lucide="zap" style="color:var(--success); margin-bottom:16px;"></i>
                    <h4>Puntos Plus</h4>
                    <p style="margin-top:10px; font-size:0.85rem; color:var(--slate-500);">Canjea tus ${this.userPoints} puntos por baterías y cables de antena gratis.</p>
                </div>
            </div>
        `;
    },

    getCareHTML() {
        return `
            <div class="header-section"><h1>Mantenimiento Clínico</h1><p>Gana 50 puntos manteniendo la integridad de tu ${this.deviceModel}.</p></div>
            <div style="display:grid; gap:16px;">
                <div class="glass-card checklist-item ${this.careState.tmic?'completed':''}" style="padding:24px; border-radius:16px;" onclick="app.toggleCareTask('tmic')">
                    <b>Protector de Micrófono (T-Mic)</b>
                    <p style="font-size:0.8rem; color:var(--slate-500); margin-top:4px;">Revisar acumulación de cerumen y limpiar con cepillo suave.</p>
                </div>
                <div class="glass-card checklist-item ${this.careState.cable?'completed':''}" style="padding:24px; border-radius:16px;" onclick="app.toggleCareTask('cable')">
                    <b>Verificación Cable Ultra 3D</b>
                    <p style="font-size:0.8rem; color:var(--slate-500); margin-top:4px;">Inspección visual de dobleces o cortes en la cubierta del cable.</p>
                </div>
                <div class="glass-card checklist-item ${this.careState.dryer?'completed':''}" style="padding:24px; border-radius:16px;" onclick="app.toggleCareTask('dryer')">
                    <b>Ciclo de Deshumidificación</b>
                    <p style="font-size:0.8rem; color:var(--slate-500); margin-top:4px;">Uso de Dry-Cap o deshumidificador eléctrico durante al menos 4 horas.</p>
                </div>
                <div class="glass-card checklist-item ${this.careState.battery?'completed':''}" style="padding:24px; border-radius:16px;" onclick="app.toggleCareTask('battery')">
                    <b>Optimización de Contactos</b>
                    <p style="font-size:0.8rem; color:var(--slate-500); margin-top:4px;">Limpiar contactos de batería Marvel con paño seco y libre de pelusa.</p>
                </div>
            </div>
        `;
    },

    getProfileHTML() {
        return `
            <div class="header-section"><h1>Percepción Clínica</h1><p>Historial técnico sincronizado con Salesforce Health.</p></div>
            <div class="glass-card" style="padding:32px; border-radius:24px; margin-bottom:24px;">
                <h4>${this.userName}</h4>
                <p style="color:var(--slate-500); font-size:0.9rem; margin-top:8px;">Implante Coclear Activo: Marvel / Ultra 3D</p>
                <p style="color:var(--slate-500); font-size:0.9rem;">ID Paciente: AB-{{Math.floor(Math.random()*100000)}}</p>
            </div>
            <h3>Historial de Casos</h3>
            <div style="margin-top:20px; display:flex; flex-direction:column; gap:12px;">
                <div class="glass-card shadow-sm" style="padding:20px; border-left:4px solid var(--success); display:flex; justify-content:space-between; align-items:center;">
                    <div><b>VAL-1273438</b><p style="font-size:0.8rem; color:var(--slate-500);">Revisión Anual Preventiva</p></div>
                    <span class="status-tag success">APROBADO</span>
                </div>
                <div class="glass-card shadow-sm" style="padding:20px; border-left:4px solid var(--warning); display:flex; justify-content:space-between; align-items:center;">
                    <div><b>VAL-906888</b><p style="font-size:0.8rem; color:var(--slate-500);">Reposición de Cable de Antena</p></div>
                    <span class="status-tag caution">EN REVISIÓN</span>
                </div>
            </div>
        `;
    },
    saveHistory() { localStorage.setItem('ab_chat_history', JSON.stringify(this.chatHistory.slice(-20))); }
};
document.addEventListener('DOMContentLoaded', () => { app.init(); window.app = app; });
