-- ============================================================
-- AB HUB+ Supabase Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (linked to Supabase Auth)
-- ============================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'cliente' CHECK (role IN ('cliente', 'especialista', 'distribuidor', 'admin', 'superadmin')),
    country_code TEXT NOT NULL DEFAULT 'COL',
    phone TEXT,
    company TEXT,
    license_number TEXT,
    avatar_url TEXT,
    points INTEGER DEFAULT 0,
    first_login BOOLEAN DEFAULT TRUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role, country_code)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'cliente'),
        COALESCE(NEW.raw_user_meta_data->>'country_code', 'COL')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. COUNTRIES
-- ============================================================
CREATE TABLE public.countries (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    currency TEXT DEFAULT 'USD',
    phone_prefix TEXT,
    flag TEXT,
    active BOOLEAN DEFAULT TRUE
);

INSERT INTO public.countries (code, name, currency, phone_prefix, flag) VALUES
('COL', 'Colombia', 'COP', '+57', '🇨🇴'),
('MEX', 'Mexico', 'MXN', '+52', '🇲🇽'),
('ARG', 'Argentina', 'ARS', '+54', '🇦🇷'),
('CRI', 'Costa Rica', 'CRC', '+506', '🇨🇷'),
('CHL', 'Chile', 'CLP', '+56', '🇨🇱'),
('PER', 'Peru', 'PEN', '+51', '🇵🇪');

-- ============================================================
-- 3. PRODUCTS
-- ============================================================
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('implant', 'processor', 'accessory')),
    model TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    compatible_with TEXT[],
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.products (name, category, model, description, price) VALUES
('Marvel CI', 'implant', 'HiRes Ultra 3D', 'Implante coclear de ultima generacion con tecnologia HiRes Ultra 3D', 0),
('Naida CI Marvel', 'processor', 'M90', 'Procesador de sonido con conectividad directa Bluetooth', 0),
('Sky CI Marvel', 'processor', 'Sky M', 'Procesador pediatrico con diseno resistente', 0),
('T-Mic 2', 'accessory', 'T-Mic 2', 'Microfono con posicion natural del oido', 85),
('AquaCase', 'accessory', 'AquaCase', 'Proteccion acuatica IP68 para procesador', 120),
('Cable de carga', 'accessory', 'PowerCel Cable', 'Cable USB-C de carga rapida', 25),
('Kit de secado', 'accessory', 'DryKit Pro', 'Kit electronico de secado nocturno UV', 65),
('Bateria recargable', 'accessory', 'PowerCel Slim', 'Bateria compacta recargable 16h', 95);

-- ============================================================
-- 4. DEVICES
-- ============================================================
CREATE TABLE public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    serial_number TEXT UNIQUE NOT NULL,
    model TEXT NOT NULL,
    implant_side TEXT CHECK (implant_side IN ('left', 'right', 'bilateral')),
    purchase_date DATE NOT NULL,
    warranty_start DATE NOT NULL,
    warranty_expiry DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_repair', 'replaced', 'expired')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. CHECKLIST TEMPLATES
-- ============================================================
CREATE TABLE public.checklist_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    points_reward INTEGER DEFAULT 5,
    order_index INTEGER DEFAULT 0
);

INSERT INTO public.checklist_templates (name, description, icon, frequency, points_reward, order_index) VALUES
('Limpiar T-Mic', 'Limpia el microfono T-Mic con un pano suave y seco', 'mic', 'daily', 5, 1),
('Revisar cable', 'Inspecciona el cable de conexion por danos visibles', 'cable', 'daily', 5, 2),
('Secar procesador', 'Coloca el procesador en el kit de secado durante la noche', 'droplets', 'daily', 10, 3),
('Verificar bateria', 'Revisa el nivel de carga y estado de la bateria', 'battery-full', 'daily', 5, 4),
('Limpiar imanes', 'Limpia los imanes con alcohol isopropilico', 'magnet', 'weekly', 15, 5),
('Test de sonido', 'Realiza la prueba de sonido con la app AB', 'volume-2', 'daily', 10, 6);

-- ============================================================
-- 6. CHECKLIST COMPLETIONS
-- ============================================================
CREATE TABLE public.checklist_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.devices(id),
    checklist_id UUID NOT NULL REFERENCES public.checklist_templates(id),
    points_earned INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. TUTORIALS
-- ============================================================
CREATE TABLE public.tutorials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_minutes INTEGER,
    category TEXT CHECK (category IN ('setup', 'care', 'features', 'troubleshooting')),
    difficulty TEXT DEFAULT 'beginner',
    points_reward INTEGER DEFAULT 20,
    order_index INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE
);

