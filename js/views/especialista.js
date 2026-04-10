/* ============================================================
   AB HUB+ Especialista Views
   ============================================================ */
window.AB = window.AB || {};
AB.Views = AB.Views || {};

AB.Views.especialista = {
    home() {
        const user = AB.Auth.currentUser;
        const allDevices = AB.DB.getAll('devices');
        const allClients = AB.DB.getUsersByRole('cliente');
        const country = AB.DB.getById('countries', user.country_code);

        return `
        <div class="page-header">
            <h1>Panel de Especialista</h1>
            <p>${user.name} - ${country?.name || user.country_code}</p>
        </div>

        <div class="grid grid-3" style="margin-bottom:var(--sp-6);">
            <div class="stat-card" onclick="AB.Router.navigate('patients')" style="cursor:pointer;">
                <div class="stat-icon" style="background:var(--ab-blue-50); color:var(--ab-blue);"><i data-lucide="users"></i></div>
                <div class="stat-value">${allClients.length}</div>
                <div class="stat-label">Pacientes registrados</div>
            </div>
            <div class="stat-card" onclick="AB.Router.navigate('devices')" style="cursor:pointer;">
                <div class="stat-icon" style="background:var(--success-light); color:var(--success);"><i data-lucide="cpu"></i></div>
                <div class="stat-value">${allDevices.length}</div>
                <div class="stat-label">Dispositivos activos</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:var(--warning-light); color:var(--warning);"><i data-lucide="alert-circle"></i></div>
                <div class="stat-value">${allDevices.filter(d => AB.DB.getWarrantyDaysLeft(d.warranty_expiry) < 180).length}</div>
                <div class="stat-label">Garantias por vencer</div>
            </div>
        </div>

        <div class="grid grid-2">
            <div class="card">
                <h3 style="margin-bottom:var(--sp-4);">Pacientes Recientes</h3>
                ${allClients.length === 0 ? '<p class="text-muted text-sm">Sin pacientes registrados.</p>' :
                `<div style="display:flex; flex-direction:column; gap:var(--sp-3);">
                    ${allClients.slice(0, 5).map(c => {
                        const devices = AB.DB.getDevicesByUser(c.id);
                        return `
                        <div style="display:flex; align-items:center; gap:var(--sp-3); padding:var(--sp-3); border:1px solid var(--gray-100); border-radius:var(--radius-md);">
                            <div class="user-avatar" style="width:36px; height:36px; font-size:0.875rem; background:var(--ab-blue);">${c.name.charAt(0)}</div>
                            <div style="flex:1;">
                                <p style="font-weight:600; font-size:0.875rem;">${c.name}</p>
                                <p class="text-xs text-muted">${devices.length} dispositivo(s)</p>
                            </div>
                            <span class="badge badge-neutral">${c.country_code}</span>
                        </div>`;
                    }).join('')}
                </div>`}
            </div>

            <div class="card">
                <h3 style="margin-bottom:var(--sp-4);">Dispositivos con Garantia Proxima</h3>
                ${allDevices.filter(d => AB.DB.getWarrantyDaysLeft(d.warranty_expiry) < 365)
                    .sort((a, b) => new Date(a.warranty_expiry) - new Date(b.warranty_expiry))
                    .slice(0, 5)
                    .map(d => {
                        const days = AB.DB.getWarrantyDaysLeft(d.warranty_expiry);
                        const user = AB.DB.getById('users', d.user_id);
                        return `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--sp-3); border:1px solid var(--gray-100); border-radius:var(--radius-md); margin-bottom:var(--sp-2);">
                            <div>
                                <p style="font-weight:600; font-size:0.875rem;">${d.model}</p>
                                <p class="text-xs text-muted">${user?.name || 'N/A'} - S/N: ${d.serial_number}</p>
                            </div>
                            <span class="badge badge-${days < 90 ? 'error' : days < 180 ? 'warning' : 'info'}">${days} dias</span>
                        </div>`;
                    }).join('') || '<p class="text-muted text-sm">No hay dispositivos con garantia proxima.</p>'}
            </div>
        </div>`;
    },

    patients() {
        const clients = AB.DB.getUsersByRole('cliente');

        return `
        <div class="page-header">
            <h1>Pacientes</h1>
            <p>Listado de pacientes registrados en el sistema</p>
        </div>

        <div class="table-wrapper">
            <table class="table">
                <thead>
                    <tr>
                        <th>Paciente</th>
                        <th>Email</th>
                        <th>Pais</th>
                        <th>Dispositivos</th>
                        <th>Puntos</th>
                    </tr>
                </thead>
                <tbody>
                    ${clients.map(c => {
                        const devices = AB.DB.getDevicesByUser(c.id);
                        const country = AB.DB.getById('countries', c.country_code);
                        return `
                        <tr>
                            <td>
                                <div style="display:flex; align-items:center; gap:var(--sp-2);">
                                    <div class="user-avatar" style="width:28px; height:28px; font-size:0.75rem; background:var(--ab-blue);">${c.name.charAt(0)}</div>
                                    <span style="font-weight:600;">${c.name}</span>
                                </div>
                            </td>
                            <td class="text-muted text-sm">${c.email || '-'}</td>
                            <td>${country?.flag || ''} ${country?.name || c.country_code}</td>
                            <td>${devices.length}</td>
                            <td><span class="badge badge-warning">${c.points || 0} pts</span></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    },

    devices() {
        const devices = AB.DB.getAll('devices');

        return `
        <div class="page-header">
            <h1>Dispositivos</h1>
            <p>Todos los dispositivos registrados en el sistema</p>
        </div>

        <div class="table-wrapper">
            <table class="table">
                <thead>
                    <tr>
                        <th>Modelo</th>
                        <th>Serial</th>
                        <th>Paciente</th>
                        <th>Lado</th>
                        <th>Estado</th>
                        <th>Garantia</th>
                    </tr>
                </thead>
                <tbody>
                    ${devices.map(d => {
                        const user = AB.DB.getById('users', d.user_id);
                        const days = AB.DB.getWarrantyDaysLeft(d.warranty_expiry);
                        const sides = { left: 'Izquierdo', right: 'Derecho', bilateral: 'Bilateral' };
                        return `
                        <tr>
                            <td style="font-weight:600;">${d.model}</td>
                            <td style="font-family:monospace; font-size:0.8125rem;">${d.serial_number}</td>
                            <td>${user?.name || 'N/A'}</td>
                            <td>${sides[d.implant_side] || d.implant_side}</td>
                            <td><span class="badge badge-${d.status === 'active' ? 'success' : 'warning'}">${d.status === 'active' ? 'Activo' : d.status}</span></td>
                            <td><span class="badge badge-${days < 90 ? 'error' : days < 180 ? 'warning' : 'success'}">${days} dias</span></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    }
};
