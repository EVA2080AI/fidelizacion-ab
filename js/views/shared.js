/* ============================================================
   AB HUB+ Shared Views
   ============================================================ */
window.AB = window.AB || {};
AB.Views = AB.Views || {};

AB.Views.shared = {
    profile() {
        const user = AB.Auth.currentUser;
        const country = AB.DB.getById('countries', user.country_code);

        return `
        <div class="page-header">
            <h1>Mi Perfil</h1>
            <p>Administra tu informacion personal</p>
        </div>

        <div class="grid grid-2">
            <div class="card">
                <div style="display:flex; align-items:center; gap:var(--sp-5); margin-bottom:var(--sp-6);">
                    <div class="user-avatar" style="width:64px; height:64px; font-size:1.5rem; background:${AB.Auth.getRoleColor(user.role)};">
                        ${user.name.charAt(0)}
                    </div>
                    <div>
                        <h2>${user.name}</h2>
                        <span class="badge badge-role" style="background:${AB.Auth.getRoleColor(user.role)}20; color:${AB.Auth.getRoleColor(user.role)};">
                            ${AB.Auth.getRoleLabel(user.role)}
                        </span>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom:var(--sp-4);">
                    <label class="form-label">Nombre completo</label>
                    <input type="text" class="form-input" id="profile-name" value="${user.name}">
                </div>
                <div class="form-group" style="margin-bottom:var(--sp-4);">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" id="profile-email" value="${user.email || ''}">
                </div>
                <div class="form-group" style="margin-bottom:var(--sp-4);">
                    <label class="form-label">Telefono</label>
                    <input type="tel" class="form-input" id="profile-phone" value="${user.phone || ''}">
                </div>
                <div class="form-group" style="margin-bottom:var(--sp-6);">
                    <label class="form-label">Pais</label>
                    <div style="display:flex; align-items:center; gap:var(--sp-2); padding:var(--sp-3); background:var(--gray-50); border-radius:var(--radius-md);">
                        <span style="font-size:1.5rem;">${country?.flag || ''}</span>
                        <span style="font-weight:600;">${country?.name || user.country_code}</span>
                    </div>
                </div>

                <div style="display:flex; gap:var(--sp-3);">
                    <button class="btn btn-primary" data-action="saveProfile">Guardar Cambios</button>
                    <button class="btn btn-danger" data-action="logout">Cerrar Sesion</button>
                </div>
            </div>

            <div>
                <div class="card" style="margin-bottom:var(--sp-5);">
                    <h3 style="margin-bottom:var(--sp-4);">Informacion de Cuenta</h3>
                    <div style="display:flex; flex-direction:column; gap:var(--sp-3);">
                        <div style="display:flex; justify-content:space-between;">
                            <span class="text-muted text-sm">ID de usuario</span>
                            <span class="text-sm" style="font-weight:600; font-family:monospace;">${user.id}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span class="text-muted text-sm">Rol</span>
                            <span class="text-sm" style="font-weight:600;">${AB.Auth.getRoleLabel(user.role)}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span class="text-muted text-sm">Region</span>
                            <span class="text-sm" style="font-weight:600;">${country?.name || user.country_code}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span class="text-muted text-sm">Miembro desde</span>
                            <span class="text-sm" style="font-weight:600;">${user.created_at ? new Date(user.created_at).toLocaleDateString('es') : 'N/A'}</span>
                        </div>
                        ${user.role === 'cliente' ? `<div style="display:flex; justify-content:space-between;">
                            <span class="text-muted text-sm">Puntos acumulados</span>
                            <span class="text-sm" style="font-weight:700; color:var(--warning);">${user.points || 0} pts</span>
                        </div>` : ''}
                    </div>
                </div>

                ${user.role === 'distribuidor' ? `
                <div class="card">
                    <h3 style="margin-bottom:var(--sp-4);">Datos de Empresa</h3>
                    <div class="form-group" style="margin-bottom:var(--sp-4);">
                        <label class="form-label">Empresa</label>
                        <input type="text" class="form-input" id="profile-company" value="${user.company || ''}">
                    </div>
                </div>` : ''}
            </div>
        </div>`;
    },

    tutorials() {
        const tutorials = AB.DB.getAll('tutorials');
        const completions = AB.DB.query('tutorial_completions', c => c.user_id === AB.Auth.getUserId());
        const completedIds = completions.map(c => c.tutorial_id);

        const categories = { setup: 'Configuracion', care: 'Cuidado', features: 'Funciones', troubleshooting: 'Solucion de problemas' };

        return `
        <div class="page-header">
            <h1>Tutoriales</h1>
            <p>Aprende a sacar el maximo de tu dispositivo y gana puntos</p>
        </div>

        <div style="display:flex; gap:var(--sp-2); margin-bottom:var(--sp-6); flex-wrap:wrap;">
            <span class="badge badge-success">${completedIds.length}/${tutorials.length} completados</span>
            <span class="badge badge-warning">${completions.reduce((s, c) => s + (c.points_earned || 0), 0)} pts ganados</span>
        </div>

        <div class="grid grid-3">
            ${tutorials.map(t => {
                const done = completedIds.includes(t.id);
                return `
                <div class="video-card ${done ? 'completed' : ''}">
                    <div class="video-thumb" style="${done ? 'background:var(--success-light);' : ''}">
                        ${done
                            ? '<i data-lucide="check-circle" style="color:var(--success); width:48px; height:48px;"></i>'
                            : '<div class="play-icon"><i data-lucide="play" style="width:24px; height:24px;"></i></div>'
                        }
                    </div>
                    <div class="video-info">
                        <h4>${t.title}</h4>
                        <p class="text-sm text-muted">${t.description}</p>
                        <div class="video-meta" style="margin-top:var(--sp-2);">
                            <span><i data-lucide="clock" style="width:14px; height:14px; display:inline;"></i> ${t.duration} min</span>
                            <span class="badge badge-${done ? 'success' : 'warning'}" style="font-size:0.6875rem;">${done ? 'Completado' : `+${t.points} pts`}</span>
                        </div>
                        ${!done ? `<button class="btn btn-sm btn-primary" style="margin-top:var(--sp-3); width:100%;" data-action="watchTutorial" data-id="${t.id}">Ver Tutorial</button>` : ''}
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    }
};