INSERT INTO public.tutorials (title, description, video_url, duration_minutes, category, points_reward, order_index) VALUES
('Primeros pasos con Marvel CI', 'Guia completa para nuevos usuarios del implante Marvel', 'https://www.youtube.com/watch?v=example1', 12, 'setup', 30, 1),
('Cuidado diario del procesador', 'Rutina de mantenimiento esencial para tu procesador', 'https://www.youtube.com/watch?v=example2', 8, 'care', 20, 2),
('Conectividad Bluetooth', 'Conecta tu procesador a dispositivos moviles', 'https://www.youtube.com/watch?v=example3', 10, 'features', 20, 3),
('Limpieza del T-Mic', 'Tutorial detallado de limpieza del microfono', 'https://www.youtube.com/watch?v=example4', 5, 'care', 15, 4),
('Solucion de problemas', 'Diagnostico de problemas frecuentes', 'https://www.youtube.com/watch?v=example5', 15, 'troubleshooting', 25, 5),
('Uso en ambientes ruidosos', 'Programas para ambientes dificiles', 'https://www.youtube.com/watch?v=example6', 10, 'features', 20, 6);

-- ============================================================
-- 8. TUTORIAL COMPLETIONS
-- ============================================================
CREATE TABLE public.tutorial_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tutorial_id UUID NOT NULL REFERENCES public.tutorials(id),
    points_earned INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tutorial_id)
);

-- ============================================================
-- 9. WARRANTY CLAIMS
-- ============================================================
CREATE TABLE public.warranty_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_id TEXT UNIQUE NOT NULL,
    distributor_id UUID NOT NULL REFERENCES public.profiles(id),
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    device_serial TEXT NOT NULL,
    device_model TEXT NOT NULL,
    issue_description TEXT NOT NULL,
    photos TEXT[],
    ai_diagnosis TEXT,
    ai_confidence DECIMAL(3,2),
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'ai_reviewing', 'under_review', 'approved',
        'rejected', 'in_repair', 'shipped', 'completed', 'cancelled'
    )),
    admin_notes TEXT,
    resolution TEXT,
    country_code TEXT REFERENCES public.countries(code),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ============================================================
-- 10. CLAIM STATUS HISTORY
-- ============================================================
CREATE TABLE public.claim_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES public.warranty_claims(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. PQRs
-- ============================================================
CREATE TABLE public.pqrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_id TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('peticion', 'queja', 'reclamo', 'sugerencia')),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    attachments TEXT[],
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    response TEXT,
    assigned_to UUID REFERENCES public.profiles(id),
    country_code TEXT REFERENCES public.countries(code),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ============================================================
-- 12. INVENTORY
-- ============================================================
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distributor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    product_name TEXT,
    quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    country_code TEXT REFERENCES public.countries(code),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(distributor_id, product_id)
);

-- ============================================================
-- 13. BENEFITS
-- ============================================================
CREATE TABLE public.benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    points_required INTEGER NOT NULL,
    type TEXT DEFAULT 'reward' CHECK (type IN ('reward', 'discount', 'service', 'accessory')),
    value TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.benefits (name, description, icon, points_required, type) VALUES
('Kit de limpieza gratis', 'Kit profesional de limpieza', 'sparkles', 200, 'accessory'),
('15% descuento accesorios', 'En tu proxima compra', 'percent', 150, 'discount'),
('Revision audiologica', 'Sesion MAP gratuita', 'stethoscope', 500, 'service'),
('Bateria extra', 'Bateria PowerCel adicional', 'battery-charging', 350, 'accessory'),
('AquaCase gratis', 'Proteccion acuatica', 'waves', 400, 'accessory');

-- ============================================================
-- 14. BENEFIT REDEMPTIONS
-- ============================================================
CREATE TABLE public.benefit_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    benefit_id UUID NOT NULL REFERENCES public.benefits(id),
    points_spent INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'delivered', 'cancelled')),
    redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. CAMPAIGNS
-- ============================================================
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    type TEXT DEFAULT 'general' CHECK (type IN ('general', 'promotion', 'educational', 'event')),
    target_roles TEXT[],
    target_countries TEXT[],
    start_date DATE,
    end_date DATE,
    active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. ACCESSORY REQUESTS
-- ============================================================
CREATE TABLE public.accessory_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    shipping_address TEXT,
    notes TEXT,
    country_code TEXT REFERENCES public.countries(code),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 17. PROVIDERS
-- ============================================================
CREATE TABLE public.providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    country_code TEXT NOT NULL REFERENCES public.countries(code),
    type TEXT DEFAULT 'distributor',
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    specialties TEXT[],
    active BOOLEAN DEFAULT TRUE
);

