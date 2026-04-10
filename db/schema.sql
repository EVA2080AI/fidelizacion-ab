-- ============================================================
-- AB HUB+ Database Schema
-- Compatible with PostgreSQL (Supabase) and SQLite
-- ============================================================

-- Countries / Regions
CREATE TABLE countries (
    code TEXT PRIMARY KEY,          -- COL, MEX, ARG, CRI, etc.
    name TEXT NOT NULL,
    currency TEXT DEFAULT 'USD',
    phone_prefix TEXT,
    active BOOLEAN DEFAULT TRUE
);

INSERT INTO countries (code, name, currency, phone_prefix) VALUES
('COL', 'Colombia', 'COP', '+57'),
('MEX', 'Mexico', 'MXN', '+52'),
('ARG', 'Argentina', 'ARS', '+54'),
('CRI', 'Costa Rica', 'CRC', '+506'),
('CHL', 'Chile', 'CLP', '+56'),
('PER', 'Peru', 'PEN', '+51');

-- Users
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('cliente', 'especialista', 'distribuidor', 'admin', 'superadmin')),
    country_code TEXT NOT NULL REFERENCES countries(code),
    phone TEXT,
    avatar_url TEXT,
    company TEXT,                    -- For distributors
    license_number TEXT,             -- For specialists
    points INTEGER DEFAULT 0,       -- Loyalty points for clients
    first_login BOOLEAN DEFAULT TRUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Catalog
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,          -- implant, processor, accessory
    model TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    price DECIMAL(10,2),
    compatible_with TEXT,            -- JSON array of compatible product IDs
    active BOOLEAN DEFAULT TRUE
);

INSERT INTO products (id, name, category, model, description) VALUES
('PRD-001', 'Marvel CI', 'implant', 'HiRes Ultra 3D', 'Implante coclear de ultima generacion'),
('PRD-002', 'Naida CI Marvel', 'processor', 'M90', 'Procesador de sonido con conectividad directa'),
('PRD-003', 'Sky CI Marvel', 'processor', 'Sky M', 'Procesador pediatrico'),
('PRD-004', 'T-Mic 2', 'accessory', 'T-Mic 2', 'Microfono con posicion natural del oido'),
('PRD-005', 'AquaCase', 'accessory', 'AquaCase', 'Proteccion acuatica para procesador'),
('PRD-006', 'Cable de carga', 'accessory', 'PowerCel', 'Cable de carga USB-C para procesador'),
('PRD-007', 'Kit de secado', 'accessory', 'DryKit', 'Kit electronico de secado nocturno'),
('PRD-008', 'Bateria recargable', 'accessory', 'PowerCel Slim', 'Bateria compacta recargable');

-- Client Devices (registered devices per user)
CREATE TABLE devices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    product_id TEXT REFERENCES products(id),
    serial_number TEXT UNIQUE NOT NULL,
    model TEXT NOT NULL,
    implant_side TEXT CHECK (implant_side IN ('left', 'right', 'bilateral')),
    purchase_date DATE NOT NULL,
    warranty_start DATE NOT NULL,
    warranty_expiry DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_repair', 'replaced', 'expired')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device Checklist Templates
CREATE TABLE checklist_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,                       -- Lucide icon name
    frequency TEXT DEFAULT 'daily',  -- daily, weekly, monthly
    points_reward INTEGER DEFAULT 5,
    order_index INTEGER DEFAULT 0
);

INSERT INTO checklist_templates (id, name, description, icon, frequency, points_reward, order_index) VALUES
('CHK-001', 'Limpiar T-Mic', 'Limpia el microfono T-Mic con un pano suave', 'mic', 'daily', 5, 1),
('CHK-002', 'Revisar cable', 'Inspecciona el cable de conexion por danos visibles', 'cable', 'daily', 5, 2),
('CHK-003', 'Secar procesador', 'Coloca el procesador en el kit de secado durante la noche', 'droplets', 'daily', 10, 3),
('CHK-004', 'Verificar bateria', 'Revisa el nivel de carga y estado de la bateria', 'battery-full', 'daily', 5, 4),
('CHK-005', 'Limpiar imanes', 'Limpia los imanes de retencion con alcohol isopropilico', 'magnet', 'weekly', 15, 5),
('CHK-006', 'Test de sonido', 'Realiza la prueba de sonido diaria con la app', 'volume-2', 'daily', 10, 6),
('CHK-007', 'Revision de humedad', 'Verifica que no haya humedad en los compartimentos', 'thermometer', 'weekly', 15, 7),
('CHK-008', 'Backup de configuracion', 'Guarda una copia de tus programas MAP actuales', 'save', 'monthly', 25, 8);

