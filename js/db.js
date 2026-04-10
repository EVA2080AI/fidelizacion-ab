/* ============================================================
   AB HUB+ Data Layer
   Dual mode: Supabase (when configured) or localStorage (fallback)
   ============================================================ */
window.AB = window.AB || {};

AB.DB = {
    PREFIX: 'ab_hub_',
    useSupabase: false,

    init() {
        // Check if Supabase is configured
        this.useSupabase = AB.Supabase && AB.Supabase.isConfigured;

        if (!this.useSupabase) {
            // Force re-seed if data version changed (fixes flag encoding, etc.)
            const DATA_VERSION = 3;
            if (this.get('data_version') !== DATA_VERSION) {
                this.clearAll();
                this.seedData();
                this.set('data_version', DATA_VERSION);
                this.set('initialized', true);
            } else if (!this.get('initialized')) {
                this.seedData();
                this.set('initialized', true);
            }
        }
    },

    // --- Supabase-aware wrappers ---
    async asyncGetAll(collection) {
        if (this.useSupabase) return AB.Supabase.select(collection);
        return this.getAll(collection);
    },
    async asyncGetById(collection, id) {
        if (this.useSupabase) return AB.Supabase.selectOne(collection, id);
        return this.getById(collection, id);
    },
    async asyncInsert(collection, item) {
        if (this.useSupabase) return AB.Supabase.insert(collection, item);
        return this.insert(collection, item);
    },
    async asyncUpdate(collection, id, updates) {
        if (this.useSupabase) return AB.Supabase.update(collection, id, updates);
        return this.update(collection, id, updates);
    },
    async asyncDelete(collection, id) {
        if (this.useSupabase) return AB.Supabase.delete(collection, id);
        return this.delete(collection, id);
    },
    async asyncQuery(collection, filterFn, supabaseOpts) {
        if (this.useSupabase && supabaseOpts) return AB.Supabase.select(collection, supabaseOpts);
        return this.query(collection, filterFn);
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
            { code: 'COL', name: 'Colombia', currency: 'COP', flag: '🇨🇴', phone_prefix: '+57' },
            { code: 'MEX', name: 'Mexico', currency: 'MXN', flag: '🇲🇽', phone_prefix: '+52' },
            { code: 'ARG', name: 'Argentina', currency: 'ARS', flag: '🇦🇷', phone_prefix: '+54' },
            { code: 'CRI', name: 'Costa Rica', currency: 'CRC', flag: '🇨🇷', phone_prefix: '+506' },
            { code: 'CHL', name: 'Chile', currency: 'CLP', flag: '🇨🇱', phone_prefix: '+56' },
            { code: 'PER', name: 'Peru', currency: 'PEN', flag: '🇵🇪', phone_prefix: '+51' }
        ]);

        // Products
        this.set('products', [
            { id: 'PRD-001', name: 'Marvel CI', category: 'implant', model: 'HiRes Ultra 3D', description: 'Implante coclear de ultima generacion con tecnologia HiRes Ultra 3D', price: 0 },
            { id: 'PRD-002', name: 'Naida CI Marvel', category: 'processor', model: 'M90', description: 'Procesador de sonido con conectividad directa Bluetooth', price: 0 },
            { id: 'PRD-003', name: 'Sky CI Marvel', category: 'processor', model: 'Sky M', description: 'Procesador pediatrico con diseno resistente', price: 0 },
            { id: 'PRD-009', name: 'Naida CI M130', category: 'processor', model: 'M130', description: 'Procesador premium con AutoSense OS 4.0 y streaming universal', price: 0 },
            { id: 'PRD-004', name: 'T-Mic 2', category: 'accessory', model: 'T-Mic 2', description: 'Microfono con posicion natural del oido para captacion superior', price: 85 },
            { id: 'PRD-005', name: 'AquaCase', category: 'accessory', model: 'AquaCase', description: 'Proteccion acuatica IP68 para natacion y deportes acuaticos', price: 120 },
            { id: 'PRD-006', name: 'Cable de carga', category: 'accessory', model: 'PowerCel Cable', description: 'Cable USB-C de carga rapida con indicador LED', price: 25 },
            { id: 'PRD-007', name: 'Kit de secado', category: 'accessory', model: 'DryKit Pro', description: 'Kit electronico de secado nocturno UV con desinfeccion', price: 65 },
            { id: 'PRD-008', name: 'Bateria recargable', category: 'accessory', model: 'PowerCel Slim', description: 'Bateria compacta recargable con 16h de autonomia', price: 95 },
            { id: 'PRD-010', name: 'Clip de seguridad', category: 'accessory', model: 'SafeClip', description: 'Clip anti-perdida con cordon retractil para ninos', price: 18 },
            { id: 'PRD-011', name: 'Funda protectora', category: 'accessory', model: 'SoftCase', description: 'Funda de silicona para procesador, multiples colores', price: 22 },
            { id: 'PRD-012', name: 'Roger Select iN', category: 'accessory', model: 'Roger Select', description: 'Microfono inalambrico para ambientes ruidosos y reuniones', price: 950 }
        ]);

        // Checklist Templates
        this.set('checklist_templates', [
            { id: 'CHK-001', name: 'Limpiar T-Mic', description: 'Limpia el microfono T-Mic con un pano suave y seco', icon: 'mic', frequency: 'daily', points: 5, order: 1 },
            { id: 'CHK-002', name: 'Revisar cable', description: 'Inspecciona el cable de conexion por danos visibles', icon: 'cable', frequency: 'daily', points: 5, order: 2 },
            { id: 'CHK-003', name: 'Secar procesador', description: 'Coloca el procesador en el kit de secado durante la noche', icon: 'droplets', frequency: 'daily', points: 10, order: 3 },
            { id: 'CHK-004', name: 'Verificar bateria', description: 'Revisa el nivel de carga y estado de la bateria', icon: 'battery-full', frequency: 'daily', points: 5, order: 4 },
            { id: 'CHK-005', name: 'Limpiar imanes', description: 'Limpia los imanes de retencion con alcohol isopropilico', icon: 'magnet', frequency: 'weekly', points: 15, order: 5 },
            { id: 'CHK-006', name: 'Test de sonido', description: 'Realiza la prueba de tonos con la app AB MySound', icon: 'volume-2', frequency: 'daily', points: 10, order: 6 },
            { id: 'CHK-007', name: 'Revisar humedad', description: 'Verifica que no haya humedad en compartimentos del procesador', icon: 'thermometer', frequency: 'weekly', points: 15, order: 7 },
            { id: 'CHK-008', name: 'Backup de programas', description: 'Guarda una copia de tus programas MAP actuales en la app', icon: 'save', frequency: 'monthly', points: 25, order: 8 }
        ]);

        // Tutorials
        this.set('tutorials', [
            { id: 'TUT-001', title: 'Primeros pasos con Marvel CI', description: 'Guia completa de activacion y configuracion inicial', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 12, category: 'setup', points: 30 },
            { id: 'TUT-002', title: 'Cuidado diario del procesador', description: 'Rutina de mantenimiento esencial para tu equipo', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 8, category: 'care', points: 20 },
            { id: 'TUT-003', title: 'Conectividad Bluetooth', description: 'Conecta tu procesador a celulares, TV y mas', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 10, category: 'features', points: 20 },
            { id: 'TUT-004', title: 'Limpieza del T-Mic', description: 'Paso a paso para limpiar tu microfono correctamente', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 5, category: 'care', points: 15 },
            { id: 'TUT-005', title: 'Solucion de problemas comunes', description: 'Diagnostica y resuelve los problemas mas frecuentes', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 15, category: 'troubleshooting', points: 25 },
            { id: 'TUT-006', title: 'Uso en ambientes ruidosos', description: 'Aprende a usar programas para restaurantes, conciertos y mas', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 10, category: 'features', points: 20 },
            { id: 'TUT-007', title: 'Cambio de bateria paso a paso', description: 'Como cambiar la bateria sin danar el procesador', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 6, category: 'care', points: 15 },
            { id: 'TUT-008', title: 'App AB MySound: guia completa', description: 'Controla tu implante desde tu celular', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 14, category: 'features', points: 25 },
            { id: 'TUT-009', title: 'Natacion con AquaCase', description: 'Como usar tu procesador de forma segura en el agua', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 7, category: 'features', points: 20 },
            { id: 'TUT-010', title: 'Preparacion para tu cita MAP', description: 'Que llevar y como prepararte para tu sesion de ajuste', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 8, category: 'setup', points: 20 }
        ]);

        // Benefits
        this.set('benefits', [
            { id: 'BEN-001', name: 'Kit de limpieza gratis', description: 'Kit profesional de limpieza con pano, cepillo y spray', icon: 'sparkles', points_required: 200, type: 'accessory' },
            { id: 'BEN-002', name: '15% descuento accesorios', description: 'Descuento en tu proxima compra de accesorios', icon: 'percent', points_required: 150, type: 'discount' },
            { id: 'BEN-003', name: 'Revision audiologica', description: 'Sesion de ajuste MAP gratuita con especialista certificado', icon: 'stethoscope', points_required: 500, type: 'service' },
            { id: 'BEN-004', name: 'Bateria extra', description: 'Una bateria PowerCel Slim adicional', icon: 'battery-charging', points_required: 350, type: 'accessory' },
            { id: 'BEN-005', name: 'AquaCase gratis', description: 'Proteccion acuatica para tu procesador', icon: 'waves', points_required: 400, type: 'accessory' },
            { id: 'BEN-006', name: 'Envio prioritario', description: 'Envio express gratis en tu proximo pedido', icon: 'truck', points_required: 100, type: 'service' },
            { id: 'BEN-007', name: 'Funda personalizada', description: 'Funda SoftCase en el color de tu eleccion', icon: 'palette', points_required: 180, type: 'accessory' },
            { id: 'BEN-008', name: '30% en Roger Select', description: 'Descuento especial en microfono Roger Select iN', icon: 'mic', points_required: 800, type: 'discount' }
        ]);

        // Providers by country
        this.set('providers', [
            { id: 'PROV-001', name: 'AudioTech Colombia', country_code: 'COL', type: 'distributor', address: 'Bogota, Calle 100 #15-20 Of. 301', phone: '+57 1 234 5678', email: 'info@audiotech.co' },
            { id: 'PROV-005', name: 'Clinica Rivas Audicion', country_code: 'COL', type: 'service_center', address: 'Medellin, El Poblado, Cra 43A #1-50', phone: '+57 4 444 5555', email: 'citas@rivasaudicion.co' },
            { id: 'PROV-006', name: 'Centro Audiologico del Caribe', country_code: 'COL', type: 'service_center', address: 'Barranquilla, Calle 84 #51-10', phone: '+57 5 333 2222', email: 'contacto@cacdelcaribe.co' },
            { id: 'PROV-002', name: 'Implantes Auditivos MX', country_code: 'MEX', type: 'distributor', address: 'CDMX, Polanco, Av Presidente Masaryk 200', phone: '+52 55 9876 5432', email: 'ventas@iamx.mx' },
            { id: 'PROV-007', name: 'AudioMed Monterrey', country_code: 'MEX', type: 'service_center', address: 'Monterrey, San Pedro, Av Vasconcelos 300', phone: '+52 81 8888 9999', email: 'atencion@audiomed.mx' },
            { id: 'PROV-003', name: 'AB Audiologia Argentina', country_code: 'ARG', type: 'distributor', address: 'Buenos Aires, Recoleta, Av Callao 1500', phone: '+54 11 5555 6666', email: 'contacto@abarg.com' },
            { id: 'PROV-004', name: 'Centro Auditivo CR', country_code: 'CRI', type: 'service_center', address: 'San Jose, Escazu, Plaza Tempo Local 12', phone: '+506 2222 3333', email: 'info@cacr.co.cr' },
            { id: 'PROV-008', name: 'SonoChile', country_code: 'CHL', type: 'distributor', address: 'Santiago, Providencia, Av Providencia 2309', phone: '+56 2 7777 8888', email: 'contacto@sonochile.cl' },
            { id: 'PROV-009', name: 'AB Peru Distribucion', country_code: 'PER', type: 'distributor', address: 'Lima, San Isidro, Av Javier Prado Este 4600', phone: '+51 1 444 5555', email: 'ventas@abperu.pe' }
        ]);

        // --- USERS (30 across all roles & countries) ---
        this.set('users', [
            // Clientes Colombia
            { id: 'USR-001', name: 'Maria Garcia Restrepo', email: 'maria.garcia@email.com', role: 'cliente', country_code: 'COL', points: 485, phone: '+57 300 123 4567', created_at: '2025-03-12' },
            { id: 'USR-010', name: 'Andres Felipe Rojas', email: 'andres.rojas@email.com', role: 'cliente', country_code: 'COL', points: 120, phone: '+57 310 987 6543', created_at: '2025-09-20' },
            { id: 'USR-011', name: 'Valentina Moreno Diaz', email: 'valentina.moreno@email.com', role: 'cliente', country_code: 'COL', points: 340, phone: '+57 321 555 7890', created_at: '2025-06-08' },
            { id: 'USR-012', name: 'Santiago Ospina Ruiz', email: 'santiago.ospina@email.com', role: 'cliente', country_code: 'COL', points: 55, phone: '+57 315 222 3344', created_at: '2026-01-15' },
            // Clientes Mexico
            { id: 'USR-013', name: 'Gabriela Hernandez Luna', email: 'gabriela.hernandez@email.com', role: 'cliente', country_code: 'MEX', points: 210, phone: '+52 55 1234 5678', created_at: '2025-07-03' },
            { id: 'USR-014', name: 'Diego Ramirez Torres', email: 'diego.ramirez@email.com', role: 'cliente', country_code: 'MEX', points: 670, phone: '+52 33 8765 4321', created_at: '2024-11-22' },
            { id: 'USR-015', name: 'Camila Flores Gutierrez', email: 'camila.flores@email.com', role: 'cliente', country_code: 'MEX', points: 90, phone: '+52 81 5555 6666', created_at: '2026-02-10' },
            // Clientes Argentina
            { id: 'USR-016', name: 'Matias Fernandez Ruiz', email: 'matias.fernandez@email.com', role: 'cliente', country_code: 'ARG', points: 415, phone: '+54 11 4444 5555', created_at: '2025-04-18' },
            { id: 'USR-017', name: 'Lucia Alvarez Gomez', email: 'lucia.alvarez@email.com', role: 'cliente', country_code: 'ARG', points: 150, phone: '+54 11 6666 7777', created_at: '2025-10-05' },
            // Clientes otros paises
            { id: 'USR-018', name: 'Isabella Vargas Mora', email: 'isabella.vargas@email.com', role: 'cliente', country_code: 'CRI', points: 305, phone: '+506 8888 9999', created_at: '2025-05-30' },
            { id: 'USR-019', name: 'Tomas Salazar Vega', email: 'tomas.salazar@email.com', role: 'cliente', country_code: 'CHL', points: 180, phone: '+56 9 7777 8888', created_at: '2025-08-14' },
            { id: 'USR-020', name: 'Mariana Castillo Paredes', email: 'mariana.castillo@email.com', role: 'cliente', country_code: 'PER', points: 75, phone: '+51 999 888 777', created_at: '2026-01-28' },
            // Distribuidores
            { id: 'USR-002', name: 'Carlos Mendez Aguilar', email: 'carlos.mendez@iamx.mx', role: 'distribuidor', country_code: 'MEX', company: 'Implantes Auditivos MX', phone: '+52 55 9876 5432', created_at: '2024-06-01' },
            { id: 'USR-021', name: 'Patricia Lozano Rivera', email: 'patricia.lozano@audiotech.co', role: 'distribuidor', country_code: 'COL', company: 'AudioTech Colombia', phone: '+57 1 234 5678', created_at: '2024-08-15' },
            { id: 'USR-022', name: 'Fernando Rivas', email: 'fernando.rivas@abarg.com', role: 'distribuidor', country_code: 'ARG', company: 'AB Audiologia Argentina', phone: '+54 11 5555 6666', created_at: '2025-01-10' },
            { id: 'USR-023', name: 'Ricardo Jimenez Solis', email: 'ricardo.jimenez@cacr.co.cr', role: 'distribuidor', country_code: 'CRI', company: 'Centro Auditivo CR', phone: '+506 2222 3333', created_at: '2025-03-20' },
            { id: 'USR-024', name: 'Monica Sepulveda', email: 'monica.sepulveda@sonochile.cl', role: 'distribuidor', country_code: 'CHL', company: 'SonoChile', phone: '+56 2 7777 8888', created_at: '2025-05-01' },
            // Especialistas
            { id: 'USR-005', name: 'Laura Torres Medina', email: 'laura.torres@clinica.com', role: 'especialista', country_code: 'ARG', license_number: 'MN-45678', phone: '+54 11 3333 4444', created_at: '2025-02-10' },
            { id: 'USR-025', name: 'Dr. Alejandro Prieto', email: 'a.prieto@hospital.co', role: 'especialista', country_code: 'COL', license_number: 'TP-12345', phone: '+57 1 888 9999', created_at: '2024-09-01' },
            { id: 'USR-026', name: 'Dra. Carmen Villegas', email: 'c.villegas@orl.mx', role: 'especialista', country_code: 'MEX', license_number: 'CED-987654', phone: '+52 55 7777 8888', created_at: '2025-01-20' },
            { id: 'USR-027', name: 'Dr. Juan Pablo Soto', email: 'jp.soto@audioperu.pe', role: 'especialista', country_code: 'PER', license_number: 'CMP-33221', phone: '+51 1 222 3333', created_at: '2025-07-15' },
            // Admins
            { id: 'USR-003', name: 'Ana Maria Lopez', email: 'ana.lopez@advancedbionics.com', role: 'admin', country_code: 'COL', phone: '+57 1 600 1234', created_at: '2024-06-01' },
            { id: 'USR-028', name: 'Jorge Gutierrez', email: 'jorge.gutierrez@advancedbionics.com', role: 'admin', country_code: 'MEX', phone: '+52 55 3333 4444', created_at: '2024-10-01' },
            // Super Admins
            { id: 'USR-004', name: 'Roberto Silva Navarro', email: 'roberto.silva@advancedbionics.com', role: 'superadmin', country_code: 'COL', phone: '+57 1 600 0001', created_at: '2024-01-01' },
            { id: 'USR-029', name: 'Elena Rodriguez', email: 'elena.rodriguez@advancedbionics.com', role: 'superadmin', country_code: 'MEX', phone: '+52 55 1111 2222', created_at: '2024-03-15' }
        ]);

        // --- DEVICES (15 across multiple users) ---
        this.set('devices', [
            { id: 'DEV-001', user_id: 'USR-001', product_id: 'PRD-001', serial_number: 'MV-2025-001234', model: 'Marvel CI - HiRes Ultra 3D', implant_side: 'right', purchase_date: '2025-03-12', warranty_start: '2025-03-12', warranty_expiry: '2028-03-12', status: 'active' },
            { id: 'DEV-002', user_id: 'USR-001', product_id: 'PRD-002', serial_number: 'NM-2025-005678', model: 'Naida CI Marvel M90', implant_side: 'right', purchase_date: '2025-03-12', warranty_start: '2025-03-12', warranty_expiry: '2027-03-12', status: 'active' },
            { id: 'DEV-003', user_id: 'USR-010', product_id: 'PRD-001', serial_number: 'MV-2025-007890', model: 'Marvel CI - HiRes Ultra 3D', implant_side: 'left', purchase_date: '2025-09-20', warranty_start: '2025-09-20', warranty_expiry: '2028-09-20', status: 'active' },
            { id: 'DEV-004', user_id: 'USR-011', product_id: 'PRD-002', serial_number: 'NM-2025-002345', model: 'Naida CI Marvel M90', implant_side: 'bilateral', purchase_date: '2025-06-08', warranty_start: '2025-06-08', warranty_expiry: '2027-06-08', status: 'active' },
            { id: 'DEV-005', user_id: 'USR-013', product_id: 'PRD-003', serial_number: 'SK-2025-004567', model: 'Sky CI Marvel', implant_side: 'right', purchase_date: '2025-07-03', warranty_start: '2025-07-03', warranty_expiry: '2027-07-03', status: 'active' },
            { id: 'DEV-006', user_id: 'USR-014', product_id: 'PRD-001', serial_number: 'MV-2024-011223', model: 'Marvel CI - HiRes Ultra 3D', implant_side: 'bilateral', purchase_date: '2024-11-22', warranty_start: '2024-11-22', warranty_expiry: '2027-11-22', status: 'active' },
            { id: 'DEV-007', user_id: 'USR-014', product_id: 'PRD-009', serial_number: 'NM-2025-008899', model: 'Naida CI M130', implant_side: 'bilateral', purchase_date: '2025-05-10', warranty_start: '2025-05-10', warranty_expiry: '2027-05-10', status: 'active' },
            { id: 'DEV-008', user_id: 'USR-016', product_id: 'PRD-002', serial_number: 'NM-2025-003344', model: 'Naida CI Marvel M90', implant_side: 'left', purchase_date: '2025-04-18', warranty_start: '2025-04-18', warranty_expiry: '2027-04-18', status: 'active' },
            { id: 'DEV-009', user_id: 'USR-017', product_id: 'PRD-001', serial_number: 'MV-2025-006677', model: 'Marvel CI - HiRes Ultra 3D', implant_side: 'right', purchase_date: '2025-10-05', warranty_start: '2025-10-05', warranty_expiry: '2028-10-05', status: 'active' },
            { id: 'DEV-010', user_id: 'USR-018', product_id: 'PRD-003', serial_number: 'SK-2025-009988', model: 'Sky CI Marvel', implant_side: 'right', purchase_date: '2025-05-30', warranty_start: '2025-05-30', warranty_expiry: '2027-05-30', status: 'active' },
            { id: 'DEV-011', user_id: 'USR-019', product_id: 'PRD-002', serial_number: 'NM-2025-007766', model: 'Naida CI Marvel M90', implant_side: 'left', purchase_date: '2025-08-14', warranty_start: '2025-08-14', warranty_expiry: '2027-08-14', status: 'active' },
            { id: 'DEV-012', user_id: 'USR-015', product_id: 'PRD-001', serial_number: 'MV-2026-000112', model: 'Marvel CI - HiRes Ultra 3D', implant_side: 'right', purchase_date: '2026-02-10', warranty_start: '2026-02-10', warranty_expiry: '2029-02-10', status: 'active' },
            // Device with warranty about to expire
            { id: 'DEV-013', user_id: 'USR-012', product_id: 'PRD-002', serial_number: 'NM-2023-019988', model: 'Naida CI Marvel M90', implant_side: 'right', purchase_date: '2023-06-01', warranty_start: '2023-06-01', warranty_expiry: '2026-06-01', status: 'active' },
            // Device in repair
            { id: 'DEV-014', user_id: 'USR-020', product_id: 'PRD-003', serial_number: 'SK-2025-011223', model: 'Sky CI Marvel', implant_side: 'left', purchase_date: '2025-11-15', warranty_start: '2025-11-15', warranty_expiry: '2027-11-15', status: 'in_repair' }
        ]);

        // --- WARRANTY CLAIMS (8 in various states) ---
        this.set('warranty_claims', [
            { id: 'WC-001', tracking_id: 'WC-2026-00001', distributor_id: 'USR-002', client_name: 'Pedro Ramirez Solis', client_email: 'pedro.r@email.com', device_serial: 'NM-2024-009876', device_model: 'Naida CI Marvel', issue_description: 'El procesador no enciende despues de cambio de bateria. Se intento con dos baterias distintas.', status: 'under_review', ai_diagnosis: 'Posible fallo en conector interno de bateria. Confianza: 87%. Recomendacion: enviar a centro de servicio para revision del puerto de carga.', ai_confidence: 0.87, country_code: 'MEX', created_at: '2026-03-20' },
            { id: 'WC-002', tracking_id: 'WC-2026-00002', distributor_id: 'USR-002', client_name: 'Sofia Herrera Lopez', client_email: 'sofia.h@email.com', device_serial: 'SK-2025-003456', device_model: 'Sky CI Marvel', issue_description: 'Intermitencia en el sonido del lado derecho, se corta al mover la cabeza', status: 'approved', ai_diagnosis: 'Patron consistente con desgaste del cable de conexion. Cobertura por garantia confirmada.', ai_confidence: 0.92, country_code: 'MEX', created_at: '2026-04-01' },
            { id: 'WC-003', tracking_id: 'WC-2026-00003', distributor_id: 'USR-021', client_name: 'Andres Felipe Rojas', client_email: 'andres.rojas@email.com', device_serial: 'MV-2025-007890', device_model: 'Marvel CI', issue_description: 'Feedback o pitido agudo intermitente, especialmente en ambientes cerrados', status: 'in_repair', ai_diagnosis: 'Posible desalineacion del iman o fallo en microfono. Requiere calibracion en laboratorio.', ai_confidence: 0.78, country_code: 'COL', created_at: '2026-02-15' },
            { id: 'WC-004', tracking_id: 'WC-2026-00004', distributor_id: 'USR-022', client_name: 'Lucia Alvarez Gomez', client_email: 'lucia.a@email.com', device_serial: 'MV-2025-006677', device_model: 'Marvel CI', issue_description: 'El LED de estado no enciende y el procesador parece no cargar', status: 'shipped', ai_diagnosis: 'Fallo en circuito de carga. Componente reemplazable. Cubierto por garantia.', ai_confidence: 0.95, country_code: 'ARG', created_at: '2026-01-28' },
            { id: 'WC-005', tracking_id: 'WC-2026-00005', distributor_id: 'USR-002', client_name: 'Camila Flores Gutierrez', client_email: 'camila.f@email.com', device_serial: 'MV-2026-000112', device_model: 'Marvel CI', issue_description: 'Procesador se apaga solo despues de 2 horas de uso con bateria nueva', status: 'pending', ai_diagnosis: null, ai_confidence: null, country_code: 'MEX', created_at: '2026-04-08' },
            { id: 'WC-006', tracking_id: 'WC-2026-00006', distributor_id: 'USR-021', client_name: 'Santiago Ospina Ruiz', client_email: 'santiago.o@email.com', device_serial: 'NM-2023-019988', device_model: 'Naida CI Marvel', issue_description: 'Carcasa del procesador agrietada por caida, afecta el sellado de humedad', status: 'rejected', ai_diagnosis: 'Dano fisico por impacto. No cubierto por garantia estandar. Recomendacion: cotizar reparacion.', ai_confidence: 0.96, admin_notes: 'Dano por caida, fuera de cobertura de garantia', country_code: 'COL', created_at: '2026-03-05' },
            { id: 'WC-007', tracking_id: 'WC-2025-00018', distributor_id: 'USR-023', client_name: 'Isabella Vargas Mora', client_email: 'isabella.v@email.com', device_serial: 'SK-2025-009988', device_model: 'Sky CI Marvel', issue_description: 'Boton de programa no responde al presionar', status: 'completed', ai_diagnosis: 'Desgaste mecanico del switch. Reemplazo sencillo cubierto por garantia.', ai_confidence: 0.91, resolution: 'Boton de programa reemplazado. Procesador probado y funcionando correctamente. Devuelto al distribuidor.', country_code: 'CRI', created_at: '2025-12-10', resolved_at: '2026-01-05' },
            { id: 'WC-008', tracking_id: 'WC-2026-00007', distributor_id: 'USR-024', client_name: 'Tomas Salazar Vega', client_email: 'tomas.s@email.com', device_serial: 'NM-2025-007766', device_model: 'Naida CI Marvel M90', issue_description: 'Conectividad Bluetooth inestable, se desconecta del celular frecuentemente', status: 'ai_reviewing', ai_diagnosis: null, ai_confidence: null, country_code: 'CHL', created_at: '2026-04-09' }
        ]);

        // --- CLAIM STATUS HISTORY ---
        this.set('claim_status_history', [
            // WC-001
            { id: 'CSH-001', claim_id: 'WC-001', status: 'pending', notes: 'Solicitud recibida por distribuidor', created_at: '2026-03-20T10:00:00' },
            { id: 'CSH-002', claim_id: 'WC-001', status: 'ai_reviewing', notes: 'IA Melody analizando imagenes y descripcion', created_at: '2026-03-20T10:05:00' },
            { id: 'CSH-003', claim_id: 'WC-001', status: 'under_review', notes: 'Diagnostico IA completado. Equipo tecnico revisando caso.', created_at: '2026-03-21T09:00:00' },
            // WC-002
            { id: 'CSH-004', claim_id: 'WC-002', status: 'pending', notes: 'Solicitud recibida', created_at: '2026-04-01T14:00:00' },
            { id: 'CSH-005', claim_id: 'WC-002', status: 'ai_reviewing', notes: 'Analisis de IA en proceso', created_at: '2026-04-01T14:03:00' },
            { id: 'CSH-006', claim_id: 'WC-002', status: 'approved', notes: 'Garantia aprobada. Enviar dispositivo al centro de servicio mas cercano.', created_at: '2026-04-03T11:00:00' },
            // WC-003
            { id: 'CSH-007', claim_id: 'WC-003', status: 'pending', notes: 'Solicitud recibida', created_at: '2026-02-15T08:30:00' },
            { id: 'CSH-008', claim_id: 'WC-003', status: 'ai_reviewing', notes: 'Melody procesando diagnostico', created_at: '2026-02-15T08:35:00' },
            { id: 'CSH-009', claim_id: 'WC-003', status: 'approved', notes: 'Caso aprobado para reparacion', created_at: '2026-02-17T10:00:00' },
            { id: 'CSH-010', claim_id: 'WC-003', status: 'in_repair', notes: 'Dispositivo recibido en laboratorio Bogota. Inicio de reparacion.', created_at: '2026-02-25T14:00:00' },
            // WC-004
            { id: 'CSH-011', claim_id: 'WC-004', status: 'pending', notes: 'Solicitud recibida', created_at: '2026-01-28T09:00:00' },
            { id: 'CSH-012', claim_id: 'WC-004', status: 'approved', notes: 'Aprobado. Dispositivo en reparacion.', created_at: '2026-02-01T11:00:00' },
            { id: 'CSH-013', claim_id: 'WC-004', status: 'in_repair', notes: 'Circuito de carga reemplazado', created_at: '2026-02-10T15:00:00' },
            { id: 'CSH-014', claim_id: 'WC-004', status: 'shipped', notes: 'Procesador reparado enviado via DHL. Tracking: DHL-AR-2026-445566', created_at: '2026-02-15T09:00:00' },
            // WC-005
            { id: 'CSH-015', claim_id: 'WC-005', status: 'pending', notes: 'Solicitud recibida. Pendiente analisis de IA.', created_at: '2026-04-08T16:30:00' },
            // WC-006 (rejected)
            { id: 'CSH-016', claim_id: 'WC-006', status: 'pending', notes: 'Solicitud recibida', created_at: '2026-03-05T10:00:00' },
            { id: 'CSH-017', claim_id: 'WC-006', status: 'ai_reviewing', notes: 'IA analizando fotos del dispositivo danado', created_at: '2026-03-05T10:05:00' },
            { id: 'CSH-018', claim_id: 'WC-006', status: 'rejected', notes: 'Dano fisico por impacto no cubierto por garantia. Se ofrece cotizacion de reparacion.', created_at: '2026-03-07T14:00:00' },
            // WC-007 (completed)
            { id: 'CSH-019', claim_id: 'WC-007', status: 'pending', notes: 'Solicitud recibida', created_at: '2025-12-10T09:00:00' },
            { id: 'CSH-020', claim_id: 'WC-007', status: 'approved', notes: 'Aprobado', created_at: '2025-12-12T11:00:00' },
            { id: 'CSH-021', claim_id: 'WC-007', status: 'in_repair', notes: 'Switch reemplazado en laboratorio', created_at: '2025-12-20T15:00:00' },
            { id: 'CSH-022', claim_id: 'WC-007', status: 'shipped', notes: 'Dispositivo enviado al distribuidor', created_at: '2025-12-28T10:00:00' },
            { id: 'CSH-023', claim_id: 'WC-007', status: 'completed', notes: 'Entregado al cliente. Funcionamiento verificado.', created_at: '2026-01-05T14:00:00' },
            // WC-008
            { id: 'CSH-024', claim_id: 'WC-008', status: 'pending', notes: 'Solicitud recibida', created_at: '2026-04-09T11:00:00' },
            { id: 'CSH-025', claim_id: 'WC-008', status: 'ai_reviewing', notes: 'Melody analizando problema de conectividad...', created_at: '2026-04-09T11:02:00' }
        ]);

        // --- PQRs (6 in different states) ---
        this.set('pqrs', [
            { id: 'PQR-001', tracking_id: 'PQR-2026-00001', user_id: 'USR-001', type: 'peticion', subject: 'Solicitud de cable de repuesto', description: 'Necesito un cable de repuesto para mi procesador Naida CI Marvel M90. El actual tiene desgaste visible.', status: 'in_progress', priority: 'medium', country_code: 'COL', created_at: '2026-03-25', response: 'Hemos recibido tu solicitud. Estamos coordinando con tu distribuidor local para el envio.' },
            { id: 'PQR-002', tracking_id: 'PQR-2026-00002', user_id: 'USR-014', type: 'queja', subject: 'Demora en entrega de bateria', description: 'Llevo 3 semanas esperando la bateria PowerCel Slim que solicite. No he recibido actualizacion.', status: 'open', priority: 'high', country_code: 'MEX', created_at: '2026-04-02' },
            { id: 'PQR-003', tracking_id: 'PQR-2026-00003', user_id: 'USR-016', type: 'reclamo', subject: 'Procesador fallo a los 3 meses de compra', description: 'Mi procesador Naida CI dejo de funcionar correctamente apenas 3 meses despues de la compra. Exijo reparacion o reemplazo inmediato.', status: 'in_progress', priority: 'urgent', country_code: 'ARG', created_at: '2026-03-15', response: 'Lamentamos la situacion. Hemos escalado tu caso al equipo tecnico. Un especialista te contactara en 24 horas.' },
            { id: 'PQR-004', tracking_id: 'PQR-2026-00004', user_id: 'USR-018', type: 'sugerencia', subject: 'Agregar tutorial de natacion', description: 'Seria muy util tener un tutorial detallado sobre como usar el AquaCase correctamente en la piscina.', status: 'resolved', priority: 'low', country_code: 'CRI', created_at: '2026-02-20', response: 'Excelente sugerencia! Ya estamos trabajando en un tutorial de natacion con AquaCase. Estara disponible en abril.' },
            { id: 'PQR-005', tracking_id: 'PQR-2026-00005', user_id: 'USR-011', type: 'peticion', subject: 'Informacion sobre upgrade a M130', description: 'Me gustaria saber el proceso y costo para actualizar mi procesador M90 al nuevo Naida CI M130.', status: 'open', priority: 'medium', country_code: 'COL', created_at: '2026-04-05' },
            { id: 'PQR-006', tracking_id: 'PQR-2025-00012', user_id: 'USR-013', type: 'queja', subject: 'Atencion al cliente telefonica deficiente', description: 'Llame 4 veces al distribuidor y no logre comunicarme. Necesito coordinar mi cita de ajuste MAP.', status: 'closed', priority: 'medium', country_code: 'MEX', created_at: '2025-11-10', resolved_at: '2025-11-15', response: 'Pedimos disculpas por la experiencia. Hemos habilitado una linea directa para ti: +52 55 9876 5400. Tu cita quedo programada.' }
        ]);

        // --- INVENTORY (across 3 distributors, 20+ items) ---
        this.set('inventory', [
            // Carlos Mendez - MEX
            { id: 'INV-001', distributor_id: 'USR-002', product_id: 'PRD-004', product_name: 'T-Mic 2', quantity: 12, min_stock: 5, country_code: 'MEX' },
            { id: 'INV-002', distributor_id: 'USR-002', product_id: 'PRD-005', product_name: 'AquaCase', quantity: 3, min_stock: 5, country_code: 'MEX' },
            { id: 'INV-003', distributor_id: 'USR-002', product_id: 'PRD-006', product_name: 'Cable de carga', quantity: 28, min_stock: 10, country_code: 'MEX' },
            { id: 'INV-004', distributor_id: 'USR-002', product_id: 'PRD-007', product_name: 'Kit de secado', quantity: 8, min_stock: 5, country_code: 'MEX' },
            { id: 'INV-005', distributor_id: 'USR-002', product_id: 'PRD-008', product_name: 'Bateria recargable', quantity: 2, min_stock: 5, country_code: 'MEX' },
            { id: 'INV-006', distributor_id: 'USR-002', product_id: 'PRD-010', product_name: 'Clip de seguridad', quantity: 20, min_stock: 8, country_code: 'MEX' },
            { id: 'INV-007', distributor_id: 'USR-002', product_id: 'PRD-011', product_name: 'Funda protectora', quantity: 15, min_stock: 10, country_code: 'MEX' },
            { id: 'INV-008', distributor_id: 'USR-002', product_id: 'PRD-012', product_name: 'Roger Select iN', quantity: 1, min_stock: 2, country_code: 'MEX' },
            // Patricia Lozano - COL
            { id: 'INV-009', distributor_id: 'USR-021', product_id: 'PRD-004', product_name: 'T-Mic 2', quantity: 7, min_stock: 5, country_code: 'COL' },
            { id: 'INV-010', distributor_id: 'USR-021', product_id: 'PRD-005', product_name: 'AquaCase', quantity: 10, min_stock: 5, country_code: 'COL' },
            { id: 'INV-011', distributor_id: 'USR-021', product_id: 'PRD-006', product_name: 'Cable de carga', quantity: 35, min_stock: 10, country_code: 'COL' },
            { id: 'INV-012', distributor_id: 'USR-021', product_id: 'PRD-007', product_name: 'Kit de secado', quantity: 4, min_stock: 5, country_code: 'COL' },
            { id: 'INV-013', distributor_id: 'USR-021', product_id: 'PRD-008', product_name: 'Bateria recargable', quantity: 14, min_stock: 8, country_code: 'COL' },
            { id: 'INV-014', distributor_id: 'USR-021', product_id: 'PRD-012', product_name: 'Roger Select iN', quantity: 3, min_stock: 2, country_code: 'COL' },
            // Fernando Rivas - ARG
            { id: 'INV-015', distributor_id: 'USR-022', product_id: 'PRD-004', product_name: 'T-Mic 2', quantity: 5, min_stock: 5, country_code: 'ARG' },
            { id: 'INV-016', distributor_id: 'USR-022', product_id: 'PRD-006', product_name: 'Cable de carga', quantity: 18, min_stock: 10, country_code: 'ARG' },
            { id: 'INV-017', distributor_id: 'USR-022', product_id: 'PRD-008', product_name: 'Bateria recargable', quantity: 0, min_stock: 5, country_code: 'ARG' },
            { id: 'INV-018', distributor_id: 'USR-022', product_id: 'PRD-011', product_name: 'Funda protectora', quantity: 9, min_stock: 5, country_code: 'ARG' }
        ]);

        // --- CAMPAIGNS (5) ---
        this.set('campaigns', [
            { id: 'CMP-001', title: 'Semana del Cuidado Auditivo', description: 'Completa tu checklist diario durante 7 dias consecutivos y gana puntos dobles. Evento anual de concientizacion.', type: 'promotion', target_roles: ['cliente'], target_countries: null, start_date: '2026-04-07', end_date: '2026-04-14', active: true, created_by: 'USR-004' },
            { id: 'CMP-002', title: 'Lanzamiento Naida CI M130', description: 'Nuevos videos de capacitacion y webinars en vivo sobre el procesador de nueva generacion M130.', type: 'educational', target_roles: ['cliente', 'especialista'], target_countries: ['COL', 'MEX'], start_date: '2026-04-01', end_date: '2026-04-30', active: true, created_by: 'USR-004' },
            { id: 'CMP-003', title: 'Programa de Referidos Q2', description: 'Refiere a un nuevo paciente y ambos obtienen 200 puntos extra. Aplica para todos los paises.', type: 'promotion', target_roles: ['cliente', 'especialista'], target_countries: null, start_date: '2026-04-01', end_date: '2026-06-30', active: true, created_by: 'USR-029' },
            { id: 'CMP-004', title: 'Capacitacion Distribuidores - Bluetooth', description: 'Sesion virtual de entrenamiento en resolucion de problemas de conectividad Bluetooth para distribuidores.', type: 'educational', target_roles: ['distribuidor'], target_countries: null, start_date: '2026-04-15', end_date: '2026-04-15', active: true, created_by: 'USR-004' },
            { id: 'CMP-005', title: 'Encuesta de Satisfaccion 2025', description: 'Resultados de la encuesta anual. 94% de satisfaccion general. Acciones de mejora implementadas.', type: 'general', target_roles: ['cliente', 'especialista', 'distribuidor'], target_countries: null, start_date: '2026-01-15', end_date: '2026-02-28', active: false, created_by: 'USR-004' }
        ]);

        // --- CHECKLIST COMPLETIONS (pre-populate for demo user USR-001) ---
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        this.set('checklist_completions', [
            // Yesterday completions for USR-001
            { id: 'CC-001', user_id: 'USR-001', device_id: 'DEV-001', checklist_id: 'CHK-001', points_earned: 5, completed_at: yesterday + 'T08:00:00' },
            { id: 'CC-002', user_id: 'USR-001', device_id: 'DEV-001', checklist_id: 'CHK-002', points_earned: 5, completed_at: yesterday + 'T08:05:00' },
            { id: 'CC-003', user_id: 'USR-001', device_id: 'DEV-001', checklist_id: 'CHK-003', points_earned: 10, completed_at: yesterday + 'T22:00:00' },
            { id: 'CC-004', user_id: 'USR-001', device_id: 'DEV-001', checklist_id: 'CHK-004', points_earned: 5, completed_at: yesterday + 'T08:10:00' },
            { id: 'CC-005', user_id: 'USR-001', device_id: 'DEV-001', checklist_id: 'CHK-006', points_earned: 10, completed_at: yesterday + 'T09:00:00' },
            // Today partial completions for USR-001
            { id: 'CC-006', user_id: 'USR-001', device_id: 'DEV-001', checklist_id: 'CHK-001', points_earned: 5, completed_at: today + 'T07:30:00' },
            { id: 'CC-007', user_id: 'USR-001', device_id: 'DEV-001', checklist_id: 'CHK-004', points_earned: 5, completed_at: today + 'T07:35:00' },
            // Other users
            { id: 'CC-008', user_id: 'USR-014', device_id: 'DEV-006', checklist_id: 'CHK-001', points_earned: 5, completed_at: today + 'T09:00:00' },
            { id: 'CC-009', user_id: 'USR-014', device_id: 'DEV-006', checklist_id: 'CHK-002', points_earned: 5, completed_at: today + 'T09:05:00' },
            { id: 'CC-010', user_id: 'USR-014', device_id: 'DEV-006', checklist_id: 'CHK-003', points_earned: 10, completed_at: yesterday + 'T22:00:00' }
        ]);

        // --- TUTORIAL COMPLETIONS ---
        this.set('tutorial_completions', [
            { id: 'TC-001', user_id: 'USR-001', tutorial_id: 'TUT-001', points_earned: 30, completed_at: '2025-04-01T10:00:00' },
            { id: 'TC-002', user_id: 'USR-001', tutorial_id: 'TUT-002', points_earned: 20, completed_at: '2025-04-05T14:00:00' },
            { id: 'TC-003', user_id: 'USR-001', tutorial_id: 'TUT-004', points_earned: 15, completed_at: '2025-04-10T11:00:00' },
            { id: 'TC-004', user_id: 'USR-014', tutorial_id: 'TUT-001', points_earned: 30, completed_at: '2025-01-15T09:00:00' },
            { id: 'TC-005', user_id: 'USR-014', tutorial_id: 'TUT-002', points_earned: 20, completed_at: '2025-01-20T10:00:00' },
            { id: 'TC-006', user_id: 'USR-014', tutorial_id: 'TUT-003', points_earned: 20, completed_at: '2025-02-01T16:00:00' },
            { id: 'TC-007', user_id: 'USR-014', tutorial_id: 'TUT-005', points_earned: 25, completed_at: '2025-03-10T11:00:00' },
            { id: 'TC-008', user_id: 'USR-014', tutorial_id: 'TUT-006', points_earned: 20, completed_at: '2025-04-01T14:00:00' },
            { id: 'TC-009', user_id: 'USR-016', tutorial_id: 'TUT-001', points_earned: 30, completed_at: '2025-05-10T10:00:00' },
            { id: 'TC-010', user_id: 'USR-018', tutorial_id: 'TUT-001', points_earned: 30, completed_at: '2025-06-20T09:00:00' },
            { id: 'TC-011', user_id: 'USR-018', tutorial_id: 'TUT-009', points_earned: 20, completed_at: '2025-07-01T15:00:00' }
        ]);

        // --- BENEFIT REDEMPTIONS ---
        this.set('benefit_redemptions', [
            { id: 'BR-001', user_id: 'USR-014', benefit_id: 'BEN-002', points_spent: 150, status: 'delivered', redeemed_at: '2025-08-15T10:00:00' },
            { id: 'BR-002', user_id: 'USR-014', benefit_id: 'BEN-006', points_spent: 100, status: 'delivered', redeemed_at: '2025-10-01T14:00:00' },
            { id: 'BR-003', user_id: 'USR-016', benefit_id: 'BEN-001', points_spent: 200, status: 'approved', redeemed_at: '2026-03-20T11:00:00' },
            { id: 'BR-004', user_id: 'USR-001', benefit_id: 'BEN-002', points_spent: 150, status: 'delivered', redeemed_at: '2026-01-10T09:00:00' },
            { id: 'BR-005', user_id: 'USR-018', benefit_id: 'BEN-006', points_spent: 100, status: 'pending', redeemed_at: '2026-04-05T16:00:00' }
        ]);

        // --- ACCESSORY REQUESTS ---
        this.set('accessory_requests', [
            { id: 'AR-001', user_id: 'USR-001', product_id: 'PRD-006', quantity: 2, status: 'delivered', country_code: 'COL', notes: 'Cables de repuesto', created_at: '2025-12-01' },
            { id: 'AR-002', user_id: 'USR-014', product_id: 'PRD-005', quantity: 1, status: 'shipped', country_code: 'MEX', notes: 'Para vacaciones', created_at: '2026-03-28' },
            { id: 'AR-003', user_id: 'USR-011', product_id: 'PRD-008', quantity: 1, status: 'pending', country_code: 'COL', created_at: '2026-04-07' },
            { id: 'AR-004', user_id: 'USR-018', product_id: 'PRD-007', quantity: 1, status: 'confirmed', country_code: 'CRI', created_at: '2026-04-03' },
            { id: 'AR-005', user_id: 'USR-013', product_id: 'PRD-012', quantity: 1, status: 'pending', country_code: 'MEX', notes: 'Para uso en clases', created_at: '2026-04-08' }
        ]);

        // --- AUDIT LOG ---
        this.set('audit_log', [
            { id: 'AL-001', user_id: 'USR-004', action: 'login', entity_type: 'session', details: '{"role":"superadmin","country":"COL"}', created_at: '2026-04-09T08:00:00' },
            { id: 'AL-002', user_id: 'USR-004', action: 'create', entity_type: 'campaign', entity_id: 'CMP-001', details: '{"title":"Semana del Cuidado Auditivo"}', created_at: '2026-04-05T10:00:00' },
            { id: 'AL-003', user_id: 'USR-003', action: 'login', entity_type: 'session', details: '{"role":"admin","country":"COL"}', created_at: '2026-04-09T09:15:00' },
            { id: 'AL-004', user_id: 'USR-002', action: 'create', entity_type: 'warranty_claim', entity_id: 'WC-005', details: '{"client":"Camila Flores","model":"Marvel CI"}', created_at: '2026-04-08T16:30:00' },
            { id: 'AL-005', user_id: 'USR-021', action: 'update', entity_type: 'inventory', entity_id: 'INV-012', details: '{"product":"Kit de secado","old_qty":6,"new_qty":4}', created_at: '2026-04-07T11:00:00' },
            { id: 'AL-006', user_id: 'USR-001', action: 'redeem', entity_type: 'benefit', entity_id: 'BEN-002', details: '{"points_spent":150}', created_at: '2026-01-10T09:00:00' },
            { id: 'AL-007', user_id: 'USR-029', action: 'create', entity_type: 'campaign', entity_id: 'CMP-003', details: '{"title":"Programa de Referidos Q2"}', created_at: '2026-03-28T14:00:00' },
            { id: 'AL-008', user_id: 'USR-028', action: 'import', entity_type: 'users', details: '{"source":"Salesforce","records":12}', created_at: '2026-03-15T10:00:00' }
        ]);
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