INSERT INTO public.providers (name, country_code, type, address, phone, email) VALUES
('AudioTech Colombia', 'COL', 'distributor', 'Bogota, Calle 100 #15-20', '+57 1 234 5678', 'info@audiotech.co'),
('Implantes Auditivos MX', 'MEX', 'distributor', 'CDMX, Polanco, Av Presidente 200', '+52 55 9876 5432', 'ventas@iamx.mx'),
('AB Audiologia Argentina', 'ARG', 'distributor', 'Buenos Aires, Recoleta, Av Callao 1500', '+54 11 5555 6666', 'contacto@abarg.com'),
('Centro Auditivo CR', 'CRI', 'service_center', 'San Jose, Escazu, Plaza Tempo', '+506 2222 3333', 'info@cacr.co.cr');

-- ============================================================
-- 18. AUDIT LOG
-- ============================================================
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRACKING ID SEQUENCE
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS warranty_claim_seq START 1;
CREATE SEQUENCE IF NOT EXISTS pqr_seq START 1;

CREATE OR REPLACE FUNCTION generate_tracking_id(prefix TEXT, seq_name TEXT)
RETURNS TEXT AS $$
DECLARE
    next_val INTEGER;
BEGIN
    EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_val;
    RETURN prefix || '-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(next_val::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Auto-generate tracking IDs
