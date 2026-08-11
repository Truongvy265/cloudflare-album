const responseHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex, nofollow, noarchive'
};

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: responseHeaders });
const text = value => typeof value === 'string' ? value.trim() : '';

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function validPhone(value) {
  return /^[0-9+().\s-]{8,20}$/.test(value);
}

export async function onRequestPost({ request, params, env }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Dịch vụ album chưa được cấu hình.' }, 500);
  const token = String(params.token || '');
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(token)) return json({ error: 'Album không tồn tại.' }, 404);

  let input;
  try { input = await request.json(); }
  catch (_) { return json({ error: 'Dữ liệu khảo sát không hợp lệ.' }, 400); }

  const fullName = text(input.fullName);
  const email = text(input.email).toLowerCase();
  const phone = text(input.phone);
  const likesPhotobooth = text(input.likesPhotobooth);
  const priceRange = text(input.priceRange);
  const priceOther = text(input.priceOther);
  const readiness = text(input.readiness);
  const feedback = text(input.feedback);
  const consent = input.consent === true;
  const allowedPrices = ['70000', '100000', 'over100000', 'other'];
  const allowedReadiness = ['considering', 'ready', 'very_ready', 'excited'];

  if (fullName.length < 2 || fullName.length > 120) return json({ error: 'Vui lòng nhập họ và tên hợp lệ.' }, 400);
  if (!validEmail(email)) return json({ error: 'Email không hợp lệ.' }, 400);
  if (!validPhone(phone)) return json({ error: 'Số điện thoại không hợp lệ.' }, 400);
  if (!['yes', 'no'].includes(likesPhotobooth)) return json({ error: 'Vui lòng trả lời câu hỏi về Photobooth.' }, 400);
  if (!allowedPrices.includes(priceRange)) return json({ error: 'Vui lòng chọn mức giá.' }, 400);
  if (priceRange === 'other' && (priceOther.length < 2 || priceOther.length > 120)) return json({ error: 'Vui lòng nhập mức giá khác.' }, 400);
  if (!allowedReadiness.includes(readiness)) return json({ error: 'Vui lòng chọn mức độ sẵn sàng.' }, 400);
  if (feedback.length < 2 || feedback.length > 1000) return json({ error: 'Vui lòng nhập góp ý (tối đa 1.000 ký tự).' }, 400);
  if (!consent) return json({ error: 'Bạn cần đồng ý lưu thông tin khảo sát để tiếp tục.' }, 400);

  const sessionQuery = new URLSearchParams({
    token: `eq.${token}`,
    expires_at: `gt.${new Date().toISOString()}`,
    select: 'id,token,mode,image_count,images,created_at,expires_at',
    limit: '1'
  });
  const authHeaders = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };
  const sessionResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/photo_sessions?${sessionQuery}`, { headers: authHeaders });
  if (!sessionResponse.ok) return json({ error: 'Không thể mở album lúc này.' }, 502);
  const sessions = await sessionResponse.json();
  if (!sessions.length) return json({ error: 'Album không tồn tại hoặc đã hết hạn.' }, 404);
  const session = sessions[0];

  const insertResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/survey_responses`, {
    method: 'POST',
    headers: { ...authHeaders, 'content-type': 'application/json', prefer: 'return=minimal' },
    body: JSON.stringify({
      photo_session_id: session.id,
      session_token: session.token,
      full_name: fullName,
      email,
      phone,
      likes_photobooth: likesPhotobooth === 'yes',
      price_range: priceRange,
      price_other: priceRange === 'other' ? priceOther : null,
      readiness,
      feedback,
      consent: true,
      survey_version: 1
    })
  });
  if (!insertResponse.ok) {
    console.error('Survey insert failed:', insertResponse.status, await insertResponse.text());
    return json({ error: 'Chưa lưu được khảo sát. Vui lòng thử lại.' }, 502);
  }

  return json({
    token: session.token,
    mode: session.mode,
    imageCount: session.image_count,
    images: session.images,
    createdAt: session.created_at,
    expiresAt: session.expires_at
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: 'POST, OPTIONS' } });
}
