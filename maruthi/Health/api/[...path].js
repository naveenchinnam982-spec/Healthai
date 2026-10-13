// Proxy /api/* to the separately deployed FastAPI service.
module.exports = async function handler(req, res) {
  const base = (process.env.HC_API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) return res.status(503).json({ success: false, error: { code: 'BACKEND_NOT_CONFIGURED', message: 'Set HC_API_BASE_URL in Vercel project settings.' } });
  const target = base + req.url;
  const headers = { ...req.headers }; delete headers.host;
  const chunks = []; for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  try {
    const upstream = await fetch(target, { method: req.method, headers, body: ['GET','HEAD'].includes(req.method) ? undefined : body, redirect: 'manual' });
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => { if (!['transfer-encoding','connection','content-encoding'].includes(key.toLowerCase())) res.setHeader(key, value); });
    return res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    return res.status(502).json({ success: false, error: { code: 'BACKEND_PROXY_ERROR', message: 'Could not reach the configured backend.' } });
  }
};
