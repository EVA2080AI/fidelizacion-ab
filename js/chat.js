/* ============================================================
   AB HUB+ AI Chat Sidebar
   Powered by Gemini - Context-aware by role & country
   ============================================================ */
window.AB = window.AB || {};

AB.Chat = {
    apiKey: 'AIzaSyCNdm_eWA65yTRVnikOCMuG6-mwHRiwFAc',
    history: [],
    isTyping: false,

    init() {
        this.history = JSON.parse(localStorage.getItem('ab_chat_history')) || [];
        this.renderMessages();
        this.renderQuickActions();
    },

    getSystemPrompt() {
        const user = AB.Auth.currentUser;
        if (!user) return '';

        const country = AB.DB.getById('countries', user.country_code) || { name: user.country_code };
        const providers = AB.DB.getProvidersByCountry(user.country_code);
        const products = AB.DB.getAll('products');

        const providerInfo = providers.map(p =>
            `- ${p.name} (${p.type}): ${p.address}, Tel: ${p.phone}, Email: ${p.email}`
        ).join('\n');

        const productInfo = products.map(p =>
            `- ${p.name} (${p.model}): ${p.description}${p.price ? ' - $' + p.price : ''}`
        ).join('\n');

        return `Eres Melody, la asistente virtual de Advanced Bionics para el programa de fidelizacion AB HUB+.

CONTEXTO DEL USUARIO:
- Nombre: ${user.name}
- Rol: ${AB.Auth.getRoleLabel(user.role)}
- Pais: ${country.name}
- Puntos de fidelidad: ${user.points || 0}

PROVEEDORES EN ${country.name}:
${providerInfo || 'No hay proveedores registrados en este pais.'}

CATALOGO DE PRODUCTOS ADVANCED BIONICS:
${productInfo}

INSTRUCCIONES:
- Responde siempre en espanol, de forma clara y profesional.
- Si el usuario es CLIENTE: ayuda con cuidado del dispositivo, garantias, checklist, tutoriales, beneficios del programa, PQRs.
- Si es DISTRIBUIDOR: ayuda con inventario, procesos de garantia, tracking de solicitudes.
- Si es ADMIN/SUPERADMIN: ayuda con gestion de datos, reportes, campanas.
- Si es ESPECIALISTA: ayuda con informacion clinica, configuraciones de procesadores, recursos.
- Proporciona informacion especifica del proveedor/distribuidor de su pais cuando sea relevante.
- Mantente dentro del ambito de productos y servicios de Advanced Bionics.
- Se amable pero conciso. Usa formato corto y directo.
- Si no sabes algo, sugiere contactar al distribuidor local o soporte tecnico.`;
    },

    async sendMessage(text) {
        if (!text.trim() || this.isTyping) return;

        // Add user message
        this.addMessage('user', text);
        this.setTyping(true);

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: this.getSystemPrompt() }] },
                        contents: this.history.slice(-10).map(m => ({
                            role: m.role === 'user' ? 'user' : 'model',
                            parts: [{ text: m.text }]
                        })),
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 500,
                            topP: 0.9
                        }
                    })
                }
            );

            const data = await response.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Lo siento, no pude procesar tu consulta. Intenta de nuevo.';
            this.addMessage('bot', reply);
        } catch (err) {
            this.addMessage('bot', 'Error de conexion. Verifica tu internet e intenta de nuevo.');
        }

        this.setTyping(false);
    },

    addMessage(role, text) {
        const msg = { role, text, time: new Date().toISOString() };
        this.history.push(msg);
        localStorage.setItem('ab_chat_history', JSON.stringify(this.history.slice(-50)));
        this.renderMessages();
    },

    setTyping(typing) {
        this.isTyping = typing;
        const el = document.getElementById('chat-typing');
        if (el) el.classList.toggle('active', typing);
    },

    renderMessages() {
        const container = document.getElementById('chat-messages');
        if (!container) return;

        if (this.history.length === 0) {
            const user = AB.Auth.currentUser;
            const greeting = user ? `Hola ${user.name.split(' ')[0]}! Soy Melody, tu asistente de Advanced Bionics. ¿En que puedo ayudarte hoy?` : 'Bienvenido a AB HUB+. Inicia sesion para comenzar.';
            container.innerHTML = `<div class="chat-msg bot"><p>${greeting}</p></div>`;
            return;
        }

        container.innerHTML = this.history.map(m => `
            <div class="chat-msg ${m.role === 'user' ? 'user' : 'bot'}">
                <p>${this.formatMessage(m.text)}</p>
                <div class="msg-time">${this.formatTime(m.time)}</div>
            </div>
        `).join('');

        container.scrollTop = container.scrollHeight;
    },

    formatMessage(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    },

    formatTime(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    },

    renderQuickActions() {
        const container = document.getElementById('chat-quick-actions');
        if (!container) return;

        const role = AB.Auth.getRole();
        const actions = {
            cliente: ['Mi garantia', 'Checklist del dia', 'Mis puntos', 'Soporte tecnico'],
            distribuidor: ['Estado inventario', 'Nueva garantia', 'Tracking', 'Contacto AB'],
            admin: ['Resumen general', 'Usuarios activos', 'PQRs pendientes'],
            superadmin: ['Dashboard', 'Campanas activas', 'Metricas'],
            especialista: ['Mis pacientes', 'Guias clinicas', 'Recursos']
        };

        const roleActions = actions[role] || actions.cliente;
        container.innerHTML = roleActions.map(a =>
            `<button class="chat-quick-btn" onclick="AB.Chat.sendMessage('${a}')">${a}</button>`
        ).join('');
    },

    clearHistory() {
        this.history = [];
        localStorage.removeItem('ab_chat_history');
        this.renderMessages();
    }
};