-- User Checklist Completions
CREATE TABLE checklist_completions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    device_id TEXT REFERENCES devices(id),
    checklist_id TEXT NOT NULL REFERENCES checklist_templates(id),
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    points_earned INTEGER DEFAULT 0
);

-- Tutorials / Videos
CREATE TABLE tutorials (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_minutes INTEGER,
    category TEXT,                   -- care, troubleshooting, features, setup
    difficulty TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
    points_reward INTEGER DEFAULT 20,
    order_index INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE
);

INSERT INTO tutorials (id, title, description, video_url, duration_minutes, category, points_reward, order_index) VALUES
('TUT-001', 'Primeros pasos con Marvel CI', 'Guia basica para nuevos usuarios del implante Marvel', 'https://youtube.com/watch?v=example1', 12, 'setup', 30, 1),
('TUT-002', 'Cuidado diario del procesador', 'Rutina de mantenimiento esencial para tu procesador', 'https://youtube.com/watch?v=example2', 8, 'care', 20, 2),
('TUT-003', 'Conectividad Bluetooth', 'Como conectar tu procesador a dispositivos moviles', 'https://youtube.com/watch?v=example3', 10, 'features', 20, 3),
('TUT-004', 'Limpieza del T-Mic', 'Tutorial detallado de limpieza del microfono', 'https://youtube.com/watch?v=example4', 5, 'care', 15, 4),
('TUT-005', 'Solucion de problemas comunes', 'Diagnostico y solucion de los problemas mas frecuentes', 'https://youtube.com/watch?v=example5', 15, 'troubleshooting', 25, 5),
('TUT-006', 'Uso en ambientes ruidosos', 'Programas y estrategias para ambientes dificiles', 'https://youtube.com/watch?v=example6', 10, 'features', 20, 6);

-- Tutorial Completions
CREATE TABLE tutorial_completions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    tutorial_id TEXT NOT NULL REFERENCES tutorials(id),
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    points_earned INTEGER DEFAULT 0,
    UNIQUE(user_id, tutorial_id)
);

-- Warranty Claims (Distributors submit)
CREATE TABLE warranty_claims (
    id TEXT PRIMARY KEY,
    tracking_id TEXT UNIQUE NOT NULL, -- Human readable: WC-2026-00001
    distributor_id TEXT NOT NULL REFERENCES users(id),
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    device_serial TEXT NOT NULL,
    device_model TEXT NOT NULL,
    issue_description TEXT NOT NULL,
    photos TEXT,                      -- JSON array of photo URLs
    ai_diagnosis TEXT,                -- AI-generated diagnosis
    ai_confidence DECIMAL(3,2),       -- 0.00 to 1.00
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'ai_reviewing', 'under_review', 'approved',
        'rejected', 'in_repair', 'shipped', 'completed', 'cancelled'
    )),
    admin_notes TEXT,
    resolution TEXT,
    country_code TEXT REFERENCES countries(code),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Warranty Claim Status History (for tracking)
