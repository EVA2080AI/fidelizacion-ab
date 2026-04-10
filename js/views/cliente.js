/* ============================================================
   AB HUB+ Cliente Views
   ============================================================ */
window.AB = window.AB || {};
AB.Views = AB.Views || {};

AB.Views.cliente = {
    home() {
        const user = AB.Auth.currentUser;
        const devices = AB.DB.getDevicesByUser(user.id);
        const checklist = AB.DB.getTodayChecklist(user.id);
        const completedToday = checklist.filter(c => c.completed).length;
        const totalChecklist = checklist.length;
        const pqrs = AB.DB.getPQRsByUser(user.id);
        const openPqrs = pqrs.filter(p => p.status === 'open' || p.status === 'in_progress').length;

        // Warranty info for first device
        const device = devices[0];
        const daysLeft = device ? AB.DB.getWarrantyDaysLeft(device.warranty_expiry) : 0;
        const warrantyPercent = device ? Math.min(100, Math.max(0, (daysLeft / 1095) * 100)) : 0;

        AB.Auth.refreshUser();

        const greeting = new Date().getHours() < 12 ? 'Buenos dias' : new Date().getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';

        return `
        <div class="page-header">
            <h1>${greeting}, ${user.name.split(' ')[0]}</h1>
            <p>Tu centro de control de dispositivos Advanced Bionics</p>
        </div>

        <!-- Warranty Hero Card -->
        ${device ? `
        <div class="warranty-card" onclick="AB.Router.navigate('warranty')">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; position:relative; z-index:1;">
                <div>
                    <p style="opacity:0.7; font-size:0.8125rem; margin-bottom:var(--sp-2); text-transform:uppercase; letter-spacing:0.06em; font-weight:600;">Garantia &mdash; ${device.model}</p>
                    <div class="warranty-days">${daysLeft}</div>
                    <div class="warranty-label">dias restantes de cobertura</div>
                </div>
                <div style="text-align:right; opacity:0.7; font-size:0.8125rem;">
                    <p style="margin-bottom:4px;">S/N: ${device.serial_number}</p>
                    <p>Vence: ${new Date(device.warranty_expiry).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    ${daysLeft < 90 ? '<span class="badge" style="background:rgba(220,38,38,0.3); color:#fff; margin-top:8px;">Renovar pronto</span>' : ''}
                </div>
            </div>
            <div class="progress" style="margin-top:var(--sp-6); background:rgba(255,255,255,0.15); height:6px;">
                <div class="progress-bar" style="width:${warrantyPercent}%; background:${daysLeft < 90 ? '#F87171' : daysLeft < 180 ? '#FBBF24' : 'rgba(255,255,255,0.8)'};"></div>
            </div>
        </div>` : `
        <div class="card" style="text-align:center; padding:var(--sp-10);">
            <div style="width:72px; height:72px; background:var(--ab-blue-50); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto var(--sp-4);">
                <i data-lucide="cpu" style="width:36px; height:36px; color:var(--ab-blue);"></i>
            </div>
            <h3>Registra tu dispositivo</h3>
            <p class="text-muted" style="max-width:320px; margin:var(--sp-2) auto var(--sp-5);">Contacta a tu distribuidor local para vincular tu implante o procesador.</p>
            <button class="btn btn-primary" onclick="AB.Chat.sendMessage('Como registro mi dispositivo?')">Preguntar a Melody</button>
        </div>`}

        <div style="height:var(--sp-6);"></div>

        <!-- Quick Stats -->
        <div class="grid grid-4" style="margin-bottom:var(--sp-6);">
            <div class="stat-card" onclick="AB.Router.navigate('benefits')" style="cursor:pointer;">
                <div class="stat-icon" style="background:var(--warning-light); color:var(--warning);"><i data-lucide="star"></i></div>
                <div class="stat-value" style="color:var(--warning);">${user.points || 0}</div>
                <div class="stat-label">Puntos</div>
            </div>
            <div class="stat-card" onclick="AB.Router.navigate('checklist')" style="cursor:pointer;">
                <div class="stat-icon" style="background:var(--success-light); color:var(--success);"><i data-lucide="check-square"></i></div>
                <div class="stat-value">${completedToday}/${totalChecklist}</div>
                <div class="stat-label">Checklist hoy</div>
            </div>
            <div class="stat-card" onclick="AB.Router.navigate('tutorials')" style="cursor:pointer;">
                <div class="stat-icon" style="background:var(--info-light); color:var(--info);"><i data-lucide="play-circle"></i></div>
                <div class="stat-value">${AB.DB.getAll('tutorials').length}</div>
                <div class="stat-label">Tutoriales</div>
            </div>
            <div class="stat-card" onclick="AB.Router.navigate('pqrs')" style="cursor:pointer;">
                <div class="stat-icon" style="background:var(--error-light); color:var(--error);"><i data-lucide="message-circle"></i></div>
                <div class="stat-value">${openPqrs}</div>
                <div class="stat-label">PQRs abiertas</div>
            </div>
        </div>

        <!-- Quick Actions Grid -->
        <h2 style="margin-bottom:var(--sp-4);">Acciones Rapidas</h2>
        <div class="grid grid-3">
            <div class="card card-clickable" onclick="AB.Router.navigate('checklist')">
                <div style="display:flex; align-items:center; gap:var(--sp-3); margin-bottom:var(--sp-3);">
                    <div style="width:44px; height:44px; background:var(--success-light); border-radius:var(--radius-lg); display:flex; align-items:center; justify-content:center; color:var(--success);">
                        <i data-lucide="check-square"></i>
                    </div>
                    <div>
                        <h3>Checklist Diario</h3>
                        <span class="text-xs text-muted">${completedToday}/${totalChecklist} completados</span>
                    </div>
                </div>
                <p class="text-sm text-muted" style="margin-bottom:var(--sp-3);">Cuida tu dispositivo y gana puntos.</p>
                <div class="progress">
                    <div class="progress-bar success" style="width:${totalChecklist ? (completedToday / totalChecklist * 100) : 0}%;"></div>
                </div>
            </div>
            <div class="card card-clickable" onclick="AB.Router.navigate('tutorials')">
                <div style="display:flex; align-items:center; gap:var(--sp-3); margin-bottom:var(--sp-3);">
                    <div style="width:44px; height:44px; background:var(--info-light); border-radius:var(--radius-lg); display:flex; align-items:center; justify-content:center; color:var(--info);">
                        <i data-lucide="play-circle"></i>
                    </div>
                    <div>
                        <h3>Tutoriales</h3>
                        <span class="text-xs text-muted">${AB.DB.getAll('tutorials').length} disponibles</span>
                    </div>
                </div>
                <p class="text-sm text-muted">Aprende tips y gana hasta 30 pts por video.</p>
            </div>
            <div class="card card-clickable" onclick="AB.Router.navigate('accessories')">
                <div style="display:flex; align-items:center; gap:var(--sp-3); margin-bottom:var(--sp-3);">
                    <div style="width:44px; height:44px; background:var(--ab-blue-50); border-radius:var(--radius-lg); display:flex; align-items:center; justify-content:center; color:var(--ab-blue);">
                        <i data-lucide="shopping-bag"></i>
                    </div>
                    <div>
                        <h3>Accesorios</h3>
                        <span class="text-xs text-muted">${AB.DB.query('products', p => p.category === 'accessory').length} productos</span>
                    </div>
                </div>
                <p class="text-sm text-muted">Baterias, cables, kits y mas para tu procesador.</p>
            </div>
        </div>`;
    },

    warranty() {
        const user = AB.Auth.currentUser;
        const devices = AB.DB.getDevicesByUser(user.id);

        return `
        <div class="page-header">
            <h1>Mi Garantia</h1>
            <p>Estado de garantia de tus dispositivos registrados</p>
        </div>

        ${devices.length === 0 ? `
        <div class="empty-state">
            <i data-lucide="shield-off"></i>
            <h3>Sin dispositivos registrados</h3>
            <p>Contacta a tu distribuidor para registrar tus dispositivos.</p>
        </div>` : devices.map(device => {
            const daysLeft = AB.DB.getWarrantyDaysLeft(device.warranty_expiry);
            const totalDays = Math.ceil((new Date(device.warranty_expiry) - new Date(device.warranty_start)) / (1000 * 60 * 60 * 24));
            const usedDays = totalDays - daysLeft;
            const percent = Math.min(100, (usedDays / totalDays) * 100);
            const statusColor = daysLeft < 90 ? 'error' : daysLeft < 180 ? 'warning' : 'success';

            return `
            <div class="card" style="margin-bottom:var(--sp-5);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--sp-5);">
                    <div>
                        <h2>${device.model}</h2>
                        <p class="text-sm text-muted">S/N: ${device.serial_number}</p>
                    </div>
                    <span class="badge badge-${statusColor}">
                        ${daysLeft < 90 ? 'Urgente' : daysLeft < 180 ? 'Proximo a vencer' : 'Activa'}
                    </span>
                </div>

                <div class="warranty-card" style="margin-bottom:var(--sp-5);">
                    <div style="text-align:center;">
                        <div class="warranty-days">${daysLeft}</div>
                        <div class="warranty-label">dias restantes de garantia</div>
                    </div>
                    <div class="progress" style="margin-top:var(--sp-5); background:rgba(255,255,255,0.2);">
                        <div class="progress-bar" style="width:${100 - percent}%; background:${daysLeft < 90 ? 'var(--error)' : '#fff'};"></div>
                    </div>
                </div>

                <div class="grid grid-2">
                    <div>
                        <p class="text-caps" style="margin-bottom:var(--sp-1);">Lado</p>
                        <p style="font-weight:600;">${device.implant_side === 'right' ? 'Derecho' : device.implant_side === 'left' ? 'Izquierdo' : 'Bilateral'}</p>
                    </div>
                    <div>
                        <p class="text-caps" style="margin-bottom:var(--sp-1);">Estado</p>
                        <p style="font-weight:600;">${device.status === 'active' ? 'Activo' : device.status === 'in_repair' ? 'En reparacion' : device.status}</p>
                    </div>
                    <div>
                        <p class="text-caps" style="margin-bottom:var(--sp-1);">Fecha de compra</p>
                        <p style="font-weight:600;">${new Date(device.purchase_date).toLocaleDateString('es')}</p>
                    </div>
                    <div>
                        <p class="text-caps" style="margin-bottom:var(--sp-1);">Vencimiento</p>
                        <p style="font-weight:600; color:var(--${statusColor});">${new Date(device.warranty_expiry).toLocaleDateString('es')}</p>
                    </div>
                </div>
            </div>`;
        }).join('')}`;
    },

    checklist() {
        const user = AB.Auth.currentUser;
        const checklist = AB.DB.getTodayChecklist(user.id);
        const completed = checklist.filter(c => c.completed).length;
        const totalPoints = checklist.reduce((s, c) => s + c.points, 0);
        const earnedPoints = checklist.filter(c => c.completed).reduce((s, c) => s + c.points, 0);

        return `
        <div class="page-header">
            <h1>Checklist Diario</h1>
            <p>Cuida tu dispositivo y gana puntos de fidelidad</p>
        </div>

        <div style="display:flex; gap:var(--sp-4); margin-bottom:var(--sp-6); flex-wrap:wrap;">
            <div class="stat-card" style="flex:1; min-width:140px;">
                <div class="stat-value" style="color:var(--success);">${completed}/${checklist.length}</div>
                <div class="stat-label">Completados hoy</div>
                <div class="progress" style="margin-top:var(--sp-2);">
                    <div class="progress-bar success" style="width:${checklist.length ? (completed / checklist.length * 100) : 0}%;"></div>
                </div>
            </div>
            <div class="stat-card" style="flex:1; min-width:140px;">
                <div class="stat-value" style="color:var(--warning);">${earnedPoints}/${totalPoints}</div>
                <div class="stat-label">Puntos ganados hoy</div>
            </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:var(--sp-3);">
            ${checklist.map(item => `
            <div class="checklist-item ${item.completed ? 'completed' : ''}"
                 data-action="toggleChecklist" data-id="${item.id}"
                 style="cursor:pointer;">
                <div class="check-circle">
                    ${item.completed ? '<i data-lucide="check" style="width:16px; height:16px;"></i>' : ''}
                </div>
                <div class="checklist-info">
                    <h4>${item.name}</h4>
                    <p>${item.description}</p>
                </div>
                <div style="text-align:right;">
                    <span class="badge badge-${item.completed ? 'success' : 'warning'}">
                        ${item.completed ? 'Hecho' : `+${item.points} pts`}
                    </span>
                    <p class="text-xs text-muted" style="margin-top:2px;">${item.frequency === 'daily' ? 'Diario' : item.frequency === 'weekly' ? 'Semanal' : 'Mensual'}</p>
                </div>
            </div>`).join('')}
        </div>`;
    },

    accessories() {
        const products = AB.DB.query('products', p => p.category === 'accessory');

        return `
        <div class="page-header">
            <h1>Accesorios</h1>
            <p>Complementos compatibles con tus dispositivos Advanced Bionics</p>
        </div>

        <div class="grid grid-3">
            ${products.map(p => `
            <div class="card">
                <div style="height:120px; background:var(--gray-50); border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; margin-bottom:var(--sp-4);">
                    <i data-lucide="package" style="width:48px; height:48px; color:var(--gray-300);"></i>
                </div>
                <h3>${p.name}</h3>
                <p class="text-sm text-muted" style="margin:var(--sp-2) 0;">${p.description}</p>
                ${p.price ? `<p style="font-size:1.25rem; font-weight:700; color:var(--ab-blue); margin:var(--sp-3) 0;">$${p.price} USD</p>` : ''}
                <button class="btn btn-primary btn-block btn-sm" data-action="requestAccessory" data-id="${p.id}">
                    Solicitar
                </button>
            </div>`).join('')}
        </div>`;
    },

    pqrs() {
        const user = AB.Auth.currentUser;
        const pqrs = AB.DB.getPQRsByUser(user.id);
        const typeLabels = { peticion: 'Peticion', queja: 'Queja', reclamo: 'Reclamo', sugerencia: 'Sugerencia' };
        const statusLabels = { open: 'Abierto', in_progress: 'En progreso', resolved: 'Resuelto', closed: 'Cerrado' };
        const statusBadge = { open: 'info', in_progress: 'warning', resolved: 'success', closed: 'neutral' };

        return `
        <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
                <h1>Mis PQRs</h1>
                <p>Peticiones, Quejas, Reclamos y Sugerencias</p>
            </div>
            <button class="btn btn-primary" data-action="newPQR">
                <i data-lucide="plus" style="width:16px; height:16px;"></i> Nueva PQR
            </button>
        </div>

        ${pqrs.length === 0 ? `
        <div class="empty-state">
            <i data-lucide="message-circle"></i>
            <h3>Sin PQRs registradas</h3>
            <p>Crea tu primera peticion, queja, reclamo o sugerencia.</p>
        </div>` : `
        <div class="table-wrapper">
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tipo</th>
                        <th>Asunto</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    ${pqrs.map(p => `
                    <tr style="cursor:pointer;" data-action="viewPQR" data-id="${p.id}">
                        <td style="font-family:monospace; font-weight:600;">${p.tracking_id}</td>
                        <td><span class="badge badge-info">${typeLabels[p.type] || p.type}</span></td>
                        <td>${p.subject}</td>
                        <td><span class="badge badge-${statusBadge[p.status]}">${statusLabels[p.status]}</span></td>
                        <td class="text-muted">${new Date(p.created_at).toLocaleDateString('es')}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`}`;
    },

    benefits() {
        const user = AB.Auth.currentUser;
        AB.Auth.refreshUser();
        const points = user.points || 0;
        const benefits = AB.DB.getAll('benefits');
        const redemptions = AB.DB.query('benefit_redemptions', r => r.user_id === user.id);

        return `
        <div class="page-header">
            <h1>Programa de Beneficios</h1>
            <p>Gana puntos completando tutoriales y tu checklist diario</p>
        </div>

        <div class="points-card" style="margin-bottom:var(--sp-6);">
            <p class="points-label">Tus puntos acumulados</p>
            <div class="points-value">${points}</div>
            <p class="points-label" style="margin-top:var(--sp-2);">Completa actividades para ganar mas puntos</p>
        </div>

        <h2 style="margin-bottom:var(--sp-4);">Canjear Beneficios</h2>
        <div style="display:flex; flex-direction:column; gap:var(--sp-3);">
            ${benefits.map(b => {
                const canRedeem = points >= b.points_required;
                const alreadyRedeemed = redemptions.some(r => r.benefit_id === b.id);
                return `
                <div class="benefit-item">
                    <div class="benefit-icon"><i data-lucide="${b.icon || 'gift'}"></i></div>
                    <div class="benefit-info">
                        <h4>${b.name}</h4>
                        <p class="text-sm text-muted">${b.description}</p>
                    </div>
                    <div style="text-align:right;">
                        <div class="benefit-cost">${b.points_required} pts</div>
                        ${alreadyRedeemed
                            ? '<span class="badge badge-success">Canjeado</span>'
                            : `<button class="btn btn-sm ${canRedeem ? 'btn-primary' : 'btn-secondary'}"
                                  ${canRedeem ? '' : 'disabled'} data-action="redeemBenefit" data-id="${b.id}">
                                  ${canRedeem ? 'Canjear' : 'Insuficiente'}
                              </button>`
                        }
                    </div>
                </div>`;
            }).join('')}
        </div>

        <div class="card" style="margin-top:var(--sp-6);">
            <h3 style="margin-bottom:var(--sp-3);">Como ganar puntos</h3>
            <div style="display:flex; flex-direction:column; gap:var(--sp-2);">
                <div style="display:flex; justify-content:space-between;">
                    <span class="text-sm">Completar item del checklist diario</span>
                    <span class="badge badge-warning">+5-15 pts</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span class="text-sm">Completar un tutorial</span>
                    <span class="badge badge-warning">+15-30 pts</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span class="text-sm">Checklist completo del dia</span>
                    <span class="badge badge-warning">+50 pts bonus</span>
                </div>
            </div>
        </div>`;
    }
};
