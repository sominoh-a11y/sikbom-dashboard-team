export const config = { runtime: 'edge' };

const ALLOWED_ORIGINS = ['https://sikbom-dashboard-team.vercel.app'];

export default async function handler(req) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(allowedOrigin) });
  }

  if (req.method !== 'POST') {
    return res({ error: '허용되지 않는 메서드' }, 405, allowedOrigin);
  }

  const body = await req.json().catch(() => ({}));
  const { password } = body;

  const correctPw = process.env.DASHBOARD_PASSWORD;
  const token     = process.env.DASHBOARD_ACCESS_TOKEN;

  if (!correctPw || !token) {
    return res({ error: '서버 설정 오류' }, 500, allowedOrigin);
  }

  if (password !== correctPw) {
    return res({ ok: false }, 401, allowedOrigin);
  }

  return res({ ok: true, token }, 200, allowedOrigin);
}

const corsHeaders = origin => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
});
const res = (data, status, origin) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
});
