/* ============================================================
   AB HUB+ Admin Views
   ============================================================ */
window.AB = window.AB || {};
AB.Views = AB.Views || {};

AB.Views.admin = {
    home() {
        const stats = AB.DB.getStats();
        const role = AB.Auth.getRole();
        const isSuperAdmin = role === 'superadmin';

        return `
        <div class="page-header">
            <h1>Dashboard ${isSuperAdmin ? 'Super Admin' : 'Administrador'}</h1>
            <p>Vista general del sistema AB HUB+</p>
        </div>

        <div class="grid grid-4" style="margin-bottom:var(--sp-6);">
            <div class="stat-card">
                <div class="stat-icon" style="background:var(--ab-blue-50); color:var(--ab-blue);"><i data-lucide="users"></i></div>
                <div class="stat-value">${stats.totalUsers}</div>
                <div class="stat-label">Usuarios totales</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:var(--success-light); color:var(--success);"><i data-lucide="cpu"></i></div>
                <div class="stat-value">${stats.totalDevices}</div>
                <div class="stat-label">Dispositivos</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:var(--warning-light); color:var(--warning);"><i data-lucide="shield"></i></div>
                <div class="stat-value">${stats.pendingClaims}</div>
                <div class="stat-label">Garantias pendientes</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:var(--error-light); color:var(--error);"><i data-lucide="message-circle"></i></div>
                <div class="stat-value">${stats.openPQRs}</div>
                <div class="stat-label">PQRs abiertas</div>
            </div>
        </div>

        <div class="grid grid-2" style="margin-bottom:var(--sp-6);">
            <div class="stat-card">
                <div class="stat-icon" style="background:var(--role-distribuidor)20; color:var(--role-distribuidor);"><i data-lucide="building-2"></i></div>
                <div class="stat-value">${stats.totalDistributors}</div>
                <div class="stat-label">Distribuidores</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:var(--info-light); color:var(--info);"><i data-lucide="globe"></i></div>
                <div class="stat-value">${stats.countriesActive}</div>
                <div class="stat-label">Paises activos</div>
            </div>
        </div>

        <!-- Users by Role -->
        <div class="grid grid-2">
            <div class="card">
                <h3 style="margin-bottom:var(--sp-4);">Usuarios por Rol</h3>
                <div style="display:flex; flex-direction:column; gap:var(--sp-3);">
                    ${['cliente', 'especialista', 'distribuidor', 'admin', 'superadmin'].map(r => {
                        const count = AB.DB.getUsersByRole(r).length;
                        const total = stats.totalUsers;
                        const pct = total ? Math.round((count / total) * 100) : 0;
                        return `
                        <div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:var(--sp-1);">
                                <span class="text-sm" style="font-weight:600;">${AB.Auth.getRoleLabel(r)}</span>
                                <span class="text-sm text-muted">${count} (${pct}%)</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar" style="width:${pct}%; background:${AB.Auth.getRoleColor(r)};"></div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <div class="card">
                <h3 style="margin-bottom:var(--sp-4);">Usuarios por Pais</h3>
                <div style="display:flex; flex-direction:column; gap:var(--sp-3);">
                    ${AB.DB.getAll('countries').map(c => {
                        const count = AB.DB.getUsersByCountry(c.code).length;
                        return `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--sp-2) 0;">
                            <div style="display:flex; align-items:center; gap:var(--sp-2);">
                                <span style="font-size:1.25rem;">${c.flag}</span>
                                <span class="text-sm" style="font-weight:600;">${c.name}</span>
                            </div>
                            <span class="badge badge-neutral">${count} usuarios</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        </div>`;
    },

    users() {
        const users = AB.DB.getAll('users');
        const isSuperAdmin = AB.Auth.getRole() === 'superadmin';

        return `
        <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
                <h1>Usuarios</h1>
                <p>${isSuperAdmin ? 'Gestion completa de usuarios' : 'Vista de usuarios del sistema (solo lectura)'}</p>
            </div>
            ${isSuperAdmin ? '<button class="btn btn-primary" data-action="addUser"><i data-lucide="user-plus" style="width:16px; height:16px;"></i> Agregar</button>' : ''}
        </div>

        <div style="display:flex; gap:var(--sp-3); margin-bottom:var(--sp-5); flex-wrap:wrap;">
            <input type="text" class="form-input" placeholder="Buscar usuario..." style="max-width:300px;" id="user-search" oninput="AB.Actions.filterUsers(this.value)">
            <select class="form-select" style="max-width:200px;" id="user-role-filter" onchange="AB.Actions.filterUsers()">
                <option value="">Todos los roles</option>
                <option value="cliente">Cliente</option>
                <option value="especialista">Especialista</option>
                <option value="distribuidor">Distribuidor</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
            </select>
        </div>

        <div class="table-wrapper">
            <table class="table" id="users-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Pais</th>
                        <th>Puntos</th>
                        <th>Registro</th>
                        ${isSuperAdmin ? '<th>Acciones</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${users.map(u => {
                        const country = AB.DB.getById('countries', u.country_code);
                        return `
                        <tr class="user-row" data-name="${u.name.toLowerCase()}" data-role="${u.role}">
                            <td>
                                <div style="display:flex; align-items:center; gap:var(--sp-2);">
                                    <div class="user-avatar" style="width:28px; height:28px; font-size:0.75rem; background:${AB.Auth.getRoleColor(u.role)};">${u.name.charAt(0)}</div>
                                    <span style="font-weight:600;">${u.name}</span>
                                </div>
                            </td>
                            <td class="text-muted text-sm">${u.email || '-'}</td>
                            <td><span class="badge badge-role" style="background:${AB.Auth.getRoleColor(u.role)}20; color:${AB.Auth.getRoleColor(u.role)};">${AB.Auth.getRoleLabel(u.role)}</span></td>
                            <td>${country?.flag || ''} ${country?.name || u.country_code}</td>
                            <td>${u.points || 0}</td>
                            <td class="text-muted text-sm">${u.created_at ? new Date(u.created_at).toLocaleDateString('es') : '-'}</td>
                            ${isSuperAdmin ? `<td>
                                <div style="display:flex; gap:var(--sp-1);">
                                    <button class="btn-icon" data-action="editUser" data-id="${u.id}" title="Editar"><i data-lucide="edit-2" style="width:16px; height:16px;"></i></button>
                                    <button class="btn-icon" data-action="deleteUser" data-id="${u.id}" title="Eliminar" style="color:var(--error);"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></button>
                                </div>
                            </td>` : ''}
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    },

    tables() {
        const isSuperAdmin = AB.Auth.getRole() === 'superadmin';
        const collections = [
            { key: 'users', label: 'Usuarios', icon: 'users' },
            { key: 'devices', label: 'Dispositivos', icon: 'cpu' },
            { key: 'warranty_claims', label: 'Garantias', icon: 'shield' },
            { key: 'pqrs', label: 'PQRs', icon: 'message-circle' },
            { key: 'inventory', label: 'Inventario', icon: 'package' },
            { key: 'products', label: 'Productos', icon: 'box' },
            { key: 'checklist_completions', label: 'Checklist', icon: 'check-square' },
            { key: 'tutorial_completions', label: 'Tutoriales completados', icon: 'play-circle' },
            { key: 'benefit_redemptions', label: 'Beneficios canjeados', icon: 'gift' },
            { key: 'campaigns', label: 'Campanas', icon: 'megaphone' },
            { key: 'audit_log', label: 'Audit Log', icon: 'file-text' }
        ];

        return `
        <div class="page-header">
            <h1>Tablas de Datos</h1>
            <p>${isSuperAdmin ? 'Visualiza y edita todas las tablas del sistema' : 'Visualiza las tablas del sistema (solo lectura)'}</p>
        </div>

        <div class="tabs" id="table-tabs">
            ${collections.map((c, i) => `
                <div class="tab ${i === 0 ? 'active' : ''}" onclick="AB.Actions.showTable('${c.key}', this)">${c.label}</div>
            `).join('')}
        </div>

        <div id="table-content">
            ${this.renderTable(collections[0].key)}
        </div>`;
    },

    renderTable(collection) {
        const data = AB.DB.getAll(collection);
        const isSuperAdmin = AB.Auth.getRole() === 'superadmin';

        if (data.length === 0) {
            return '<div class="empty-state"><i data-lucide="inbox"></i><h3>Sin datos</h3><p>Esta tabla esta vacia.</p></div>';
        }

        const keys = Object.keys(data[0]).filter(k => !['password_hash'].includes(k));

        return `
        <div style="margin-bottom:var(--sp-4); display:flex; justify-content:space-between; align-items:center;">
            <span class="badge badge-neutral">${data.length} registros</span>
            ${isSuperAdmin ? `<button class="btn btn-sm btn-outline" data-action="exportTable" data-id="${collection}"><i data-lucide="download" style="width:14px; height:14px;"></i> Exportar CSV</button>` : ''}
        </div>
        <div class="table-wrapper" style="max-height:500px; overflow:auto;">
            <table class="table">
                <thead>
                    <tr>${keys.map(k => `<th>${k}</th>`).join('')}${isSuperAdmin ? '<th>Acc.</th>' : ''}</tr>
                </thead>
                <tbody>
                    ${data.map(row => `
                    <tr>
                        ${keys.map(k => `<td class="text-sm" style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${row[k] !== null && row[k] !== undefined ? (typeof row[k] === 'object' ? JSON.stringify(row[k]) : row[k]) : '-'}</td>`).join('')}
                        ${isSuperAdmin ? `<td><button class="btn-icon" data-action="editRecord" data-id="${row.id}" data-collection="${collection}"><i data-lucide="edit-2" style="width:14px; height:14px;"></i></button></td>` : ''}
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    },

    claims() {
        const claims = AB.DB.getAll('warranty_claims');
        const isSuperAdmin = AB.Auth.getRole() === 'superadmin';
        const statusLabels = { pending: 'Pendiente', ai_reviewing: 'IA Revisando', under_review: 'En revision', approved: 'Aprobada', rejected: 'Rechazada', in_repair: 'En reparacion', shipped: 'Enviado', completed: 'Completada' };
        const statusBadge = { pending: 'warning', ai_reviewing: 'info', under_review: 'info', approved: 'success', rejected: 'error', in_repair: 'warning', shipped: 'info', completed: 'success' };

        return `
        <div class="page-header">
            <h1>Garantias</h1>
            <p>Gestion de solicitudes de garantia</p>
        </div>

        <div class="table-wrapper">
            <table class="table">
                <thead>
                    <tr>
                        <th>Tracking</th>
                        <th>Cliente</th>
                        <th>Dispositivo</th>
                        <th>Estado</th>
                        <th>Pais</th>
                        <th>Fecha</th>
                        ${isSuperAdmin ? '<th>Acciones</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${claims.map(c => `
                    <tr>
                        <td style="font-family:monospace; font-weight:600;">${c.tracking_id}</td>
                        <td style="font-weight:600;">${c.client_name}</td>
                        <td class="text-sm">${c.device_model} (${c.device_serial})</td>
                        <td><span class="badge badge-${statusBadge[c.status]}">${statusLabels[c.status]}</span></td>
                        <td>${c.country_code || '-'}</td>
                        <td class="text-muted text-sm">${c.created_at ? new Date(c.created_at).toLocaleDateString('es') : '-'}</td>
                        ${isSuperAdmin ? `<td>
                            <select class="form-select" style="padding:4px 8px; font-size:0.75rem; min-width:120px;"
                                    onchange="AB.Actions.updateClaimStatus('${c.id}', this.value)">
                                ${Object.entries(statusLabels).map(([k, v]) => `<option value="${k}" ${c.status === k ? 'selected' : ''}>${v}</option>`).join('')}
                            </select>
                        </td>` : ''}
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    },

    pqrsAdmin() {
        const pqrs = AB.DB.getAll('pqrs');
        const typeLabels = { peticion: 'Peticion', queja: 'Queja', reclamo: 'Reclamo', sugerencia: 'Sugerencia' };
        const statusLabels = { open: 'Abierto', in_progress: 'En progreso', resolved: 'Resuelto', closed: 'Cerrado' };
        const statusBadge = { open: 'info', in_progress: 'warning', resolved: 'success', closed: 'neutral' };

        return `
        <div class="page-header">
            <h1>PQRs</h1>
            <p>Gestion de peticiones, quejas, reclamos y sugerencias</p>
        </div>

        ${pqrs.length === 0 ? '<div class="empty-state"><i data-lucide="inbox"></i><h3>Sin PQRs</h3></div>' : `
        <div class="table-wrapper">
            <table class="table">
                <thead><tr><th>ID</th><th>Tipo</th><th>Asunto</th><th>Usuario</th><th>Estado</th><th>Prioridad</th><th>Fecha</th></tr></thead>
                <tbody>
                    ${pqrs.map(p => {
                        const user = AB.DB.getById('users', p.user_id);
                        return `<tr>
                            <td style="font-family:monospace;">${p.tracking_id}</td>
                            <td><span class="badge badge-info">${typeLabels[p.type]}</span></td>
                            <td>${p.subject}</td>
                            <td>${user?.name || 'N/A'}</td>
                            <td><span class="badge badge-${statusBadge[p.status]}">${statusLabels[p.status]}</span></td>
                            <td><span class="badge badge-${p.priority === 'urgent' ? 'error' : p.priority === 'high' ? 'warning' : 'neutral'}">${p.priority}</span></td>
                            <td class="text-muted text-sm">${new Date(p.created_at).toLocaleDateString('es')}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`}`;
    },

    importData() {
        return `
        <div class="page-header">
            <h1>Importar Datos</h1>
            <p>Carga datos desde Salesforce u otras fuentes</p>
        </div>

        <div class="grid grid-2">
            <div class="card">
                <h3 style="margin-bottom:var(--sp-4);">Importar desde CSV</h3>
                <p class="text-sm text-muted" style="margin-bottom:var(--sp-4);">Sube un archivo CSV exportado desde Salesforce o tu CRM.</p>

                <div class="form-group" style="margin-bottom:var(--sp-4);">
                    <label class="form-label">Tipo de datos</label>
                    <select class="form-select" id="import-type">
                        <option value="users">Usuarios / Clientes</option>
                        <option value="devices">Dispositivos</option>
                        <option value="inventory">Inventario</option>
                    </select>
                </div>

                <div class="upload-zone" id="import-zone" onclick="document.getElementById('import-file').click()">
                    <i data-lucide="upload"></i>
                    <p>Arrastra tu archivo CSV aqui</p>
                    <p class="text-xs text-muted">Maximo 10MB</p>
                    <input type="file" accept=".csv,.json" style="display:none;" id="import-file" onchange="AB.Actions.handleImport(this)">
                </div>
            </div>

            <div class="card">
                <h3 style="margin-bottom:var(--sp-4);">Formato Esperado</h3>
                <p class="text-sm text-muted" style="margin-bottom:var(--sp-4);">El archivo debe seguir la estructura de las tablas del sistema.</p>

                <div style="background:var(--gray-50); padding:var(--sp-4); border-radius:var(--radius-md); font-family:monospace; font-size:0.8125rem; overflow-x:auto;">
                    <p style="color:var(--gray-400);">// Ejemplo para Usuarios:</p>
                    <p>name,email,role,country_code,phone</p>
                    <p>Juan Perez,juan@email.com,cliente,COL,+573001234567</p>
                    <p>Ana Garcia,ana@dist.com,distribuidor,MEX,+525512345678</p>
                </div>

                <div style="margin-top:var(--sp-4);">
                    <h4 style="margin-bottom:var(--sp-2);">Integracion Salesforce</h4>
                    <p class="text-sm text-muted">Exporta tus datos desde Salesforce Health Cloud en formato CSV y cargalos aqui.</p>
                </div>
            </div>
        </div>`;
    }
};

// Super Admin inherits admin home
AB.Views.superadmin = AB.Views.superadmin || {};
AB.Views.superadmin.home = function() { return AB.Views.admin.home(); };
