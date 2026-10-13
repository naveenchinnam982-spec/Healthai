// Expose only browser-safe Supabase settings. Never return a service-role key.
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseAnonKey) return res.status(503).json({ error: 'Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel.' });
  return res.status(200).json({ supabaseUrl, supabaseAnonKey });
};
