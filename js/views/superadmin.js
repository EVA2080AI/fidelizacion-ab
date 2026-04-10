/* ============================================================
   AB HUB+ Super Admin Views
   ============================================================ */
window.AB = window.AB || {};
AB.Views = AB.Views || {};
AB.Views.superadmin = AB.Views.superadmin || {};

AB.Views.superadmin.campaigns = function() {
    const campaigns = AB.DB.getAll('campaigns');
    const countries = AB.DB.getAll('countries');

    return `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
            <h1>Campanas de Marketing</h1>
            <p>Crea y gestiona campanas para usuarios del programa</p>
        </div>
        <button class="btn btn-primary" data-action="newCampaign">
            <i data-lucide="plus" style="width:16px; height:16px;"></i> Nueva Campana
        </button>
    </div>

    ${campaigns.length === 0 ? `
    <div class="empty-state">
        <i data-lucide="megaphone"></i>
        <h3>Sin campanas</h3>
        <p>Crea tu primera campana de marketing.</p>
    </div>` : `
    <div style="display:flex; flex-direction:column; gap:var(--sp-4);">
        ${campaigns.map(c => {
            const isActive = c.active && new Date(c.end_date) >= new Date();
            const daysLeft = Math.ceil((new Date(c.end_date) - new Date()) / (1000 * 60 * 60 * 24));
            return `
            <div class="card campaign-card ${isActive ? 'active-campaign' : 'draft'}">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <div style="display:flex; align-items:center; gap:var(--sp-2); margin-bottom:var(--sp-2);">
                            <h3>${c.title}</h3>
                            <span class="badge badge-${isActive ? 'success' : 'neutral'}">${isActive ? 'Activa' : 'Finalizada'}</span>
                            <span class="badge badge-info">${c.type}</span>
                        </div>
                        <p class="text-sm text-muted">${c.description}</p>
                    </div>
                    <div style="display:flex; gap:var(--sp-2);">
                        <button class="btn-icon" data-action="editCampaign" data-id="${c.id}"><i data-lucide="edit-2" style="width:16px; height:16px;"></i></button>
                        <button class="btn-icon" style="color:var(--error);" data-action="deleteCampaign" data-id="${c.id}"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></button>
                    </div>
                </div>
                <div style="display:flex; gap:var(--sp-6); margin-top:var(--sp-4); flex-wrap:wrap;">
                    <div>
                        <span class="text-caps">Periodo</span>
                        <p class="text-sm" style="font-weight:600;">${new Date(c.start_date).toLocaleDateString('es')} - ${new Date(c.end_date).toLocaleDateString('es')}</p>
                    </div>
                    <div>
                        <span class="text-caps">Dirigida a</span>
                        <p class="text-sm" style="font-weight:600;">${(c.target_roles || []).map(r => AB.Auth.getRoleLabel(r)).join(', ') || 'Todos'}</p>
                    </div>
                    <div>
                        <span class="text-caps">Paises</span>
                        <p class="text-sm" style="font-weight:600;">${c.target_countries ? c.target_countries.join(', ') : 'Todos'}</p>
                    </div>
                    ${isActive ? `<div>
                        <span class="text-caps">Quedan</span>
                        <p class="text-sm" style="font-weight:700; color:var(--warning);">${daysLeft} dias</p>
                    </div>` : ''}
                </div>
            </div>`;
        }).join('')}
    </div>`}

    <!-- New Campaign Form (hidden by default) -->
    <div id="campaign-form" style="display:none; margin-top:var(--sp-6);">
        <div class="card">
            <h3 style="margin-bottom:var(--sp-5);">Nueva Campana</h3>
            <div class="grid grid-2" style="margin-bottom:var(--sp-4);">
                <div class="form-group">
                    <label class="form-label">Titulo</label>
                    <input type="text" class="form-input" id="campaign-title" placeholder="Nombre de la campana">
                </div>
                <div class="form-group">
                    <label class="form-label">Tipo</label>
                    <select class="form-select" id="campaign-type">
                        <option value="general">General</option>
                        <option value="promotion">Promocion</option>
                        <option value="educational">Educativa</option>
                        <option value="event">Evento</option>
                    </select>
                </div>
            </div>
            <div class="form-group" style="margin-bottom:var(--sp-4);">
                <label class="form-label">Descripcion</label>
                <textarea class="form-textarea" id="campaign-description" placeholder="Descripcion de la campana..."></textarea>
            </div>
            <div class="grid grid-2" style="margin-bottom:var(--sp-4);">
                <div class="form-group">
                    <label class="form-label">Fecha inicio</label>
                    <input type="date" class="form-input" id="campaign-start">
                </div>
                <div class="form-group">
                    <label class="form-label">Fecha fin</label>
                    <input type="date" class="form-input" id="campaign-end">
                </div>
            </div>
            <div class="grid grid-2" style="margin-bottom:var(--sp-5);">
                <div class="form-group">
                    <label class="form-label">Roles objetivo</label>
                    <div style="display:flex; flex-wrap:wrap; gap:var(--sp-2);">
                        ${['cliente', 'especialista', 'distribuidor'].map(r => `
                        <label style="display:flex; align-items:center; gap:var(--sp-1); cursor:pointer; font-size:0.875rem;">
                            <input type="checkbox" class="campaign-role" value="${r}"> ${AB.Auth.getRoleLabel(r)}
                        </label>`).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Paises objetivo</label>
                    <div style="display:flex; flex-wrap:wrap; gap:var(--sp-2);">
                        ${countries.map(c => `
                        <label style="display:flex; align-items:center; gap:var(--sp-1); cursor:pointer; font-size:0.875rem;">
                            <input type="checkbox" class="campaign-country" value="${c.code}"> ${c.flag} ${c.name}
                        </label>`).join('')}
                    </div>
                </div>
            </div>
            <div style="display:flex; gap:var(--sp-3);">
                <button class="btn btn-primary" data-action="saveCampaign">Crear Campana</button>
                <button class="btn btn-secondary" onclick="document.getElementById('campaign-form').style.display='none'">Cancelar</button>
            </div>
        </div>
    </div>`;
};

