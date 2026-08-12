const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  }
});

function hasValidSecret(request, env) {
  const authorization = request.headers.get('authorization') || '';
  return Boolean(env.PHOTOBOOTH_API_SECRET)
    && authorization === `Bearer ${env.PHOTOBOOTH_API_SECRET}`;
}

function isValidImage(image) {
  return image
    && typeof image.directUrl === 'string'
    && image.directUrl.startsWith('https://')
    && typeof image.viewerUrl === 'string'
    && image.viewerUrl.startsWith('https://');
}

export async function onRequestPost({ request, env }) {
  if (!hasValidSecret(request, env)) return json({ error: 'Unauthorized' }, 401);
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Cloudflare album API is not configured.' }, 500);
  }

  let input;
  try { input = await request.json(); }
  catch (_) { return json({ error: 'Invalid JSON body.' }, 400); }

  const mode = input?.mode;
  const token = input?.token;
  const images = input?.images;
  if (!['quick2', 'photobooth'].includes(mode)) return json({ error: 'Invalid session mode.' }, 400);
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{20,80}$/.test(token)) return json({ error: 'Invalid session token.' }, 400);
  if (!Array.isArray(images) || images.length < 1 || images.length > 9 || !images.every(isValidImage)) {
    return json({ error: 'Session must contain 1-9 valid images.' }, 400);
  }

  const publicImages = images.map(({ directUrl, viewerUrl, kind, order }) => ({
    directUrl,
    viewerUrl,
    kind: kind === 'collage' ? 'collage' : 'original',
    order: Number.isInteger(order) ? order : 0
  }));
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/photo_sessions`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      prefer: 'return=representation'
    },
    body: JSON.stringify({ token, mode, image_count: publicImages.length, images: publicImages })
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error('Supabase insert failed:', response.status, detail);
    return json({ error: 'Could not create photo session.' }, 502);
  }

  const rows = await response.json();
  const session = rows[0];
  return json({
    token: session.token,
    mode: session.mode,
    imageCount: session.image_count,
    expiresAt: session.expires_at
  }, 201);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: 'POST, OPTIONS' } });
}
