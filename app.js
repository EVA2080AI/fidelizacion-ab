const app = {
    apiKey: 'AIzaSyCNdm_eWA65yTRVnikOCMuG6-mwHRiwFAc',
    currentUser: JSON.parse(localStorage.getItem('ab_enterprise_user')) || null,
    chatHistory: JSON.parse(localStorage.getItem('ab_chat_history_v11')) || [],
    userPoints: parseInt(localStorage.getItem('ab_user_points')) || 850,
    careState: JSON.parse(localStorage.getItem('ab_care_state')) || { tmic: false, cable: false, dryer: false, battery: false },

    init() {
        this.bindEvents();
        this.checkAuth();
        this.registerSW();
        console.log("AB Pro UI Kit V16 Online");
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
        if (!this.currentUser) { loginScreen.classList.add('active'); appShell.style.display = 'none'; } 
        else { loginScreen.classList.remove('active'); appShell.style.display = 'flex'; this.setupHeader(); this.switchView('home'); this.renderHistorySidebar(); }
    },

    login() {
        const nameInput = document.getElementById('login-name');
        const name = nameInput.value.trim();
        const role = document.getElementById('login-role').value;
        const country = document.getElementById('login-country').value;
        
        if (!name) { 
            nameInput.classList.add('error');
            this.toast("Se requiere nombre completo para acceso clínico", "error"); 
            return; 
        }
        
        nameInput.classList.remove('error');
        nameInput.classList.add('success');
        
        setTimeout(() => {
            this.currentUser = { name, role, country, id: 'USR-' + Math.floor(Math.random()*1000) };
            localStorage.setItem('ab_enterprise_user', JSON.stringify(this.currentUser));
            this.checkAuth();
            this.toast(`Acceso Autorizado: ${name}`, "success");
        }, 500);
    },

    logout() { localStorage.clear(); location.reload(); },

    setupHeader() {
        document.getElementById('header-user-name').innerText = this.currentUser.name;
        document.getElementById('current-country-badge').innerText = this.currentUser.country;
        document.getElementById('current-role-badge').innerText = this.currentUser.role;
        document.querySelector('.user-avatar').innerText = this.currentUser.name[0];
    },

    // V16 Toast Manager (Stacked)
    toast(text, type = "success") {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `ab-toast ${type}`;
        const icons = { success: 'check-circle', error: 'alert-circle', warning: 'bell' };
        toast.innerHTML = `<i data-lucide="${icons[type]}"></i> <div><b>${type.toUpperCase()}</b><p style="margin:0; font-size:0.8rem;">${text}</p></div>`;
        
        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    },

    switchView(viewId) {
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-view') === viewId));
        this.renderRoleView(viewId);
    },

    renderRoleView(viewId) {
        const main = document.getElementById('main-content');
        main.innerHTML = this.getSkeletonHTML(); // Shimmering state
        
        setTimeout(() => {
            main.innerHTML = '';
            const section = document.createElement('div');
            section.id = `view-${viewId}`;
            section.className = 'view active';
            
            switch(viewId) {
                case 'home': section.innerHTML = this.getHomeHTML(); break;
                case 'tools': section.innerHTML = this.getToolsHTML(); break;
                case 'store': section.innerHTML = `<div class='ab-card'><h1>Tienda Oficial</h1></div>`; break;
                case 'profile': section.innerHTML = `<div class='ab-card'><h1>Perfil</h1><button onclick='app.logout()' class='ab-btn' style='color:var(--danger)'>Cerrar Sesión</button></div>`; break;
            }
            
            main.appendChild(section);
            if (window.lucide) lucide.createIcons();
        }, 400);
    },

    getSkeletonHTML() {
        return `
            <div class="ab-skeleton heading shimmer"></div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-top:32px;">
                <div class="ab-card shimmer" style="height:200px; background:none;"></div>
                <div class="ab-card shimmer" style="height:200px; background:none;"></div>
            </div>
        `;
    },

    getToolsHTML() {
        return `
            <div style="margin-bottom:32px;"><h1>Component UI Kit V16</h1><p style="color:var(--slate-500);">Librería estandarizada de Advance Bionics.</p></div>
            
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap:32px;">
                <!-- Inputs Section -->
                <div class="ab-card shadow-premium">
                    <h4 style="margin-bottom:24px;">FORM FIELDS</h4>
                    <div class="ab-field">
                        <label>Normal State</label>
                        <input type="text" class="ab-input" placeholder="Escribe aquí...">
                    </div>
                    <div class="ab-field">
                        <label>Focus / Valid State</label>
                        <input type="text" class="ab-input success" value="Valor válido">
                        <p class="field-hint" style="color:var(--success);">Check clínico completado.</p>
                    </div>
                    <div class="ab-field">
                        <label>Error State</label>
                        <input type="text" class="ab-input error" value="Error de sistema">
                        <p class="field-hint error">Este campo es obligatorio.</p>
                    </div>
                </div>

                <!-- Toggles Section -->
                <div class="ab-card shadow-premium">
                    <h4 style="margin-bottom:24px;">SWITCHES & TOGGLES</h4>
                    <div style="display:flex; flex-direction:column; gap:20px;">
                        <label class="ab-switch">
                            <input type="checkbox" style="display:none;" onchange="app.toast('Modo Nocturno Alterado', 'warning')">
                            <div class="switch-track"><div class="switch-knob"></div></div>
                            <span style="font-weight:700; font-size:0.9rem;">Notificaciones Push</span>
                        </label>
                        <label class="ab-switch">
                            <input type="checkbox" checked style="display:none;">
                            <div class="switch-track"><div class="switch-knob"></div></div>
                            <span style="font-weight:700; font-size:0.9rem;">Sincronización Cloud</span>
                        </label>
                    </div>
                </div>

                <!-- Notif Section -->
                <div class="ab-card shadow-premium">
                    <h4 style="margin-bottom:24px;">NOTIFICATION SUITE</h4>
                    <button class="ab-btn ab-btn-primary" style="width:100%; margin-bottom:12px;" onclick="app.toast('¡Nueva Alerta Clínica!', 'success')">Lanzar Toast</button>
                    <button class="ab-btn" style="width:100%; border:1px solid var(--slate-200);" onclick="app.toast('Error de conexión', 'error')">Lanzar Error</button>
                    
                    <div style="margin-top:24px;">
                        <span class="text-caps">Push Notification Style</span>
                        <div class="ab-push-notif" style="margin-top:12px; position:static; animation:none;">
                            <div class="push-icon"><i data-lucide="bell"></i></div>
                            <div><b style="font-size:0.85rem;">Melody</b><p style="margin:0; font-size:0.75rem;">Tu checklist técnico expira en 5 min.</p></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    getHomeHTML() {
        return `
            <div style="margin-bottom:32px;"><h1>Resumen de Gestión</h1><p>Bienvenido al Centro de Control V16.</p></div>
            <div class="ab-card shadow-premium">
                <h4 style="margin-bottom:20px;">ESTADO DE SALUD DEL HUB</h4>
                <div style="display:flex; gap:24px; align-items:center;">
                    <div class="ab-skeleton circle shimmer"></div>
                    <div style="flex:1;">
                        <div class="ab-skeleton heading shimmer"></div>
                        <div class="ab-skeleton shimmer" style="width:80%;"></div>
                    </div>
                </div>
            </div>
        `;
    },

    sendMessageSidebar() {
        const input = document.getElementById('sidebar-ai-input');
        const text = input.value.trim();
        if (!text) return;
        this.addMessageToSidebar(text, 'user');
        this.chatHistory.push({ role: 'user', parts: [{ text }] });
        input.value = '';
        this.callGeminiPro();
    },

    async callGeminiPro() {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
        const payload = { 
            system_instruction: { parts: [{ text: `Clinical Design System Specialist. Role: ${this.currentUser.role}. Assist with V16 UI Kit maintenance.` }] },
            contents: this.chatHistory.slice(-10)
        };
        try {
            const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await resp.json();
            const text = data.candidates[0].content.parts[0].text;
            this.addMessageToSidebar(text, 'ai');
            this.chatHistory.push({ role: 'model', parts: [{ text }] });
        } catch (e) { this.toast("Melody offline", "error"); }
    },

    addMessageToSidebar(text, type) {
        const chat = document.getElementById('sidebar-chat-messages');
        const msg = document.createElement('div');
        msg.className = `message-wrapper ${type}`;
        msg.innerHTML = `<div class="message" style="padding:12px 16px; font-size:0.85rem; border-radius:var(--radius-md); ${type === 'user' ? 'background:var(--primary); color:white; align-self:flex-end;' : 'background:var(--bg-light);'}"><span>${text}</span></div>`;
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