AB.Views.superadmin.benefitsConfig = function() {
    const benefits = AB.DB.getAll('benefits');
    const redemptions = AB.DB.getAll('benefit_redemptions');

    return `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
            <h1>Configuracion de Beneficios</h1>
            <p>Gestiona el programa de recompensas y puntos</p>
        </div>
        <button class="btn btn-primary" data-action="addBenefit">
            <i data-lucide="plus" style="width:16px; height:16px;"></i> Nuevo Beneficio
        </button>
    </div>

    <!-- Summary -->
    <div class="grid grid-3" style="margin-bottom:var(--sp-6);">
        <div class="stat-card">
            <div class="stat-value">${benefits.length}</div>
            <div class="stat-label">Beneficios activos</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${redemptions.length}</div>
            <div class="stat-label">Canjes totales</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${redemptions.reduce((s, r) => s + (r.points_spent || 0), 0)}</div>
            <div class="stat-label">Puntos canjeados</div>
        </div>
    </div>

    <!-- Benefits Table -->
    <div class="table-wrapper">
        <table class="table">
            <thead>
                <tr>
                    <th>Beneficio</th>
                    <th>Tipo</th>
                    <th>Puntos requeridos</th>
                    <th>Canjes</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${benefits.map(b => {
                    const bRedemptions = redemptions.filter(r => r.benefit_id === b.id).length;
                    return `
                    <tr>
                        <td>
                            <div style="display:flex; align-items:center; gap:var(--sp-3);">
                                <div style="width:36px; height:36px; background:var(--ab-blue-50); border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; color:var(--ab-blue);">
                                    <i data-lucide="${b.icon || 'gift'}" style="width:18px; height:18px;"></i>
                                </div>
                                <div>
                                    <span style="font-weight:600;">${b.name}</span>
                                    <p class="text-xs text-muted">${b.description}</p>
                                </div>
                            </div>
                        </td>
                        <td><span class="badge badge-info">${b.type}</span></td>
                        <td style="font-weight:700; color:var(--warning);">${b.points_required} pts</td>
                        <td>${bRedemptions}</td>
                        <td>
                            <div style="display:flex; gap:var(--sp-1);">
                                <button class="btn-icon" data-action="editBenefit" data-id="${b.id}"><i data-lucide="edit-2" style="width:16px; height:16px;"></i></button>
                                <button class="btn-icon" style="color:var(--error);" data-action="deleteBenefit" data-id="${b.id}"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></button>
                            </div>
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    </div>

    <div class="card" style="margin-top:var(--sp-6);">
        <h3 style="margin-bottom:var(--sp-4);">Plan de Beneficios - Reglas de Acumulacion</h3>
        <p class="text-sm text-muted" style="margin-bottom:var(--sp-4);">Los clientes ganan puntos al completar actividades semanales:</p>
        <div class="table-wrapper">
            <table class="table">
                <thead><tr><th>Actividad</th><th>Frecuencia</th><th>Puntos</th><th>Estado</th></tr></thead>
                <tbody>
                    <tr><td>Completar item del checklist</td><td>Diario</td><td>5-15 pts</td><td><span class="badge badge-success">Activo</span></td></tr>
                    <tr><td>Checklist completo del dia</td><td>Diario</td><td>50 pts bonus</td><td><span class="badge badge-success">Activo</span></td></tr>
                    <tr><td>Ver tutorial completo</td><td>Unico</td><td>15-30 pts</td><td><span class="badge badge-success">Activo</span></td></tr>
                    <tr><td>Semana completa de checklist</td><td>Semanal</td><td>100 pts bonus</td><td><span class="badge badge-warning">Configurar</span></td></tr>
                    <tr><td>Completar todos los tutoriales</td><td>Unico</td><td>200 pts bonus</td><td><span class="badge badge-warning">Configurar</span></td></tr>
                </tbody>
            </table>
        </div>
    </div>`;
};
