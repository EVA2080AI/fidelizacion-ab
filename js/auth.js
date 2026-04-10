/* ============================================================
   AB HUB+ Authentication & Session Management
   ============================================================ */
window.AB = window.AB || {};

AB.Auth = {
    SESSION_KEY: 'ab_hub_session',

    init() {
        this.currentUser = this.getSession();
    },

    getSession() {
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
    refreshUser() {
        if (!this.currentUser) return;
        const fresh = AB.DB.getById('users', this.currentUser.id);
        if (fresh) {
            this.currentUser = { ...this.currentUser, ...fresh };
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentUser));
        }
    },

    login(name, role, countryCode) {
        // Check if user exists in DB by name+role (demo mode)
        let user = AB.DB.query('users', u => u.name.toLowerCase() === name.toLowerCase() && u.role === role)[0];

        if (!user) {
            // Create new user
            user = AB.DB.insert('users', {
                name,
                role,
                country_code: countryCode,
                email: name.toLowerCase().replace(/\s+/g, '.') + '@abhub.com',
                points: 0,
                first_login: true
            });
        }

        this.currentUser = user;
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));

        // Audit log
        AB.DB.insert('audit_log', {
            user_id: user.id, action: 'login',
            details: JSON.stringify({ role, country: countryCode })
        });

        return user;
    },

    logout() {
        if (this.currentUser) {
            AB.DB.insert('audit_log', {
                user_id: this.currentUser.id, action: 'logout', details: '{}'
            });
        }
        this.currentUser = null;
        localStorage.removeItem(this.SESSION_KEY);
    },

    updateProfile(updates) {
        if (!this.currentUser) return null;
        const updated = AB.DB.update('users', this.currentUser.id, updates);
        if (updated) {
            this.currentUser = { ...this.currentUser, ...updated };
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentUser));
        }
        return updated;
    },

    canAccess(requiredRoles) {
        if (!this.currentUser) return false;
        if (!requiredRoles || requiredRoles.length === 0) return true;
        return requiredRoles.includes(this.currentUser.role);
    },

    // Role hierarchy check
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
        const labels = {
            cliente: 'Cliente',
            especialista: 'Especialista',
            distribuidor: 'Distribuidor',
            admin: 'Administrador',
            superadmin: 'Super Admin'
        };
        return labels[role] || role;
    },

    getRoleColor(role) {
        const colors = {
            cliente: 'var(--role-cliente)',
            especialista: 'var(--role-especialista)',
            distribuidor: 'var(--role-distribuidor)',
            admin: 'var(--role-admin)',
            superadmin: 'var(--role-superadmin)'
        };
        return colors[role] || 'var(--gray-500)';
    }
};
