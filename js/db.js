/* ============================================================
   AB HUB+ Data Layer
   localStorage-based with Supabase-ready structure
   ============================================================ */
window.AB = window.AB || {};

AB.DB = {
    PREFIX: 'ab_hub_',

    init() {
        if (!this.get('initialized')) {
            this.seedData();
            this.set('initialized', true);
        }
    },

    // --- Core CRUD ---
    get(key) {
        try { return JSON.parse(localStorage.getItem(this.PREFIX + key)); }
        catch { return null; }
    },
    set(key, value) { localStorage.setItem(this.PREFIX + key, JSON.stringify(value)); },
    remove(key) { localStorage.removeItem(this.PREFIX + key); },

    // --- Collection helpers ---
    getAll(collection) { return this.get(collection) || []; },
    getById(collection, id) { return this.getAll(collection).find(item => item.id === id); },

    insert(collection, item) {
        const items = this.getAll(collection);
        item.id = item.id || this.generateId();
        item.created_at = item.created_at || new Date().toISOString();
        items.push(item);
        this.set(collection, items);
        return item;
    },

    update(collection, id, updates) {
        const items = this.getAll(collection);
        const idx = items.findIndex(item => item.id === id);
        if (idx === -1) return null;
        items[idx] = { ...items[idx], ...updates, updated_at: new Date().toISOString() };
        this.set(collection, items);
        return items[idx];
    },

    delete(collection, id) {
        const items = this.getAll(collection).filter(item => item.id !== id);
        this.set(collection, items);
    },

    query(collection, filterFn) {
        return this.getAll(collection).filter(filterFn);
    },

    generateId() { return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6); },

    generateTrackingId(prefix) {
        const year = new Date().getFullYear();
        const count = this.get(`${prefix}_counter`) || 0;
        const next = count + 1;
        this.set(`${prefix}_counter`, next);
        return `${prefix}-${year}-${String(next).padStart(5, '0')}`;
    },

    // --- Seed Data ---
    seedData() {
        // Countries
        this.set('countries', [
            { code: 'COL', name: 'Colombia', currency: 'COP', flag: '\ud83c\udde8\ud83c\uddf4', phone_prefix: '+57' },
            { code: 'MEX', name: 'Mexico', currency: 'MXN', flag: '\ud83c\uddf2\ud83c\uddfd', phone_prefix: '+52' },
            { code: 'ARG', name: 'Argentina', currency: 'ARS', flag: '\ud83c\udde6\ud83c\uddf7', phone_prefix: '+54' },
            { code: 'CRI', name: 'Costa Rica', currency: 'CRC', flag: '\ud83c\udde8\ud83c\uddf7', phone_prefix: '+506' },
            { code: 'CHL', name: 'Chile', currency: 'CLP', flag: '\ud83c\udde8\ud83c\uddf1', phone_prefix: '+56' },
            { code: 'PER', name: 'Peru', currency: 'PEN', flag: '\ud83c\uddf5\ud83c\uddea', phone_prefix: '+51' }
        ]);

        // Products
        this.set('products', [
            { id: 'PRD-001', name: 'Marvel CI', category: 'implant', model: 'HiRes Ultra 3D', description: 'Implante coclear de ultima generacion con tecnologia HiRes Ultra 3D', price: 0, image_url: '' },
            { id: 'PRD-002', name: 'Naida CI Marvel', category: 'processor', model: 'M90', description: 'Procesador de sonido con conectividad directa Bluetooth', price: 0, image_url: '' },
            { id: 'PRD-003', name: 'Sky CI Marvel', category: 'processor', model: 'Sky M', description: 'Procesador pediatrico con diseno resistente', price: 0, image_url: '' },
            { id: 'PRD-004', name: 'T-Mic 2', category: 'accessory', model: 'T-Mic 2', description: 'Microfono con posicion natural del oido', price: 85, image_url: '' },
            { id: 'PRD-005', name: 'AquaCase', category: 'accessory', model: 'AquaCase', description: 'Proteccion acuatica IP68 para procesador', price: 120, image_url: '' },
            { id: 'PRD-006', name: 'Cable de carga', category: 'accessory', model: 'PowerCel Cable', description: 'Cable USB-C de carga rapida', price: 25, image_url: '' },
            { id: 'PRD-007', name: 'Kit de secado', category: 'accessory', model: 'DryKit Pro', description: 'Kit electronico de secado nocturno UV', price: 65, image_url: '' },
            { id: 'PRD-008', name: 'Bateria recargable', category: 'accessory', model: 'PowerCel Slim', description: 'Bateria compacta recargable 16h', price: 95, image_url: '' }
        ]);

        // Checklist Templates
        this.set('checklist_templates', [
            { id: 'CHK-001', name: 'Limpiar T-Mic', description: 'Limpia el microfono T-Mic con un pano suave y seco', icon: 'mic', frequency: 'daily', points: 5, order: 1 },
            { id: 'CHK-002', name: 'Revisar cable', description: 'Inspecciona el cable de conexion por danos visibles', icon: 'cable', frequency: 'daily', points: 5, order: 2 },
            { id: 'CHK-003', name: 'Secar procesador', description: 'Coloca el procesador en el kit de secado durante la noche', icon: 'droplets', frequency: 'daily', points: 10, order: 3 },
            { id: 'CHK-004', name: 'Verificar bateria', description: 'Revisa el nivel de carga y estado de la bateria', icon: 'battery-full', frequency: 'daily', points: 5, order: 4 },
            { id: 'CHK-005', name: 'Limpiar imanes', description: 'Limpia los imanes con alcohol isopropilico', icon: 'magnet', frequency: 'weekly', points: 15, order: 5 },
            { id: 'CHK-006', name: 'Test de sonido', description: 'Realiza la prueba de sonido con la app AB', icon: 'volume-2', frequency: 'daily', points: 10, order: 6 }
        ]);

        // Tutorials
        this.set('tutorials', [
            { id: 'TUT-001', title: 'Primeros pasos con Marvel CI', description: 'Guia completa para nuevos usuarios', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 12, category: 'setup', points: 30, completed: false },
            { id: 'TUT-002', title: 'Cuidado diario del procesador', description: 'Rutina de mantenimiento esencial', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 8, category: 'care', points: 20, completed: false },
            { id: 'TUT-003', title: 'Conectividad Bluetooth', description: 'Conecta tu procesador a dispositivos', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 10, category: 'features', points: 20, completed: false },
            { id: 'TUT-004', title: 'Limpieza del T-Mic', description: 'Limpieza correcta del microfono', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 5, category: 'care', points: 15, completed: false },
            { id: 'TUT-005', title: 'Solucion de problemas', description: 'Diagnostico de problemas frecuentes', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 15, category: 'troubleshooting', points: 25, completed: false },
            { id: 'TUT-006', title: 'Uso en ambientes ruidosos', description: 'Programas para ambientes dificiles', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 10, category: 'features', points: 20, completed: false }
        ]);

        // Benefits
        this.set('benefits', [
            { id: 'BEN-001', name: 'Kit de limpieza gratis', description: 'Kit profesional de limpieza', icon: 'sparkles', points_required: 200, type: 'accessory' },
            { id: 'BEN-002', name: '15% descuento accesorios', description: 'En tu proxima compra', icon: 'percent', points_required: 150, type: 'discount' },
            { id: 'BEN-003', name: 'Revision audiologica', description: 'Sesion MAP gratuita', icon: 'stethoscope', points_required: 500, type: 'service' },
            { id: 'BEN-004', name: 'Bateria extra', description: 'Bateria PowerCel adicional', icon: 'battery-charging', points_required: 350, type: 'accessory' },
            { id: 'BEN-005', name: 'AquaCase gratis', description: 'Proteccion acuatica', icon: 'waves', points_required: 400, type: 'accessory' }
        ]);

        // Providers by country
        this.set('providers', [
            { id: 'PROV-001', name: 'AudioTech Colombia', country_code: 'COL', type: 'distributor', address: 'Bogota, Calle 100 #15-20', phone: '+57 1 234 5678', email: 'info@audiotech.co' },
            { id: 'PROV-002', name: 'Implantes Auditivos MX', country_code: 'MEX', type: 'distributor', address: 'CDMX, Polanco, Av Presidente 200', phone: '+52 55 9876 5432', email: 'ventas@iamx.mx' },
            { id: 'PROV-003', name: 'AB Audiologia Argentina', country_code: 'ARG', type: 'distributor', address: 'Buenos Aires, Recoleta, Av Callao 1500', phone: '+54 11 5555 6666', email: 'contacto@abarg.com' },
            { id: 'PROV-004', name: 'Centro Auditivo CR', country_code: 'CRI', type: 'service_center', address: 'San Jose, Escazu, Plaza Tempo', phone: '+506 2222 3333', email: 'info@cacr.co.cr' }
        ]);

        // Demo users
        this.set('users', [
            { id: 'USR-001', name: 'Maria Garcia', email: 'maria@email.com', role: 'cliente', country_code: 'COL', points: 280, phone: '+57 300 123 4567', created_at: '2025-06-15' },
            { id: 'USR-002', name: 'Carlos Mendez', email: 'carlos@distributor.com', role: 'distribuidor', country_code: 'MEX', company: 'Implantes Auditivos MX', created_at: '2025-03-01' },
            { id: 'USR-003', name: 'Ana Lopez', email: 'ana@ab.com', role: 'admin', country_code: 'COL', created_at: '2025-01-15' },
            { id: 'USR-004', name: 'Roberto Silva', email: 'roberto@ab.com', role: 'superadmin', country_code: 'COL', created_at: '2024-12-01' },
            { id: 'USR-005', name: 'Laura Torres', email: 'laura@clinic.com', role: 'especialista', country_code: 'ARG', license_number: 'MN-45678', created_at: '2025-04-10' }
        ]);

        // Demo devices
        this.set('devices', [
            { id: 'DEV-001', user_id: 'USR-001', product_id: 'PRD-001', serial_number: 'MV-2025-001234', model: 'Marvel CI - HiRes Ultra 3D', implant_side: 'right', purchase_date: '2025-06-15', warranty_start: '2025-06-15', warranty_expiry: '2028-06-15', status: 'active' },
            { id: 'DEV-002', user_id: 'USR-001', product_id: 'PRD-002', serial_number: 'NM-2025-005678', model: 'Naida CI Marvel M90', implant_side: 'right', purchase_date: '2025-06-15', warranty_start: '2025-06-15', warranty_expiry: '2027-06-15', status: 'active' }
        ]);

        // Demo warranty claims
        this.set('warranty_claims', [
            { id: 'WC-001', tracking_id: 'WC-2026-00001', distributor_id: 'USR-002', client_name: 'Pedro Ramirez', device_serial: 'NM-2024-009876', device_model: 'Naida CI Marvel', issue_description: 'El procesador no enciende despues de cambio de bateria', status: 'under_review', ai_diagnosis: 'Posible fallo en conector de bateria. Recomendacion: revision en centro de servicio.', country_code: 'MEX', created_at: '2026-03-20' },
            { id: 'WC-002', tracking_id: 'WC-2026-00002', distributor_id: 'USR-002', client_name: 'Sofia Herrera', device_serial: 'SK-2025-003456', device_model: 'Sky CI Marvel', issue_description: 'Intermitencia en el sonido del lado derecho', status: 'approved', ai_diagnosis: 'Patron consistente con desgaste de cable. Cubierto por garantia.', country_code: 'MEX', created_at: '2026-04-01' }
        ]);

        // Demo claim history
        this.set('claim_status_history', [
            { id: 'CSH-001', claim_id: 'WC-001', status: 'pending', notes: 'Solicitud recibida', created_at: '2026-03-20T10:00:00' },
            { id: 'CSH-002', claim_id: 'WC-001', status: 'ai_reviewing', notes: 'IA analizando fotos del dispositivo', created_at: '2026-03-20T10:05:00' },
            { id: 'CSH-003', claim_id: 'WC-001', status: 'under_review', notes: 'En revision por equipo tecnico', created_at: '2026-03-21T09:00:00' },
            { id: 'CSH-004', claim_id: 'WC-002', status: 'pending', notes: 'Solicitud recibida', created_at: '2026-04-01T14:00:00' },
            { id: 'CSH-005', claim_id: 'WC-002', status: 'approved', notes: 'Garantia aprobada - enviar dispositivo', created_at: '2026-04-03T11:00:00' }
        ]);

        // Demo PQRs
        this.set('pqrs', [
            { id: 'PQR-001', tracking_id: 'PQR-2026-00001', user_id: 'USR-001', type: 'peticion', subject: 'Solicitud de accesorios adicionales', description: 'Necesito un cable de repuesto para mi procesador Naida CI', status: 'in_progress', priority: 'medium', country_code: 'COL', created_at: '2026-03-25' }
        ]);

        // Demo inventory
        this.set('inventory', [
            { id: 'INV-001', distributor_id: 'USR-002', product_id: 'PRD-004', product_name: 'T-Mic 2', quantity: 12, min_stock: 5, country_code: 'MEX' },
            { id: 'INV-002', distributor_id: 'USR-002', product_id: 'PRD-005', product_name: 'AquaCase', quantity: 3, min_stock: 5, country_code: 'MEX' },
            { id: 'INV-003', distributor_id: 'USR-002', product_id: 'PRD-006', product_name: 'Cable de carga', quantity: 25, min_stock: 10, country_code: 'MEX' },
            { id: 'INV-004', distributor_id: 'USR-002', product_id: 'PRD-007', product_name: 'Kit de secado', quantity: 8, min_stock: 5, country_code: 'MEX' },
            { id: 'INV-005', distributor_id: 'USR-002', product_id: 'PRD-008', product_name: 'Bateria recargable', quantity: 2, min_stock: 5, country_code: 'MEX' }
        ]);

        // Demo campaigns
        this.set('campaigns', [
            { id: 'CMP-001', title: 'Semana del Cuidado Auditivo', description: 'Completa tu checklist diario durante 7 dias y gana puntos dobles', type: 'promotion', target_roles: ['cliente'], target_countries: null, start_date: '2026-04-07', end_date: '2026-04-14', active: true, created_by: 'USR-004' },
            { id: 'CMP-002', title: 'Tutorial Marvel CI - Lanzamiento', description: 'Nuevos videos de capacitacion disponibles para procesador Marvel', type: 'educational', target_roles: ['cliente', 'especialista'], target_countries: ['COL', 'MEX'], start_date: '2026-04-01', end_date: '2026-04-30', active: true, created_by: 'USR-004' }
        ]);

        // Demo checklist completions
        this.set('checklist_completions', []);
        this.set('tutorial_completions', []);
        this.set('benefit_redemptions', []);
        this.set('accessory_requests', []);
        this.set('audit_log', []);
    },

    // --- Utility queries ---
    getUsersByCountry(countryCode) {
        return this.query('users', u => u.country_code === countryCode);
    },

    getUsersByRole(role) {
        return this.query('users', u => u.role === role);
    },

    getDevicesByUser(userId) {
        return this.query('devices', d => d.user_id === userId);
    },

    getWarrantyDaysLeft(warrantyExpiry) {
        const now = new Date();
        const expiry = new Date(warrantyExpiry);
        const diff = expiry - now;
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    },

    getClaimsByDistributor(distributorId) {
        return this.query('warranty_claims', c => c.distributor_id === distributorId);
    },

    getClaimHistory(claimId) {
        return this.query('claim_status_history', h => h.claim_id === claimId)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    },

    getPQRsByUser(userId) {
        return this.query('pqrs', p => p.user_id === userId);
    },

    getInventoryByDistributor(distributorId) {
        return this.query('inventory', i => i.distributor_id === distributorId);
    },

    getProvidersByCountry(countryCode) {
        return this.query('providers', p => p.country_code === countryCode);
    },

    getTodayChecklist(userId) {
        const today = new Date().toISOString().split('T')[0];
        const completions = this.query('checklist_completions',
            c => c.user_id === userId && c.completed_at && c.completed_at.startsWith(today)
        );
        const templates = this.getAll('checklist_templates');
        return templates.map(t => ({
            ...t,
            completed: completions.some(c => c.checklist_id === t.id)
        }));
    },

    completeChecklist(userId, checklistId, deviceId) {
        const template = this.getById('checklist_templates', checklistId);
        if (!template) return null;
        const completion = this.insert('checklist_completions', {
            user_id: userId, device_id: deviceId,
            checklist_id: checklistId, points_earned: template.points,
            completed_at: new Date().toISOString()
        });
        // Add points to user
        const user = this.getById('users', userId);
        if (user) this.update('users', userId, { points: (user.points || 0) + template.points });
        return completion;
    },

    completeTutorial(userId, tutorialId) {
        const tutorial = this.getById('tutorials', tutorialId);
        if (!tutorial) return null;
        const existing = this.query('tutorial_completions',
            c => c.user_id === userId && c.tutorial_id === tutorialId
        );
        if (existing.length > 0) return existing[0];
        const completion = this.insert('tutorial_completions', {
            user_id: userId, tutorial_id: tutorialId,
            points_earned: tutorial.points,
            completed_at: new Date().toISOString()
        });
        const user = this.getById('users', userId);
        if (user) this.update('users', userId, { points: (user.points || 0) + tutorial.points });
        return completion;
    },

    getStats() {
        return {
            totalUsers: this.getAll('users').length,
            totalClients: this.getUsersByRole('cliente').length,
            totalDistributors: this.getUsersByRole('distribuidor').length,
            totalDevices: this.getAll('devices').length,
            pendingClaims: this.query('warranty_claims', c => c.status === 'pending' || c.status === 'under_review').length,
            openPQRs: this.query('pqrs', p => p.status === 'open' || p.status === 'in_progress').length,
            activeCampaigns: this.query('campaigns', c => c.active).length,
            countriesActive: this.getAll('countries').length
        };
    },

    clearAll() {
        Object.keys(localStorage)
            .filter(k => k.startsWith(this.PREFIX))
            .forEach(k => localStorage.removeItem(k));
    }
};