CREATE TABLE claim_status_history (
    id TEXT PRIMARY KEY,
    claim_id TEXT NOT NULL REFERENCES warranty_claims(id),
    status TEXT NOT NULL,
    notes TEXT,
    changed_by TEXT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PQRs (Peticiones, Quejas, Reclamos, Sugerencias)
CREATE TABLE pqrs (
    id TEXT PRIMARY KEY,
    tracking_id TEXT UNIQUE NOT NULL, -- PQR-2026-00001
    user_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK (type IN ('peticion', 'queja', 'reclamo', 'sugerencia')),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    attachments TEXT,                 -- JSON array of file URLs
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    response TEXT,
    assigned_to TEXT REFERENCES users(id),
    country_code TEXT REFERENCES countries(code),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Distributor Inventory
CREATE TABLE inventory (
    id TEXT PRIMARY KEY,
    distributor_id TEXT NOT NULL REFERENCES users(id),
    product_id TEXT NOT NULL REFERENCES products(id),
    quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    country_code TEXT REFERENCES countries(code),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(distributor_id, product_id)
);

-- Benefits / Rewards Catalog
CREATE TABLE benefits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    points_required INTEGER NOT NULL,
    type TEXT DEFAULT 'reward',       -- reward, discount, service, accessory
    value TEXT,                       -- Could be discount %, free item, etc.
    max_redemptions INTEGER,          -- NULL = unlimited
    current_redemptions INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO benefits (id, name, description, icon, points_required, type, value) VALUES
('BEN-001', 'Kit de limpieza gratis', 'Recibe un kit de limpieza profesional', 'sparkles', 200, 'accessory', 'DryKit'),
('BEN-002', '15% descuento accesorios', 'Descuento en tu proxima compra de accesorios', 'percent', 150, 'discount', '15'),
('BEN-003', 'Revision audiologica', 'Sesion de ajuste MAP gratuita con especialista', 'stethoscope', 500, 'service', 'MAP session'),
('BEN-004', 'Bateria extra', 'Recibe una bateria recargable adicional', 'battery-charging', 350, 'accessory', 'PowerCel Slim'),
('BEN-005', 'AquaCase gratis', 'Proteccion acuatica para tu procesador', 'waves', 400, 'accessory', 'AquaCase');

-- User Benefit Redemptions
CREATE TABLE benefit_redemptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    benefit_id TEXT NOT NULL REFERENCES benefits(id),
    points_spent INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'delivered', 'cancelled')),
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Marketing Campaigns (Super Admin)
CREATE TABLE campaigns (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,                     -- HTML or markdown content
    type TEXT DEFAULT 'general',      -- general, promotion, educational, event
    target_roles TEXT,                -- JSON array: ["cliente", "distribuidor"]
    target_countries TEXT,            -- JSON array: ["COL", "MEX"] or NULL for all
    start_date DATE,
    end_date DATE,
    active BOOLEAN DEFAULT TRUE,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accessories Purchase Requests
CREATE TABLE accessory_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    product_id TEXT NOT NULL REFERENCES products(id),
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    shipping_address TEXT,
    notes TEXT,
    country_code TEXT REFERENCES countries(code),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log (for admin/superadmin tracking)
CREATE TABLE audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,             -- login, update, delete, import, etc.
    entity_type TEXT,                 -- user, device, claim, etc.
    entity_id TEXT,
    details TEXT,                     -- JSON with change details
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Provider/Distributor Info by Country
CREATE TABLE providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    country_code TEXT NOT NULL REFERENCES countries(code),
    type TEXT DEFAULT 'distributor',  -- distributor, service_center, clinic
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    specialties TEXT,                 -- JSON array
    active BOOLEAN DEFAULT TRUE
);

INSERT INTO providers (id, name, country_code, type, address, phone, email) VALUES
('PROV-001', 'AudioTech Colombia', 'COL', 'distributor', 'Bogota, Calle 100 #15-20', '+57 1 234 5678', 'info@audiotech.co'),
('PROV-002', 'Implantes Auditivos MX', 'MEX', 'distributor', 'CDMX, Polanco, Av Presidente 200', '+52 55 9876 5432', 'ventas@iamx.mx'),
('PROV-003', 'AB Audiologia Argentina', 'ARG', 'distributor', 'Buenos Aires, Recoleta, Av Callao 1500', '+54 11 5555 6666', 'contacto@abarg.com'),
('PROV-004', 'Centro Auditivo CR', 'CRI', 'service_center', 'San Jose, Escazu, Plaza Tempo', '+506 2222 3333', 'info@cacr.co.cr');