CREATE OR REPLACE FUNCTION set_warranty_tracking_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tracking_id IS NULL OR NEW.tracking_id = '' THEN
        NEW.tracking_id := generate_tracking_id('WC', 'warranty_claim_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER warranty_claim_tracking
    BEFORE INSERT ON public.warranty_claims
    FOR EACH ROW EXECUTE FUNCTION set_warranty_tracking_id();

CREATE OR REPLACE FUNCTION set_pqr_tracking_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tracking_id IS NULL OR NEW.tracking_id = '' THEN
        NEW.tracking_id := generate_tracking_id('PQR', 'pqr_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pqr_tracking
    BEFORE INSERT ON public.pqrs
    FOR EACH ROW EXECUTE FUNCTION set_pqr_tracking_id();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER claims_updated BEFORE UPDATE ON public.warranty_claims FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER pqrs_updated BEFORE UPDATE ON public.pqrs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER campaigns_updated BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user's country
CREATE OR REPLACE FUNCTION public.get_my_country()
RETURNS TEXT AS $$
    SELECT country_code FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admin can view all profiles" ON public.profiles FOR SELECT USING (get_my_role() IN ('admin', 'superadmin'));
CREATE POLICY "Especialista can view clients" ON public.profiles FOR SELECT USING (get_my_role() = 'especialista' AND role = 'cliente');
CREATE POLICY "Superadmin can modify all" ON public.profiles FOR ALL USING (get_my_role() = 'superadmin');

-- COUNTRIES (public read)
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read countries" ON public.countries FOR SELECT USING (true);
CREATE POLICY "Superadmin can modify countries" ON public.countries FOR ALL USING (get_my_role() = 'superadmin');

-- PRODUCTS (public read)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Superadmin can modify products" ON public.products FOR ALL USING (get_my_role() = 'superadmin');

-- DEVICES
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients see own devices" ON public.devices FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin/specialist see all devices" ON public.devices FOR SELECT USING (get_my_role() IN ('admin', 'superadmin', 'especialista'));
CREATE POLICY "Superadmin can modify devices" ON public.devices FOR ALL USING (get_my_role() = 'superadmin');

-- CHECKLIST TEMPLATES (public read)
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read checklist templates" ON public.checklist_templates FOR SELECT USING (true);
CREATE POLICY "Superadmin can modify templates" ON public.checklist_templates FOR ALL USING (get_my_role() = 'superadmin');

-- CHECKLIST COMPLETIONS
ALTER TABLE public.checklist_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own completions" ON public.checklist_completions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own completions" ON public.checklist_completions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin can see all completions" ON public.checklist_completions FOR SELECT USING (get_my_role() IN ('admin', 'superadmin'));

-- TUTORIALS (public read)
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tutorials" ON public.tutorials FOR SELECT USING (true);
CREATE POLICY "Superadmin can modify tutorials" ON public.tutorials FOR ALL USING (get_my_role() = 'superadmin');

-- TUTORIAL COMPLETIONS
ALTER TABLE public.tutorial_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own completions" ON public.tutorial_completions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own completions" ON public.tutorial_completions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin can see all" ON public.tutorial_completions FOR SELECT USING (get_my_role() IN ('admin', 'superadmin'));

-- WARRANTY CLAIMS
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Distributor sees own claims" ON public.warranty_claims FOR SELECT USING (distributor_id = auth.uid());
CREATE POLICY "Distributor can create claims" ON public.warranty_claims FOR INSERT WITH CHECK (distributor_id = auth.uid());
CREATE POLICY "Admin can see all claims" ON public.warranty_claims FOR SELECT USING (get_my_role() IN ('admin', 'superadmin'));
CREATE POLICY "Superadmin can modify claims" ON public.warranty_claims FOR ALL USING (get_my_role() = 'superadmin');
CREATE POLICY "Admin can update claim status" ON public.warranty_claims FOR UPDATE USING (get_my_role() = 'admin');

-- CLAIM STATUS HISTORY
ALTER TABLE public.claim_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Related users can see history" ON public.claim_status_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.warranty_claims wc WHERE wc.id = claim_id AND (wc.distributor_id = auth.uid() OR get_my_role() IN ('admin', 'superadmin')))
);
CREATE POLICY "Authorized can insert history" ON public.claim_status_history FOR INSERT WITH CHECK (
    get_my_role() IN ('distribuidor', 'admin', 'superadmin')
);

-- PQRs
ALTER TABLE public.pqrs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own PQRs" ON public.pqrs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create PQRs" ON public.pqrs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin can see all PQRs" ON public.pqrs FOR SELECT USING (get_my_role() IN ('admin', 'superadmin'));
CREATE POLICY "Superadmin can modify PQRs" ON public.pqrs FOR ALL USING (get_my_role() = 'superadmin');

-- INVENTORY
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Distributor sees own inventory" ON public.inventory FOR SELECT USING (distributor_id = auth.uid());
CREATE POLICY "Distributor can manage own inventory" ON public.inventory FOR ALL USING (distributor_id = auth.uid());
CREATE POLICY "Admin can see all inventory" ON public.inventory FOR SELECT USING (get_my_role() IN ('admin', 'superadmin'));

-- BENEFITS (public read)
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read benefits" ON public.benefits FOR SELECT USING (true);
CREATE POLICY "Superadmin can modify benefits" ON public.benefits FOR ALL USING (get_my_role() = 'superadmin');

-- BENEFIT REDEMPTIONS
ALTER TABLE public.benefit_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own redemptions" ON public.benefit_redemptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can redeem" ON public.benefit_redemptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin can see all" ON public.benefit_redemptions FOR SELECT USING (get_my_role() IN ('admin', 'superadmin'));

-- CAMPAIGNS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active campaigns visible to targets" ON public.campaigns FOR SELECT USING (active = true);
CREATE POLICY "Superadmin can manage campaigns" ON public.campaigns FOR ALL USING (get_my_role() = 'superadmin');

-- ACCESSORY REQUESTS
ALTER TABLE public.accessory_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own requests" ON public.accessory_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create requests" ON public.accessory_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin can see all" ON public.accessory_requests FOR SELECT USING (get_my_role() IN ('admin', 'superadmin'));

-- PROVIDERS (public read)
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read providers" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Superadmin can modify providers" ON public.providers FOR ALL USING (get_my_role() = 'superadmin');

-- AUDIT LOG
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can read audit log" ON public.audit_log FOR SELECT USING (get_my_role() IN ('admin', 'superadmin'));
CREATE POLICY "System can insert audit log" ON public.audit_log FOR INSERT WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKET (for warranty claim photos)
-- ============================================================
-- Run this separately in Storage settings or via SQL:
INSERT INTO storage.buckets (id, name, public) VALUES ('warranty-photos', 'warranty-photos', false);

CREATE POLICY "Distributors can upload photos" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'warranty-photos' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'distribuidor');

CREATE POLICY "Authorized can view photos" ON storage.objects FOR SELECT
    USING (bucket_id = 'warranty-photos' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('distribuidor', 'admin', 'superadmin'));

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_country ON public.profiles(country_code);
CREATE INDEX idx_devices_user ON public.devices(user_id);
CREATE INDEX idx_devices_warranty ON public.devices(warranty_expiry);
CREATE INDEX idx_checklist_comp_user ON public.checklist_completions(user_id, completed_at);
CREATE INDEX idx_claims_distributor ON public.warranty_claims(distributor_id);
CREATE INDEX idx_claims_status ON public.warranty_claims(status);
CREATE INDEX idx_pqrs_user ON public.pqrs(user_id);
CREATE INDEX idx_inventory_distributor ON public.inventory(distributor_id);
CREATE INDEX idx_audit_user ON public.audit_log(user_id);
