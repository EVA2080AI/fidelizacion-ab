const app = {
    apiKey: 'AIzaSyCNdm_eWA65yTRVnikOCMuG6-mwHRiwFAc',
    currentView: 'assistant',
    userName: localStorage.getItem('ab_user_name') || '',
    deviceModel: localStorage.getItem('ab_user_device') || 'Naída CI M90',
    userPoints: parseInt(localStorage.getItem('ab_user_points')) || 0,
    userTier: localStorage.getItem('ab_user_tier') || 'BRONCE',
    
    chatHistory: JSON.parse(localStorage.getItem('ab_chat_history')) || [],
    careState: JSON.parse(localStorage.getItem('ab_care_state')) || { tmic: false, cable: false, dryer: false, battery: false },
    lastCareDate: localStorage.getItem('ab_last_care_date') || '',
    activeQuotes: JSON.parse(localStorage.getItem('ab_active_quotes')) || [],

    init() {
        this.bindEvents();
        this.checkAuth();
        this.dailyResetEngine();
        this.updateLoyaltyUI();
        this.registerSW();
        console.log("AB Care Hub V10 Commercial Core Initialized");
    },

    registerSW() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log("PWA Service Worker Registered"))
                .catch(err => console.error("SW Registration Failed", err));
        }
    },

    dailyResetEngine() {
        const today = new Date().toLocaleDateString();
        if (this.lastCareDate && this.lastCareDate !== today) {
            this.careState = { tmic: false, cable: false, dryer: false, battery: false };
            localStorage.setItem('ab_care_state', JSON.stringify(this.careState));
            this.toast("Nuevo día: Checklist reiniciado", "success");
        }
        this.lastCareDate = today;
        localStorage.setItem('ab_last_care_date', today);
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
        if (!this.userName) { document.getElementById('login-screen').classList.add('active'); } 
        else { document.getElementById('login-screen').classList.remove('active'); setTimeout(() => this.checkOnboarding(), 500); }
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
    finishOnboarding() { document.getElementById('onboarding-overlay').classList.remove('active'); localStorage.setItem('ab_onboarding_completed', 'true'); this.toast("Motor Comercial Activado", "success"); },

    startBridge() {
        const splash = document.getElementById('bridge-splash');
        if(splash) {
            splash.style.display = 'flex';
            setTimeout(() => { splash.classList.add('active'); }, 10);
            setTimeout(() => { 
                splash.classList.remove('active'); 
                setTimeout(() => splash.style.display = 'none', 500);
                if (this.chatHistory.length === 0) this.sendGreeting(); 
            }, 2000);
        }
    },

    sendGreeting() {
        const greeting = `Hola ${this.userName}. He sincronizado tu perfil con HealtCloud. Tienes ${this.userPoints} puntos disponibles para canje en la Tienda. ¿Necesitas una cotización hoy?`;
        this.addMessageToUI(greeting, 'ai');
        this.chatHistory.push({ role: 'model', parts: [{ text: greeting }] });
        this.saveHistory();
    },

    toast(text, type = "success") {
        const container = document.getElementById('toast-container');
        if(!container) return;
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
            this.toast("Checklist completo: +50 Puntos", "success");
        }
        this.switchView('care');
    },

    switchView(viewId) {
        const activeView = document.querySelector('.view.active');
        if (activeView) activeView.classList.remove('active');
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-view') === viewId));
        const main = document.getElementById('main-content');
        const children = Array.from(main.children);
        children.forEach(c => { if(c.id !== 'receipt-upload' && !c.classList.contains('mobile-header')) c.remove(); });
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
            case 'store': content = this.getStoreHTML(); break;
            case 'benefits': content = this.getBenefitsHTML(); break;
            case 'care': content = this.getCareHTML(); break;
            case 'assistant': content = this.getAssistantHTML(); setTimeout(() => this.renderHistory(), 10); break;
            case 'profile': content = this.getProfileHTML(); break;
        }
        viewSection.innerHTML = content;
        main.appendChild(viewSection);
        if (window.lucide) lucide.createIcons();
    },

    getStoreHTML() {
        return `
            <div style="margin-bottom: 32px;"><h1>Tienda Hub</h1><p style="color:var(--slate-500);">Canjea tus puntos o solicita cotización oficial.</p></div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:24px;">
                <div class="ab-card shadow-premium" style="text-align:center;">
                    <div style="font-size:3rem; margin-bottom:12px;">🔋</div>
                    <h4>Baterías Power M</h4>
                    <p style="color:var(--slate-500); font-size:0.85rem; margin-bottom:16px;">Autonomía de 18 horas.</p>
                    <div style="font-weight:900; color:var(--primary); margin-bottom:16px;">800 PTS</div>
                    <button class="ab-btn ab-btn-primary" style="width:100%;" onclick="app.redeemItem('Batería', 800)">Canjear</button>
                </div>
                <div class="ab-card shadow-premium" style="text-align:center; border: 2px dashed var(--slate-200);">
                    <div style="font-size:3rem; margin-bottom:12px;">📡</div>
                    <h4>Antena Ultra 3D</h4>
                    <p style="color:var(--slate-500); font-size:0.85rem; margin-bottom:16px;">Repecto a medida.</p>
                    <button class="ab-btn" style="width:100%; border:1px solid var(--primary); color:var(--primary);" onclick="app.requestQuote('Antena Ultra 3D')">Solicitar Cotización</button>
                </div>
            </div>
            <div class="ab-card shadow-premium glass-effect" style="margin-top:32px; border-left:4px solid var(--primary);">
                <b>¿Ya pagaste una cotización?</b>
                <p style="font-size:0.85rem; color:var(--slate-500); margin-top:8px;">Envíanos tu comprobante para agilizar el despacho de tu repuesto.</p>
                <button class="ab-btn ab-btn-primary" style="margin-top:16px; padding:8px 20px; font-size:0.8rem;" onclick="document.getElementById('receipt-upload').click()">Subir Comprobante</button>
            </div>
        `;
    },

    redeemItem(name, cost) {
        if (this.userPoints < cost) { this.toast("Puntos insuficientes", "error"); return; }
        this.userPoints -= cost;
        this.updateLoyaltyUI();
        this.toast(`Canje exitoso: ${name}`, "success");
    },

    requestQuote(item) {
        const msg = `Danos un momento, ${this.userName}. Tu distribuidor enviará la cotización de "${item}" en breve. Por favor confírmanos si necesitas ayuda adicional.`;
        this.addMessageToUI(`Solicitud de cotización para: ${item}`, 'user');
        this.addMessageToUI(msg, 'ai');
        this.toast("Cotización solicitada", "success");
        this.chatHistory.push({ role: 'user', parts: [{ text: `Solicito cotización para ${item}` }] });
        this.chatHistory.push({ role: 'model', parts: [{ text: msg }] });
        this.saveHistory();
    },

    handleFileSelected(e) {
        const file = e.target.files[0];
        if (file) {
            this.toast("Comprobante recibido. Validando...", "success");
            setTimeout(() => {
                const msg = "Comprobante de pago recibido correctamente. Estamos validando la transacción con el departamento financiero.";
                this.addMessageToUI(msg, 'ai');
                this.addMessageToUI(`Archivo enviado: ${file.name}`, 'user');
            }, 1500);
        }
    },

    getAssistantHTML() {
        return `
            <div style="margin-bottom: 32px;"><h1>Melody V10</h1><p style="color:var(--slate-500);">Soporte técnico y comercial avanzado.</p></div>
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
                        <input type="text" id="ai-input" placeholder="Consultar sobre RMA o Cotizaciones..." class="ab-input" onkeypress="if(event.key==='Enter')app.sendMessage()">
                        <button onclick="app.sendMessage()" class="ab-btn ab-btn-primary" style="padding:12px 24px;">Enviar</button>
                    </div>
                </div>
            </div>
            <div style="margin-top:24px; display:flex; gap:12px; flex-wrap:wrap;">
                <button class="ab-card glass-effect" style="padding:10px 18px; font-size:0.85rem; font-weight:700;" onclick="app.quickQuery('¿Status de mi caso VAL?')">🔎 Status VAL</button>
                <button class="ab-card glass-effect" style="padding:10px 18px; font-size:0.85rem; font-weight:700;" onclick="app.switchView('store')">🛒 Ir a la Tienda</button>
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
        const payload = { system_instruction: { parts: [{ text: `Expert Melody V10 at AB. Support both technical (RMA) and commercial (quotes). Logic from doc: "Tu distribuidor enviará la cotización". User: ${this.userName}, Tier: ${this.userTier}.` }] }, contents: this.chatHistory.slice(-10) };
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    },

    getHomeHTML() {
        return `
            <div style="margin-bottom:32px;"><h1>Entorno V10</h1><p style="color:var(--slate-500);">Monitor de salud y comercial.</p></div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:24px;">
                <div class="ab-card glass-effect shadow-premium">
                    <span class="ab-badge caution">ESPERANDO COTIZACIÓN</span>
                    <h3 style="margin-top:16px;">Orden #COT8291</h3>
                    <p style="margin-top:12px; font-size:0.85rem; color:var(--slate-500);">Batería Marvel solicitada. Revisión por distribuidor pendiente.</p>
                </div>
                <div class="ab-card glass-effect shadow-premium">
                    <i data-lucide="shield-check" style="color:var(--success); margin-bottom:12px;"></i>
                    <h3>Cumplimiento</h3>
                    <p style="margin-top:12px; font-size:3rem; font-weight:900; color:var(--primary);">85 <small style="font-size:1rem; color:var(--slate-400);">%</small></p>
                </div>
            </div>
        `;
    },

    getBenefitsHTML() {
        return `
            <div style="margin-bottom:32px;"><h1>Fidelidad</h1><p style="color:var(--slate-500);">Puntos disponibles: ${this.userPoints}</p></div>
            <div class="ab-card shadow-premium" style="background:var(--blue-50); border:none;">
                <h4 style="color:var(--primary);">Tu Próximo Nivel: PLATINO</h4>
                <div style="height:8px; background:rgba(0,0,0,0.05); border-radius:4px; margin-top:12px; overflow:hidden;">
                    <div style="width:70%; height:100%; background:var(--primary);"></div>
                </div>
                <p style="margin-top:12px; font-size:0.8rem;">Te faltan 300 puntos para duplicar tus beneficios de envío gratis.</p>
            </div>
        `;
    },

    getCareHTML() {
        return `
            <div style="margin-bottom:32px;"><h1>Mantenimiento</h1><p style="color:var(--slate-500);">Checklist diario preventivo.</p></div>
            <div style="display:grid; gap:16px;">
                <div class="checklist-item shadow-premium ${this.careState.tmic?'completed':''}" onclick="app.toggleCareTask('tmic')"><b>Micrófonos</b><p style="font-size:0.8rem; color:var(--slate-500);">Limpiar rejillas de entrada.</p></div>
                <div class="checklist-item shadow-premium ${this.careState.cable?'completed':''}" onclick="app.toggleCareTask('cable')"><b>Antena/Cable</b><p style="font-size:0.8rem; color:var(--slate-500);">Sin daños visibles.</p></div>
                <div class="checklist-item shadow-premium ${this.careState.dryer?'completed':''}" onclick="app.toggleCareTask('dryer')"><b>Deshumidificador</b><p style="font-size:0.8rem; color:var(--slate-500);">Ciclo nocturno completado.</p></div>
                <div class="checklist-item shadow-premium ${this.careState.battery?'completed':''}" onclick="app.toggleCareTask('battery')"><b>Carga</b><p style="font-size:0.8rem; color:var(--slate-500);">Batería principal al 100%.</p></div>
            </div>
        `;
    },

    getProfileHTML() {
        return `
            <div style="margin-bottom:32px;"><h1>Perfil Plus</h1><p style="color:var(--slate-500);">Auditoría técnica.</p></div>
            <div class="ab-card shadow-premium" style="margin-bottom:24px;"><h1>${this.userName}</h1><p>${this.deviceModel} | ID: AB-81726</p></div>
            <button class="ab-btn" style="width:100%; border:1px solid var(--danger); color:var(--danger);" onclick="app.logout()">Cerrar Sesión Segura</button>
        `;
    },
    saveHistory() { localStorage.setItem('ab_chat_history', JSON.stringify(this.chatHistory.slice(-20))); },
    quickQuery(t){ const i = document.getElementById('ai-input'); if(i){i.value=t; this.sendMessage();} }
};
document.addEventListener('DOMContentLoaded', () => { app.init(); window.app = app; });
