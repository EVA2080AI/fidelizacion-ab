/* ============================================================
   AB HUB+ Supabase Client
   ============================================================ */
window.AB = window.AB || {};

AB.Supabase = {
    client: null,
    isConfigured: false,

    // *** CONFIGURE THESE WITH YOUR SUPABASE PROJECT ***
    SUPABASE_URL: '', // e.g. 'https://xxxxx.supabase.co'
    SUPABASE_ANON_KEY: '', // e.g. 'eyJhbGci...'

    init() {
        if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
            console.log('AB HUB+: Supabase not configured, using localStorage mode');
            this.isConfigured = false;
            return;
        }

        if (typeof supabase === 'undefined') {
            console.warn('AB HUB+: Supabase JS library not loaded');
            this.isConfigured = false;
            return;
        }

        this.client = supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
        this.isConfigured = true;
        console.log('AB HUB+: Supabase connected');
    },

    // --- AUTH ---
    async signUp(email, password, metadata) {
        if (!this.isConfigured) return { error: 'Supabase not configured' };
        const { data, error } = await this.client.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: metadata.name,
                    role: metadata.role,
                    country_code: metadata.country_code
                }
            }
        });
        return { data, error };
    },

    async signIn(email, password) {
        if (!this.isConfigured) return { error: 'Supabase not configured' };
        const { data, error } = await this.client.auth.signInWithPassword({ email, password });
        return { data, error };
    },

    async signOut() {
        if (!this.isConfigured) return;
        await this.client.auth.signOut();
    },

    async getSession() {
        if (!this.isConfigured) return null;
        const { data: { session } } = await this.client.auth.getSession();
        return session;
    },

    async getUser() {
        if (!this.isConfigured) return null;
        const { data: { user } } = await this.client.auth.getUser();
        return user;
    },

    onAuthStateChange(callback) {
        if (!this.isConfigured) return;
        this.client.auth.onAuthStateChange(callback);
    },

    // --- PROFILE ---
    async getProfile(userId) {
        if (!this.isConfigured) return null;
        const { data } = await this.client.from('profiles').select('*').eq('id', userId).single();
        return data;
    },

    async updateProfile(userId, updates) {
        if (!this.isConfigured) return null;
        const { data, error } = await this.client.from('profiles').update(updates).eq('id', userId).select().single();
        return { data, error };
    },

    // --- GENERIC QUERIES ---
    async select(table, options = {}) {
        if (!this.isConfigured) return [];
        let query = this.client.from(table).select(options.select || '*');
        if (options.eq) Object.entries(options.eq).forEach(([col, val]) => { query = query.eq(col, val); });
        if (options.in) Object.entries(options.in).forEach(([col, vals]) => { query = query.in(col, vals); });
        if (options.gte) Object.entries(options.gte).forEach(([col, val]) => { query = query.gte(col, val); });
        if (options.lte) Object.entries(options.lte).forEach(([col, val]) => { query = query.lte(col, val); });
        if (options.order) query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
        if (options.limit) query = query.limit(options.limit);
        const { data, error } = await query;
        if (error) console.error(`Supabase select ${table}:`, error);
        return data || [];
    },

    async selectOne(table, id) {
        if (!this.isConfigured) return null;
        const { data } = await this.client.from(table).select('*').eq('id', id).single();
        return data;
    },

    async insert(table, row) {
        if (!this.isConfigured) return null;
        const { data, error } = await this.client.from(table).insert(row).select().single();
        if (error) console.error(`Supabase insert ${table}:`, error);
        return data;
    },

    async update(table, id, updates) {
        if (!this.isConfigured) return null;
        const { data, error } = await this.client.from(table).update(updates).eq('id', id).select().single();
        if (error) console.error(`Supabase update ${table}:`, error);
        return data;
    },

    async delete(table, id) {
        if (!this.isConfigured) return;
        const { error } = await this.client.from(table).delete().eq('id', id);
        if (error) console.error(`Supabase delete ${table}:`, error);
    },

    async count(table, options = {}) {
        if (!this.isConfigured) return 0;
        let query = this.client.from(table).select('*', { count: 'exact', head: true });
        if (options.eq) Object.entries(options.eq).forEach(([col, val]) => { query = query.eq(col, val); });
        const { count } = await query;
        return count || 0;
    },

    // --- STORAGE ---
    async uploadFile(bucket, path, file) {
        if (!this.isConfigured) return null;
        const { data, error } = await this.client.storage.from(bucket).upload(path, file, {
            cacheControl: '3600',
            upsert: false
        });
        if (error) { console.error('Upload error:', error); return null; }
        // Return public URL
        const { data: { publicUrl } } = this.client.storage.from(bucket).getPublicUrl(data.path);
        return publicUrl;
    },

    async uploadWarrantyPhoto(file, claimId) {
        const ext = file.name.split('.').pop();
        const path = `claims/${claimId}/${Date.now()}.${ext}`;
        return this.uploadFile('warranty-photos', path, file);
    },

    // --- REALTIME SUBSCRIPTIONS ---
    subscribeToTable(table, callback, filter) {
        if (!this.isConfigured) return null;
        let channel = this.client.channel(`${table}_changes`);
        const config = { event: '*', schema: 'public', table };
        if (filter) config.filter = filter;
        channel = channel.on('postgres_changes', config, callback);
        channel.subscribe();
        return channel;
    },

    unsubscribe(channel) {
        if (channel) this.client.removeChannel(channel);
    }
};
