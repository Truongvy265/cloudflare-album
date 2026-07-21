const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'private, max-age=60',
    'x-robots-tag': 'noindex, nofollow, noarchive'
  }
});

export async function onRequestGet({ params, env }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Album service is not configured.' }, 500);
  }
  const token = String(params.token || '');
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(token)) return json({ error: 'Album not found.' }, 404);

  const query = new URLSearchParams({
    token: `eq.${token}`,
    expires_at: `gt.${new Date().toISOString()}`,
    select: 'token,mode,image_count,images,created_at,expires_at',
    limit: '1'
  });
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/photo_sessions?${query}`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  if (!response.ok) return json({ error: 'Could not load album.' }, 502);
  const rows = await response.json();
  if (!rows.length) return json({ error: 'Album not found or expired.' }, 404);

  const session = rows[0];
  return json({
    token: session.token,
    mode: session.mode,
    imageCount: session.image_count,
    images: session.images,
    createdAt: session.created_at,
    expiresAt: session.expires_at
  });
}
