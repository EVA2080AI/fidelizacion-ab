/* ============================================================
   AB HUB+ Main Application Orchestrator
   ============================================================ */
window.AB = window.AB || {};

// --- Global Actions ---
AB.Actions = {
    // Auth
    async logout() {
        await AB.Auth.logout();
        AB.Chat.clearHistory();
        location.reload();
    },

    saveProfile() {
        const name = document.getElementById('profile-name')?.value;
        const email = document.getElementById('profile-email')?.value;
        const phone = document.getElementById('profile-phone')?.value;
        const company = document.getElementById('profile-company')?.value;
        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (phone) updates.phone = phone;
        if (company) updates.company = company;
        AB.Auth.updateProfile(updates);
        AB.App.toast('Perfil actualizado', 'success');
        AB.App.updateHeader();
    },

    // Checklist
    toggleChecklist(id) {
        const user = AB.Auth.currentUser;
        const devices = AB.DB.getDevicesByUser(user.id);
        const deviceId = devices[0]?.id || null;

        const today = new Date().toISOString().split('T')[0];
        const existing = AB.DB.query('checklist_completions',
            c => c.user_id === user.id && c.checklist_id === id && c.completed_at?.startsWith(today)
        );
        if (existing.length > 0) {
            AB.App.toast('Ya completaste este item hoy', 'info');
            return;
        }

        const result = AB.DB.completeChecklist(user.id, id, deviceId);
        if (result) {
            AB.Auth.refreshUser();
            AB.App.toast(`+${result.points_earned} puntos ganados`, 'success');

            // Check if all checklist items are done
            const checklist = AB.DB.getTodayChecklist(user.id);
            if (checklist.every(c => c.completed)) {
                // Bonus points for completing all
                AB.DB.update('users', user.id, { points: (AB.Auth.currentUser.points || 0) + 50 });
                AB.Auth.refreshUser();
                AB.App.toast('Checklist completo! +50 puntos bonus', 'success');
            }

            AB.Router.renderView('checklist');
        }
    },

    // Tutorials
    watchTutorial(id) {
        const tutorial = AB.DB.getById('tutorials', id);
        if (!tutorial) return;

        // Open video in modal
        AB.App.showModal(tutorial.title, `
            <div style="background:var(--gray-900); border-radius:var(--radius-md); height:300px; display:flex; align-items:center; justify-content:center; margin-bottom:var(--sp-4);">
                <a href="${tutorial.video_url}" target="_blank" style="color:#fff; text-decoration:none; text-align:center;">
                    <i data-lucide="play-circle" style="width:64px; height:64px; margin-bottom:var(--sp-3);"></i>
                    <p>Abrir Video</p>
                </a>
            </div>
            <p>${tutorial.description}</p>
            <p class="text-sm text-muted" style="margin-top:var(--sp-2);">Duracion: ${tutorial.duration} minutos | +${tutorial.points} puntos</p>
            <button class="btn btn-primary btn-block" style="margin-top:var(--sp-4);" onclick="AB.Actions.completeTutorial('${id}')">
                Marcar como completado (+${tutorial.points} pts)
            </button>
        `);
    },

    completeTutorial(id) {
        const result = AB.DB.completeTutorial(AB.Auth.getUserId(), id);
        if (result) {
            AB.Auth.refreshUser();
            AB.App.toast(`Tutorial completado! +${result.points_earned} puntos`, 'success');
            AB.App.closeModal();
            AB.Router.renderView(AB.Router.currentView);
        }
    },

    // PQR
    newPQR() {
        AB.App.showModal('Nueva PQR', `
            <div class="form-group" style="margin-bottom:var(--sp-4);">
                <label class="form-label">Tipo</label>
                <select class="form-select" id="pqr-type">
                    <option value="peticion">Peticion</option>
                    <option value="queja">Queja</option>
                    <option value="reclamo">Reclamo</option>
                    <option value="sugerencia">Sugerencia</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom:var(--sp-4);">
                <label class="form-label">Asunto</label>
                <input type="text" class="form-input" id="pqr-subject" placeholder="Asunto de tu solicitud">
            </div>
            <div class="form-group" style="margin-bottom:var(--sp-4);">
                <label class="form-label">Descripcion</label>
                <textarea class="form-textarea" id="pqr-description" placeholder="Describe tu solicitud..."></textarea>
            </div>
            <button class="btn btn-primary btn-block" onclick="AB.Actions.submitPQR()">Enviar PQR</button>
        `);
    },

    submitPQR() {
        const type = document.getElementById('pqr-type')?.value;
        const subject = document.getElementById('pqr-subject')?.value;
        const description = document.getElementById('pqr-description')?.value;
        if (!subject || !description) { AB.App.toast('Completa todos los campos', 'error'); return; }

        AB.DB.insert('pqrs', {
            tracking_id: AB.DB.generateTrackingId('PQR'),
            user_id: AB.Auth.getUserId(),
            type, subject, description,
            status: 'open', priority: 'medium',
            country_code: AB.Auth.getCountry()
        });
        AB.App.toast('PQR creada exitosamente', 'success');
        AB.App.closeModal();
        AB.Router.renderView('pqrs');
    },

    // Accessories
    requestAccessory(id) {
        const product = AB.DB.getById('products', id);
        if (!product) return;
        AB.DB.insert('accessory_requests', {
            user_id: AB.Auth.getUserId(),
            product_id: id, quantity: 1, status: 'pending',
            country_code: AB.Auth.getCountry()
        });
        AB.App.toast(`Solicitud de ${product.name} enviada`, 'success');
    },

    // Benefits
    redeemBenefit(id) {
        const benefit = AB.DB.getById('benefits', id);
        const user = AB.Auth.currentUser;
        if (!benefit || (user.points || 0) < benefit.points_required) {
            AB.App.toast('Puntos insuficientes', 'error'); return;
        }
        AB.DB.insert('benefit_redemptions', {
            user_id: user.id, benefit_id: id,
            points_spent: benefit.points_required, status: 'pending'
        });
        AB.DB.update('users', user.id, { points: (user.points || 0) - benefit.points_required });
        AB.Auth.refreshUser();
        AB.App.toast(`${benefit.name} canjeado!`, 'success');
        AB.Router.renderView('benefits');
    },

    // Warranty Claims (Distributor)
    submitWarrantyClaim() {
        const clientName = document.getElementById('claim-client-name')?.value;
        const clientEmail = document.getElementById('claim-client-email')?.value;
        const serial = document.getElementById('claim-serial')?.value;
        const model = document.getElementById('claim-model')?.value;
        const description = document.getElementById('claim-description')?.value;

        if (!clientName || !serial || !model || !description) {
            AB.App.toast('Completa todos los campos obligatorios', 'error'); return;
        }

        const trackingId = AB.DB.generateTrackingId('WC');
        const claim = AB.DB.insert('warranty_claims', {
            tracking_id: trackingId,
            distributor_id: AB.Auth.getUserId(),
            client_name: clientName, client_email: clientEmail,
            device_serial: serial, device_model: model,
            issue_description: description,
            status: 'pending',
            country_code: AB.Auth.getCountry()
        });

        // Add initial status history
        AB.DB.insert('claim_status_history', {
            claim_id: claim.id, status: 'pending', notes: 'Solicitud recibida'
        });

        // Simulate AI review after 2s
        setTimeout(() => {
            AB.DB.update('warranty_claims', claim.id, { status: 'ai_reviewing' });
            AB.DB.insert('claim_status_history', {
                claim_id: claim.id, status: 'ai_reviewing', notes: 'IA analizando informacion del dispositivo'
            });

            // AI "completes" after 3s
            setTimeout(() => {
                const diagnosis = `Analisis automatico: El problema descrito ("${description.substring(0, 50)}...") es consistente con desgaste normal del componente. Recomendacion: revision en centro de servicio autorizado. Probabilidad de cobertura por garantia: 85%.`;
                AB.DB.update('warranty_claims', claim.id, {
                    status: 'under_review', ai_diagnosis: diagnosis, ai_confidence: 0.85
                });
                AB.DB.insert('claim_status_history', {
                    claim_id: claim.id, status: 'under_review',
                    notes: 'Diagnostico IA completado - En revision por equipo tecnico'
                });
            }, 3000);
        }, 2000);

        AB.App.toast(`Solicitud ${trackingId} creada`, 'success');
        AB.Router.navigate('tracking');
    },

    // Admin - Update claim status
    updateClaimStatus(claimId, newStatus) {
        AB.DB.update('warranty_claims', claimId, { status: newStatus });
        AB.DB.insert('claim_status_history', {
            claim_id: claimId, status: newStatus,
            notes: `Estado actualizado a: ${newStatus}`,
            changed_by: AB.Auth.getUserId()
        });
        AB.App.toast('Estado actualizado', 'success');
    },

    // Admin - Filter users
    filterUsers(searchText) {
        const search = (searchText || document.getElementById('user-search')?.value || '').toLowerCase();
        const roleFilter = document.getElementById('user-role-filter')?.value || '';
        document.querySelectorAll('.user-row').forEach(row => {
            const name = row.dataset.name;
            const role = row.dataset.role;
            const matchSearch = !search || name.includes(search);
            const matchRole = !roleFilter || role === roleFilter;
            row.style.display = matchSearch && matchRole ? '' : 'none';
        });
    },

    // Admin - Show table
    showTable(collection, tab) {
        document.querySelectorAll('#table-tabs .tab').forEach(t => t.classList.remove('active'));
        if (tab) tab.classList.add('active');
        const container = document.getElementById('table-content');
        if (container) {
            container.innerHTML = AB.Views.admin.renderTable(collection);
            if (window.lucide) lucide.createIcons();
        }
    },

    // Admin - Handle import
    handleImport(input) {
        const file = input.files?.[0];
        if (!file) return;
        const type = document.getElementById('import-type')?.value || 'users';

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                let data;
                if (file.name.endsWith('.json')) {
                    data = JSON.parse(text);
                } else {
                    // Parse CSV
                    const lines = text.split('\n').filter(l => l.trim());
                    const headers = lines[0].split(',').map(h => h.trim());
                    data = lines.slice(1).map(line => {
                        const values = line.split(',').map(v => v.trim());
                        const obj = {};
                        headers.forEach((h, i) => { obj[h] = values[i] || ''; });
                        return obj;
                    });
                }
                if (Array.isArray(data)) {
                    const existing = AB.DB.getAll(type);
                    data.forEach(item => {
                        if (!item.id) item.id = AB.DB.generateId();
                        AB.DB.insert(type, item);
                    });
                    AB.App.toast(`${data.length} registros importados a ${type}`, 'success');
                }
            } catch (err) {
                AB.App.toast('Error al procesar archivo: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
    },

    // Super Admin - Campaigns
    newCampaign() {
        const form = document.getElementById('campaign-form');
        if (form) form.style.display = 'block';
    },

    saveCampaign() {
        const title = document.getElementById('campaign-title')?.value;
        const type = document.getElementById('campaign-type')?.value;
        const description = document.getElementById('campaign-description')?.value;
        const startDate = document.getElementById('campaign-start')?.value;
        const endDate = document.getElementById('campaign-end')?.value;
        const roles = Array.from(document.querySelectorAll('.campaign-role:checked')).map(c => c.value);
        const countries = Array.from(document.querySelectorAll('.campaign-country:checked')).map(c => c.value);

        if (!title || !startDate || !endDate) {
            AB.App.toast('Completa los campos obligatorios', 'error'); return;
        }

        AB.DB.insert('campaigns', {
            title, type, description,
            start_date: startDate, end_date: endDate,
            target_roles: roles.length ? roles : null,
            target_countries: countries.length ? countries : null,
            active: true, created_by: AB.Auth.getUserId()
        });
        AB.App.toast('Campana creada', 'success');
        AB.Router.renderView('campaigns');
    },

    deleteCampaign(id) {
        AB.DB.delete('campaigns', id);
        AB.App.toast('Campana eliminada', 'success');
        AB.Router.renderView('campaigns');
    },

    // Inventory
    editStock(id) {
        const item = AB.DB.getById('inventory', id);
        if (!item) return;
        AB.App.showModal('Actualizar Stock', `
            <div class="form-group" style="margin-bottom:var(--sp-4);">
                <label class="form-label">Producto</label>
                <p style="font-weight:600;">${item.product_name}</p>
            </div>
            <div class="form-group" style="margin-bottom:var(--sp-4);">
                <label class="form-label">Cantidad actual</label>
                <input type="number" class="form-input" id="stock-quantity" value="${item.quantity}" min="0">
            </div>
            <div class="form-group" style="margin-bottom:var(--sp-4);">
                <label class="form-label">Stock minimo</label>
                <input type="number" class="form-input" id="stock-min" value="${item.min_stock}" min="0">
            </div>
            <button class="btn btn-primary btn-block" onclick="AB.Actions.saveStock('${id}')">Guardar</button>
        `);
    },

    saveStock(id) {
        const quantity = parseInt(document.getElementById('stock-quantity')?.value);
        const minStock = parseInt(document.getElementById('stock-min')?.value);
        if (isNaN(quantity)) return;
        AB.DB.update('inventory', id, { quantity, min_stock: minStock || 5 });
        AB.App.toast('Stock actualizado', 'success');
        AB.App.closeModal();
        AB.Router.renderView('inventory');
    },

    // Export table as CSV
    exportTable(collection) {
        const data = AB.DB.getAll(collection);
        if (data.length === 0) { AB.App.toast('No hay datos para exportar', 'warning'); return; }
        const headers = Object.keys(data[0]);
        const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${collection}_export.csv`;
        a.click(); URL.revokeObjectURL(url);
        AB.App.toast('Archivo exportado', 'success');
    }
};

// --- Main App ---
AB.App = {
    authMode: 'signup', // 'signup' or 'signin'

    async init() {
        // Initialize Supabase first (if configured)
        AB.Supabase.init();

        // Initialize modules
        AB.DB.init();
        await AB.Auth.init();
        AB.Router.init();

        // Show correct auth UI
        this.setupLoginUI();

        // Check auth state
        if (AB.Auth.isLoggedIn()) {
            this.showApp();
        } else {
            this.showLogin();
        }

        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').catch(() => {});
        }
    },

    setupLoginUI() {
        const useSupabase = AB.Supabase.isConfigured;
        const sbFields = document.getElementById('supabase-auth-fields');
        const demoFields = document.getElementById('demo-auth-fields');
        if (sbFields) sbFields.style.display = useSupabase ? 'block' : 'none';
        if (demoFields) demoFields.style.display = useSupabase ? 'none' : 'block';
    },

    toggleAuthMode() {
        this.authMode = this.authMode === 'signup' ? 'signin' : 'signup';
        const btn = document.querySelector('#supabase-auth-fields .login-btn');
        const link = document.getElementById('auth-toggle-link');
        const nameField = document.getElementById('login-name-sb')?.parentElement;
        const roleField = document.getElementById('login-role-sb')?.parentElement;

        if (this.authMode === 'signin') {
            if (btn) btn.textContent = 'Iniciar Sesion';
            if (btn) btn.setAttribute('onclick', 'AB.App.supabaseSignIn()');
            if (link) link.textContent = 'Crear cuenta';
            if (nameField) nameField.style.display = 'none';
            if (roleField) roleField.style.display = 'none';
        } else {
            if (btn) btn.textContent = 'Crear Cuenta';
            if (btn) btn.setAttribute('onclick', 'AB.App.supabaseSignUp()');
            if (link) link.textContent = 'Iniciar sesion';
            if (nameField) nameField.style.display = 'block';
            if (roleField) roleField.style.display = 'block';
        }
    },

    async supabaseSignUp() {
        const name = document.getElementById('login-name-sb')?.value.trim();
        const email = document.getElementById('login-email')?.value.trim();
        const password = document.getElementById('login-password')?.value;
        const role = document.getElementById('login-role-sb')?.value;
        const country = document.getElementById('selected-country')?.value;

        if (!name || !email || !password) { this.toast('Completa todos los campos', 'error'); return; }
        if (password.length < 6) { this.toast('La contrasena debe tener al menos 6 caracteres', 'error'); return; }

        const btn = document.querySelector('#supabase-auth-fields .login-btn');
        if (btn) { btn.disabled = true; btn.textContent = 'Creando cuenta...'; }

        const result = await AB.Auth.signUp(email, password, name, role, country);
        if (result) {
            this.showApp();
            this.toast(`Bienvenido, ${name}`, 'success');
        }
        if (btn) { btn.disabled = false; btn.textContent = 'Crear Cuenta'; }
    },

    async supabaseSignIn() {
        const email = document.getElementById('login-email')?.value.trim();
        const password = document.getElementById('login-password')?.value;

        if (!email || !password) { this.toast('Ingresa email y contrasena', 'error'); return; }

        const btn = document.querySelector('#supabase-auth-fields .login-btn');
        if (btn) { btn.disabled = true; btn.textContent = 'Autenticando...'; }

        const result = await AB.Auth.signIn(email, password);
        if (result) {
            this.showApp();
            this.toast(`Bienvenido, ${result.name}`, 'success');
        }
        if (btn) { btn.disabled = false; btn.textContent = 'Iniciar Sesion'; }
    },

    showLogin() {
        document.getElementById('login-overlay').classList.add('active');
        document.getElementById('app-shell').classList.remove('active');
    },

    showApp() {
        document.getElementById('login-overlay').classList.remove('active');
        document.getElementById('app-shell').classList.add('active');
        this.updateHeader();
        AB.Router.renderSideNav();
        AB.Router.renderBottomNav();
        AB.Chat.init();
        AB.Router.handleRoute();
        if (window.lucide) lucide.createIcons();
    },

    updateHeader() {
        const user = AB.Auth.currentUser;
        if (!user) return;
        const nameEl = document.getElementById('header-user-name');
        const roleEl = document.getElementById('header-user-role');
        const avatarEl = document.getElementById('header-avatar');
        const countryEl = document.getElementById('header-country');

        if (nameEl) nameEl.textContent = user.name;
        if (roleEl) roleEl.textContent = AB.Auth.getRoleLabel(user.role);
        if (avatarEl) {
            avatarEl.textContent = user.name.charAt(0);
            avatarEl.style.background = AB.Auth.getRoleColor(user.role);
        }
        if (countryEl) {
            const country = AB.DB.getById('countries', user.country_code);
            countryEl.textContent = country ? `${country.flag} ${country.name}` : user.country_code;
        }
    },

    // Login flow
    selectCountry(code) {
        document.querySelectorAll('.country-option').forEach(el => {
            el.classList.toggle('selected', el.dataset.country === code);
        });
        document.getElementById('selected-country').value = code;
        // Hide country grid, show credentials
        document.getElementById('login-step-1').style.display = 'none';
        document.getElementById('login-step-2').style.display = 'block';
        if (window.lucide) lucide.createIcons();
    },

    login() {
        const name = document.getElementById('login-name').value.trim();
        const role = document.getElementById('login-role').value;
        const country = document.getElementById('selected-country').value;

        if (!country) { this.toast('Selecciona tu pais', 'error'); return; }
        if (!name) { this.toast('Ingresa tu nombre', 'error'); return; }

        // Show loading
        const btn = document.querySelector('.login-btn');
        if (btn) { btn.disabled = true; btn.textContent = 'Autenticando...'; }

        setTimeout(() => {
            AB.Auth.login(name, role, country);
            this.showApp();
            this.toast(`Bienvenido, ${name}`, 'success');
        }, 800);
    },

    // Sidebar toggle
    toggleSidebar() {
        const sidebar = document.getElementById('chat-sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        sidebar?.classList.toggle('open');
        backdrop?.classList.toggle('active');
    },

    // Chat send
    sendChatMessage() {
        const input = document.getElementById('chat-input');
        if (!input || !input.value.trim()) return;
        AB.Chat.sendMessage(input.value.trim());
        input.value = '';
    },

    // Toast
    toast(text, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const icons = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i data-lucide="${icons[type] || 'info'}" class="toast-icon" style="width:20px; height:20px; color:var(--${type === 'success' ? 'success' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'ab-blue'});"></i>
            <span class="toast-text">${text}</span>
            <span class="toast-close" onclick="this.parentElement.remove()">&times;</span>
        `;
        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    // Modal
    showModal(title, bodyHtml) {
        const overlay = document.getElementById('modal-overlay');
        const titleEl = document.getElementById('modal-title');
        const bodyEl = document.getElementById('modal-body');
        if (titleEl) titleEl.textContent = title;
        if (bodyEl) bodyEl.innerHTML = bodyHtml;
        if (overlay) overlay.classList.add('active');
        if (window.lucide) lucide.createIcons();
    },

    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.classList.remove('active');
    }
};

// Boot
document.addEventListener('DOMContentLoaded', () => AB.App.init());
