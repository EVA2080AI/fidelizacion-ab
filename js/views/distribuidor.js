/* ============================================================
   AB HUB+ Distribuidor Views
   ============================================================ */
window.AB = window.AB || {};
AB.Views = AB.Views || {};

AB.Views.distribuidor = {
    home() {
        const user = AB.Auth.currentUser;
        const inventory = AB.DB.getInventoryByDistributor(user.id);
        const claims = AB.DB.getClaimsByDistributor(user.id);
        const lowStock = inventory.filter(i => i.quantity <= i.min_stock);
        const pendingClaims = claims.filter(c => ['pending', 'ai_reviewing', 'under_review'].includes(c.status));
        const country = AB.DB.getById('countries', user.country_code);

        return `
        <div class="page-header">
            <h1>Panel de Distribuidor</h1>
            <p>${user.company || user.name} - ${country?.name || user.country_code}</p>
        </div>

        <div class="grid grid-4" style="margin-bottom:var(--sp-6);">
            <div class="stat-card" onclick="AB.Router.navigate('inventory')" style="cursor:pointer;">
                <div class="stat-icon" style="background:var(--ab-blue-50); color:var(--ab-blue);"><i data-lucide="package"></i></div>
                <div class="stat-value">${inventory.length}</div>
                <div class="stat-label">Productos en inventario</div>
            </div>
            <div class="stat-card" style="cursor:pointer;" onclick="AB.Router.navigate('inventory')">
                <div class="stat-icon" style="background:${lowStock.length ? 'var(--error-light)' : 'var(--success-light)'}; color:${lowStock.length ? 'var(--error)' : 'var(--success)'};">
                    <i data-lucide="alert-triangle"></i>
                </div>
                <div class="stat-value" style="color:${lowStock.length ? 'var(--error)' : 'var(--success)'};">${lowStock.length}</div>
                <div class="stat-label">Stock bajo</div>
            </div>
            <div class="stat-card" onclick="AB.Router.navigate('tracking')" style="cursor:pointer;">
                <div class="stat-icon" style="background:var(--warning-light); color:var(--warning);"><i data-lucide="clock"></i></div>
                <div class="stat-value">${pendingClaims.length}</div>
                <div class="stat-label">Garantias pendientes</div>
            </div>
            <div class="stat-card" onclick="AB.Router.navigate('tracking')" style="cursor:pointer;">
                <div class="stat-icon" style="background:var(--success-light); color:var(--success);"><i data-lucide="check-circle"></i></div>
                <div class="stat-value">${claims.filter(c => c.status === 'completed').length}</div>
                <div class="stat-label">Garantias completadas</div>
            </div>
        </div>

        <div class="grid grid-2">
            <!-- Low Stock Alert -->
            <div class="card">
                <div class="card-header">
                    <h3>Alertas de Stock</h3>
                    <span class="badge badge-${lowStock.length ? 'error' : 'success'}">${lowStock.length} alertas</span>
                </div>
                ${lowStock.length === 0
                    ? '<p class="text-muted text-sm">Todos los productos tienen stock suficiente.</p>'
                    : `<div style="display:flex; flex-direction:column; gap:var(--sp-3);">
                        ${lowStock.map(i => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--sp-3); background:var(--error-light); border-radius:var(--radius-md);">
                            <div>
                                <p style="font-weight:600; font-size:0.875rem;">${i.product_name}</p>
                                <p class="text-xs text-muted">Min: ${i.min_stock} unidades</p>
                            </div>
                            <span style="font-weight:700; color:var(--error);">${i.quantity} uds</span>
                        </div>`).join('')}
                    </div>`
                }
            </div>

            <!-- Recent Claims -->
            <div class="card">
                <div class="card-header">
                    <h3>Garantias Recientes</h3>
                    <button class="btn btn-sm btn-primary" onclick="AB.Router.navigate('warranty-request')">
                        <i data-lucide="plus" style="width:14px; height:14px;"></i> Nueva
                    </button>
                </div>
                ${claims.length === 0
                    ? '<p class="text-muted text-sm">No hay solicitudes de garantia.</p>'
                    : `<div style="display:flex; flex-direction:column; gap:var(--sp-3);">
                        ${claims.slice(0, 5).map(c => {
                            const statusLabels = { pending: 'Pendiente', ai_reviewing: 'IA Revisando', under_review: 'En revision', approved: 'Aprobada', rejected: 'Rechazada', in_repair: 'En reparacion', shipped: 'Enviado', completed: 'Completada' };
                            const statusBadge = { pending: 'warning', ai_reviewing: 'info', under_review: 'info', approved: 'success', rejected: 'error', in_repair: 'warning', shipped: 'info', completed: 'success' };
                            return `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--sp-3); border:1px solid var(--gray-100); border-radius:var(--radius-md); cursor:pointer;" data-action="viewClaim" data-id="${c.id}">
                                <div>
                                    <p style="font-weight:600; font-size:0.875rem;">${c.client_name}</p>
                                    <p class="text-xs text-muted">${c.tracking_id}</p>
                                </div>
                                <span class="badge badge-${statusBadge[c.status]}">${statusLabels[c.status]}</span>
                            </div>`;
                        }).join('')}
                    </div>`
                }
            </div>
        </div>`;
    },

    inventory() {
        const user = AB.Auth.currentUser;
        const inventory = AB.DB.getInventoryByDistributor(user.id);

        return `
        <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
                <h1>Inventario</h1>
                <p>Gestiona el stock de productos en tu region</p>
            </div>
            <button class="btn btn-primary" data-action="updateInventory">
                <i data-lucide="refresh-cw" style="width:16px; height:16px;"></i> Actualizar Stock
            </button>
        </div>

        <div class="table-wrapper">
            <table class="table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Min. Stock</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${inventory.map(item => {
                        const stockLevel = item.quantity <= item.min_stock * 0.5 ? 'low' : item.quantity <= item.min_stock ? 'medium' : 'high';
                        return `
                        <tr>
                            <td style="font-weight:600;">${item.product_name}</td>
                            <td>
                                <div class="stock-indicator">
                                    <span class="stock-dot ${stockLevel}"></span>
                                    <span style="font-weight:700;">${item.quantity}</span>
                                </div>
                            </td>
                            <td class="text-muted">${item.min_stock}</td>
                            <td>
                                <span class="badge badge-${stockLevel === 'low' ? 'error' : stockLevel === 'medium' ? 'warning' : 'success'}">
                                    ${stockLevel === 'low' ? 'Critico' : stockLevel === 'medium' ? 'Bajo' : 'OK'}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-outline" data-action="editStock" data-id="${item.id}">
                                    Editar
                                </button>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    },

    warrantyRequest() {
        return `
        <div class="page-header">
            <h1>Solicitar Garantia</h1>
            <p>Completa el formulario para iniciar un proceso de garantia</p>
        </div>

        <div class="card" style="max-width:700px;">
            <div class="grid grid-2" style="margin-bottom:var(--sp-5);">
                <div class="form-group">
                    <label class="form-label">Nombre del cliente</label>
                    <input type="text" class="form-input" id="claim-client-name" placeholder="Nombre completo">
                </div>
                <div class="form-group">
                    <label class="form-label">Email del cliente</label>
                    <input type="email" class="form-input" id="claim-client-email" placeholder="email@ejemplo.com">
                </div>
            </div>

            <div class="grid grid-2" style="margin-bottom:var(--sp-5);">
                <div class="form-group">
                    <label class="form-label">Serial del dispositivo</label>
                    <input type="text" class="form-input" id="claim-serial" placeholder="MV-2025-XXXXX">
                </div>
                <div class="form-group">
                    <label class="form-label">Modelo</label>
                    <select class="form-select" id="claim-model">
                        <option value="">Seleccionar modelo</option>
                        <option value="Marvel CI - HiRes Ultra 3D">Marvel CI - HiRes Ultra 3D</option>
                        <option value="Naida CI Marvel M90">Naida CI Marvel M90</option>
                        <option value="Sky CI Marvel">Sky CI Marvel</option>
                    </select>
                </div>
            </div>

            <div class="form-group" style="margin-bottom:var(--sp-5);">
                <label class="form-label">Descripcion del problema</label>
                <textarea class="form-textarea" id="claim-description" placeholder="Describe detalladamente el problema del dispositivo..."></textarea>
            </div>

            <div class="form-group" style="margin-bottom:var(--sp-6);">
                <label class="form-label">Fotos del dispositivo</label>
                <div class="upload-zone" id="claim-photos-zone">
                    <i data-lucide="camera"></i>
                    <p>Arrastra fotos aqui o haz clic para seleccionar</p>
                    <p class="text-xs text-muted">La IA analizara las fotos para diagnostico automatico</p>
                    <input type="file" multiple accept="image/*" style="display:none;" id="claim-photos-input">
                </div>
            </div>

            <div style="display:flex; gap:var(--sp-3);">
                <button class="btn btn-primary btn-lg" data-action="submitWarrantyClaim">
                    <i data-lucide="send" style="width:18px; height:18px;"></i> Enviar Solicitud
                </button>
                <button class="btn btn-secondary btn-lg" onclick="AB.Router.navigate('home')">Cancelar</button>
            </div>
        </div>`;
    },

    tracking() {
        const user = AB.Auth.currentUser;
        const claims = AB.DB.getClaimsByDistributor(user.id);
        const statusLabels = { pending: 'Recibida', ai_reviewing: 'IA Analizando', under_review: 'En revision tecnica', approved: 'Aprobada', rejected: 'Rechazada', in_repair: 'En reparacion', shipped: 'Enviado', completed: 'Completada', cancelled: 'Cancelada' };
        const statusBadge = { pending: 'warning', ai_reviewing: 'info', under_review: 'info', approved: 'success', rejected: 'error', in_repair: 'warning', shipped: 'info', completed: 'success', cancelled: 'neutral' };

        return `
        <div class="page-header">
            <h1>Seguimiento de Garantias</h1>
            <p>Rastrea el estado de tus solicitudes de garantia</p>
        </div>

        ${claims.length === 0 ? `
        <div class="empty-state">
            <i data-lucide="search"></i>
            <h3>Sin solicitudes</h3>
            <p>No tienes solicitudes de garantia registradas.</p>
        </div>` : `
        <div style="display:flex; flex-direction:column; gap:var(--sp-5);">
            ${claims.map(claim => {
                const history = AB.DB.getClaimHistory(claim.id);
                const statusOrder = ['pending', 'ai_reviewing', 'under_review', 'approved', 'in_repair', 'shipped', 'completed'];
                const currentIdx = statusOrder.indexOf(claim.status);

                return `
                <div class="card">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--sp-5);">
                        <div>
                            <div style="display:flex; align-items:center; gap:var(--sp-3); margin-bottom:var(--sp-2);">
                                <h3>${claim.client_name}</h3>
                                <span class="badge badge-${statusBadge[claim.status]}">${statusLabels[claim.status]}</span>
                            </div>
                            <p class="text-sm text-muted">
                                <strong>Tracking:</strong> ${claim.tracking_id} |
                                <strong>Serial:</strong> ${claim.device_serial} |
                                <strong>Modelo:</strong> ${claim.device_model}
                            </p>
                        </div>
                    </div>

                    ${claim.ai_diagnosis ? `
                    <div style="background:var(--info-light); padding:var(--sp-4); border-radius:var(--radius-md); margin-bottom:var(--sp-5);">
                        <div style="display:flex; align-items:center; gap:var(--sp-2); margin-bottom:var(--sp-2);">
                            <i data-lucide="brain" style="width:16px; height:16px; color:var(--info);"></i>
                            <span class="text-caps" style="color:var(--info);">Diagnostico IA</span>
                        </div>
                        <p class="text-sm">${claim.ai_diagnosis}</p>
                    </div>` : ''}

                    <!-- Timeline -->
                    <div class="timeline">
                        ${history.map((h, idx) => `
                        <div class="timeline-item ${idx === history.length - 1 ? 'active' : 'completed'}">
                            <div class="timeline-dot"></div>
                            <div class="timeline-content">
                                <h4>${statusLabels[h.status] || h.status}</h4>
                                <p>${h.notes || ''}</p>
                                <div class="timeline-date">${new Date(h.created_at).toLocaleString('es')}</div>
                            </div>
                        </div>`).join('')}
                    </div>
                </div>`;
            }).join('')}
        </div>`}`;
    }
};
