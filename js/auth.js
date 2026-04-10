/* ============================================================
   AB HUB+ Authentication & Session Management
   Dual mode: Supabase Auth (production) or localStorage (demo)
   ============================================================ */
window.AB = window.AB || {};

AB.Auth = {
    SESSION_KEY: 'ab_hub_session',
    useSupabase: false,

    async init() {
        this.useSupabase = AB.Supabase && AB.Supabase.isConfigured;

        if (this.useSupabase) {
            // Try to restore Supabase session
            const session = await AB.Supabase.getSession();
            if (session?.user) {
                const profile = await AB.Supabase.getProfile(session.user.id);
                this.currentUser = profile;
            } else {
                this.currentUser = null;
            }

            // Listen for auth changes
            AB.Supabase.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    const profile = await AB.Supabase.getProfile(session.user.id);
                    this.currentUser = profile;
                    AB.App.showApp();
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    AB.App.showLogin();
                }
            });
        } else {
            // localStorage demo mode
            this.currentUser = this.getLocalSession();
        }
    },

    getLocalSession() {
        try { return JSON.parse(localStorage.getItem(this.SESSION_KEY)); }
        catch { return null; }
    },

    isLoggedIn() { return !!this.currentUser; },
    getRole() { return this.currentUser?.role || null; },
    getCountry() { return this.currentUser?.country_code || null; },
    getUserId() { return this.currentUser?.id || null; },
    getUserName() { return this.currentUser?.name || ''; },
    getUserPoints() { return this.currentUser?.points || 0; },

    // Refresh points from DB
    async refreshUser() {
        if (!this.currentUser) return;
        if (this.useSupabase) {
            const fresh = await AB.Supabase.getProfile(this.currentUser.id);
            if (fresh) this.currentUser = fresh;
        } else {
            const fresh = AB.DB.getById('users', this.currentUser.id);
            if (fresh) {
                this.currentUser = { ...this.currentUser, ...fresh };
                localStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentUser));
            }
        }
    },

    // --- SUPABASE AUTH ---
    async signUp(email, password, name, role, countryCode) {
        if (!this.useSupabase) {
            // Fallback: localStorage demo signup
            return this.login(name, role, countryCode);
        }

        const { data, error } = await AB.Supabase.signUp(email, password, {
            name, role, country_code: countryCode
        });

        if (error) {
            AB.App.toast(error.message, 'error');
            return null;
        }

        // If email confirmation is disabled, user is logged in immediately
        if (data.user) {
            const profile = await AB.Supabase.getProfile(data.user.id);
            this.currentUser = profile;
            return profile;
        }

        // Email confirmation required
        AB.App.toast('Revisa tu email para confirmar tu cuenta', 'info');
        return null;
    },

    async signIn(email, password) {
        if (!this.useSupabase) {
            AB.App.toast('Modo demo: usa el login simple', 'info');
            return null;
        }

        const { data, error } = await AB.Supabase.signIn(email, password);
        if (error) {
            AB.App.toast(error.message, 'error');
            return null;
        }

        if (data.user) {
            const profile = await AB.Supabase.getProfile(data.user.id);
            this.currentUser = profile;
            return profile;
        }
        return null;
    },

    // --- LOCAL AUTH (demo mode) ---
    login(name, role, countryCode) {
        let user = AB.DB.query('users', u => u.name.toLowerCase() === name.toLowerCase() && u.role === role)[0];
        if (!user) {
            user = AB.DB.insert('users', {
                name, role, country_code: countryCode,
                email: name.toLowerCase().replace(/\s+/g, '.') + '@abhub.com',
                points: 0, first_login: true
            });
        }
        this.currentUser = user;
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
        AB.DB.insert('audit_log', {
            user_id: user.id, action: 'login',
            details: JSON.stringify({ role, country: countryCode })
        });
        return user;
    },

    async logout() {
        if (this.useSupabase) {
            await AB.Supabase.signOut();
        } else {
            if (this.currentUser) {
                AB.DB.insert('audit_log', {
                    user_id: this.currentUser.id, action: 'logout', details: '{}'
                });
            }
            localStorage.removeItem(this.SESSION_KEY);
        }
        this.currentUser = null;
    },

    async updateProfile(updates) {
        if (!this.currentUser) return null;
        if (this.useSupabase) {
            const { data } = await AB.Supabase.updateProfile(this.currentUser.id, updates);
            if (data) this.currentUser = { ...this.currentUser, ...data };
            return data;
        } else {
            const updated = AB.DB.update('users', this.currentUser.id, updates);
            if (updated) {
                this.currentUser = { ...this.currentUser, ...updated };
                localStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentUser));
            }
            return updated;
        }
    },

    canAccess(requiredRoles) {
        if (!this.currentUser) return false;
        if (!requiredRoles || requiredRoles.length === 0) return true;
        return requiredRoles.includes(this.currentUser.role);
    },

    hasPermission(permission) {
        const permissions = {
            superadmin: ['view_all', 'edit_all', 'delete_all', 'manage_users', 'manage_campaigns', 'manage_benefits', 'import_data', 'view_tables', 'edit_tables'],
            admin: ['view_all', 'view_tables', 'import_data', 'manage_users_readonly'],
            distribuidor: ['manage_inventory', 'submit_warranty', 'track_claims'],
            especialista: ['view_patients', 'manage_maps', 'view_devices'],
            cliente: ['view_warranty', 'view_checklist', 'view_tutorials', 'submit_pqr', 'buy_accessories', 'redeem_benefits']
        };
        const role = this.getRole();
        return role && permissions[role]?.includes(permission);
    },

    getRoleLabel(role) {
        const labels = { cliente: 'Cliente', especialista: 'Especialista', distribuidor: 'Distribuidor', admin: 'Administrador', superadmin: 'Super Admin' };
        return labels[role] || role;
    },

    getRoleColor(role) {
        const colors = { cliente: 'var(--role-cliente)', especialista: 'var(--role-especialista)', distribuidor: 'var(--role-distribuidor)', admin: 'var(--role-admin)', superadmin: 'var(--role-superadmin)' };
        return colors[role] || 'var(--gray-500)';
    }
};
