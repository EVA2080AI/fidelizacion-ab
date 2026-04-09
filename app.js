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
        console.log("AB Care Hub V8 Design System Installed");
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
        if (!this.userName) {
            document.getElementById('login-screen').classList.add('active');
        } else {
            document.getElementById('login-screen').classList.remove('active');
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
        setTimeout(() => { 
            this.startBridge(); 
            this.checkOnboarding(); 
            this.updateLoyaltyUI(); 
            this.switchView('assistant'); 
        }, 500);
    },

    logout() { localStorage.clear(); location.reload(); },
    checkOnboarding() { if (!localStorage.getItem('ab_onboarding_completed')) document.getElementById('onboarding-overlay').classList.add('active'); },
    finishOnboarding() { 
        document.getElementById('onboarding-overlay').classList.remove('active'); 
        localStorage.setItem('ab_onboarding_completed', 'true'); 
        this.toast("Diseño V8 Activado", "success"); 
    },

    startBridge() {
        const splash = document.getElementById('bridge-splash');
        splash.style.display = 'flex';
        setTimeout(() => { splash.classList.add('active'); }, 10);
        setTimeout(() => { 
            splash.classList.remove('active'); 
            setTimeout(() => splash.style.display = 'none', 500);
            if (this.chatHistory.length === 0) this.sendGreeting(); 
        }, 2000);
    },

    sendGreeting() {
        const greeting = `Hola ${this.userName}, Centro de Mando Plus V8 activado. ¿Cómo va tu audición hoy con tu ${this.deviceModel}?`;
        this.addMessageToUI(greeting, 'ai');
        this.chatHistory.push({ role: 'model', parts: [{ text: greeting }] });
        this.saveHistory();
    },

    toast(text, type = "success") {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `ab-toast glass-effect ${type}`;
        const icon = type === 'success' ? 'check-circle' : 'alert-circle';
        toast.innerHTML = `<i data-lucide="${icon}"></i> <span>${text}</span>`;
        container.appendChild(toast);
        lucide.createIcons();
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(-20px)'; setTimeout(() => toast.remove(), 500); }, 3000);
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
        if (progressFill) progressFill.style.width = `${Math.min((this.userPoints / 1000) * 100, 100)}%`;
        
        const mobileTier = document.getElementById('mobile-tier');
        if (mobileTier) mobileTier.innerText = this.userTier;
    },

    toggleCareTask(taskId) {
        this.careState[taskId] = !this.careState[taskId];
        localStorage.setItem('ab_care_state', JSON.stringify(this.careState));
        if (Object.values(this.careState).filter(v => v).length === 4) { 
            this.userPoints += 50; 
            localStorage.setItem('ab_user_points', this.userPoints);
            this.updateLoyaltyUI();
            this.toast("+50 Puntos de Cuidado", "success");
        }
        this.switchView('care');
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
        setTimeout(() => { document.getElementById(`view-${viewId}`)?.classList.add('active'); }, 50);
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
            <div style="margin-bottom: 32px;"><h1>Melody V8</h1><p style="color:var(--slate-500);">Diseño de sistema clínico activado.</p></div>
            <div class="assistant-layout">
                <div class="assistant-sidebar desktop-only">
                    <div class="ab-card glass-effect shadow-premium">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;"><span class="status-dot"></span><small style="font-weight:900; color:var(--success);">ONLINE</small></div>
                        <h3 style="font-weight:900;">${this.userName}</h3>
                        <p style="color:var(--slate-500); font-size:0.85rem;">${this.deviceModel}</p>
                    </div>
                </div>
                <div class="chat-container ab-card glass-effect shadow-premium" style="padding:0;">
                    <div id="chat-messages"></div>
                    <div style="padding:20px 32px; border-top:1px solid var(--slate-100); display:flex; gap:12px;">
                        <input type="text" id="ai-input" placeholder="Mensaje para Melody..." class="ab-input" onkeypress="if(event.key==='Enter')app.sendMessage()">
                        <button onclick="app.sendMessage()" class="ab-btn ab-btn-primary" style="padding:12px 24px;">Enviar</button>
                    </div>
                </div>
            </div>
            <div style="margin-top:24px; display:flex; gap:12px; flex-wrap:wrap;">
                <button class="ab-card glass-effect" style="padding:10px 18px; font-size:0.85rem; font-weight:700;" onclick="app.quickQuery('¿Status de mi caso VAL?')">🔎 Status VAL</button>
                <button class="ab-card glass-effect" style="padding:10px 18px; font-size:0.85rem; font-weight:700;" onclick="window.open('https://forms.kommo.com/rdrvrxx', '_blank')">📦 RMA Kommo</button>
            </div>
        `;
    },

    renderHistory() {
        const chat = document.getElementById('chat-messages');
        if (!chat) return;
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
        try { const r = await this.callGemini(); this.addMessageToUI(r, 'ai'); this.chatHistory.push({ role: 'model', parts: [{ text:r }] }); this.saveHistory(); } catch (e) { this.toast("Error Melody","error"); }
    },

    addMessageToUI(text, type) {
        const chat = document.getElementById('chat-messages');
        if (!chat) return;
        const msg = document.createElement('div');
        msg.className = `message-wrapper ${type}`;
        msg.innerHTML = `${type === 'ai' ? '<div class="avatar">M</div>' : ''}<div class="message ab-card" style="padding:12px 18px; border-radius:20px; font-size:0.95rem; border:none; ${type === 'user' ? 'background:var(--primary); color:white;' : 'background:var(--slate-100);'}"><span>${text}</span></div>`;
        chat.appendChild(msg);
        chat.scrollTop = chat.scrollHeight;
    },

    async callGemini() {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
        const payload = { system_instruction: { parts: [{ text: `Melody expert V8. User: ${this.userName}, Tier: ${this.userTier}.` }] }, contents: this.chatHistory.slice(-10) };
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    },

    getHomeHTML() {
        return `
            <div style="margin-bottom:32px;"><h1>Entorno V8</h1><p style="color:var(--slate-500);">Monitor de garantía Pro.</p></div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:24px;">
                <div class="ab-card glass-effect shadow-premium">
                    <span class="ab-badge caution">EN REVISIÓN</span>
                    <h3 style="margin-top:16px;">Caso VAL-906888</h3>
                    <p style="margin-top:12px; font-size:0.85rem; color:var(--slate-500);">Falta validación de fotos del hardware.</p>
                </div>
                <div class="ab-card glass-effect shadow-premium">
                    <i data-lucide="shield-check" style="color:var(--success); margin-bottom:12px;"></i>
                    <h3>Garantía Activa</h3>
                    <p style="margin-top:12px; font-size:3rem; font-weight:900; color:var(--primary);">321 <small style="font-size:1rem; color:var(--slate-400);">DÍAS</small></p>
                </div>
            </div>
        `;
    },

    getBenefitsHTML() {
        return `
            <div style="margin-bottom:32px;"><h1>Premios Hub</h1><p style="color:var(--slate-500);">Fidelización premium AB.</p></div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:20px;">
                <div class="ab-card glass-effect shadow-premium" style="border-top:4px solid var(--warning);">
                    <h4>AB Colegio</h4>
                    <p style="margin-top:8px; font-size:0.8rem; color:var(--slate-500);">Acceso ilimitado a videos Marvel.</p>
                    <button class="ab-btn ab-btn-primary" style="margin-top:16px; font-size:0.75rem; width:100%;">Acceder</button>
                </div>
                <div class="ab-card glass-effect shadow-premium" style="border-top:4px solid var(--primary);">
                    <h4>Laboratorio VIP</h4>
                    <p style="margin-top:8px; font-size:0.8rem; color:var(--slate-500);">Prioridad de reparación para ${this.userTier}.</p>
                </div>
            </div>
        `;
    },

    getCareHTML() {
        return `
            <div style="margin-bottom:32px;"><h1>Técnico Pro</h1><p style="color:var(--slate-500);">Mantenimiento preventivo Marvel.</p></div>
            <div style="display:grid; gap:16px;">
                <div class="checklist-item shadow-premium ${this.careState.tmic?'completed':''}" onclick="app.toggleCareTask('tmic')"><b>Limpieza T-Mic</b><p style="font-size:0.8rem; color:var(--slate-500);">Cerumen y suciedad externa.</p></div>
                <div class="checklist-item shadow-premium ${this.careState.cable?'completed':''}" onclick="app.toggleCareTask('cable')"><b>Cable Ultra 3D</b><p style="font-size:0.8rem; color:var(--slate-500);">Integridad visual del cable.</p></div>
                <div class="checklist-item shadow-premium ${this.careState.dryer?'completed':''}" onclick="app.toggleCareTask('dryer')"><b>Deshumidificación</b><p style="font-size:0.8rem; color:var(--slate-500);">Ciclo de 4 horas activo.</p></div>
                <div class="checklist-item shadow-premium ${this.careState.battery?'completed':''}" onclick="app.toggleCareTask('battery')"><b>Contactos</b><p style="font-size:0.8rem; color:var(--slate-500);">Limpieza de polos dorados.</p></div>
            </div>
        `;
    },

    getProfileHTML() {
        return `
            <div style="margin-bottom:32px;"><h1>Perfil Plus</h1><p style="color:var(--slate-500);">Sincronizado con Health Cloud.</p></div>
            <div class="ab-card shadow-premium" style="margin-bottom:24px;"><h1>${this.userName}</h1><p>${this.deviceModel} | ${this.userTier}</p></div>
            <div class="ab-card shadow-premium glass-effect" style="border-left:4px solid var(--success);"><b>Historial Médico</b><p style="font-size:0.8rem; margin-top:4px;">Última sincronización: Hoy 14:40</p></div>
        `;
    },
    saveHistory() { localStorage.setItem('ab_chat_history', JSON.stringify(this.chatHistory.slice(-20))); },
    quickQuery(t){ const i = document.getElementById('ai-input'); if(i){i.value=t; this.sendMessage();} }
};

document.addEventListener('DOMContentLoaded', () => { app.init(); window.app = app; });
