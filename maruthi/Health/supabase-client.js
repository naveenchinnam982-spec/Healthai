/* Browser-safe Supabase client initialized from Vercel runtime configuration. */
(function () {
  window.HC_SUPABASE_READY = fetch('/api/config', { headers: { Accept: 'application/json' } })
    .then(async (response) => {
      const config = await response.json();
      if (!response.ok) throw new Error(config.error || 'Supabase configuration is missing.');
      if (!window.supabase || typeof window.supabase.createClient !== 'function') throw new Error('Supabase JS SDK failed to load.');
      window.HC_CONFIG = config;
      window.supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
      return window.supabaseClient;
    }).catch((error) => { console.error('[Supabase] Client initialization failed:', error.message); window.HC_SUPABASE_ERROR = error; return null; });
})();
