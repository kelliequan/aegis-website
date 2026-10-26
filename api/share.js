// AEGIS: the page people see when they open an aegisproptech.com/p/CODE (property) or /u/USERNAME (profile) link.
// It shows a preview card, gives WhatsApp / X / Telegram a nice preview, and has an "Open in AEGIS app" button.
// Needs two settings in Vercel (Project, Settings, Environment Variables): SUPABASE_URL and SUPABASE_ANON_KEY.

const SITE = 'https://aegisproptech.com';

const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const naira = (n) => '₦' + Number(n || 0).toLocaleString('en-NG');

async function rpc(name, args) {
  const base = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_ANON_KEY || '';
  if (!base || !key) return { error: 'not-configured' };
  try {
    const r = await fetch(base + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (!r.ok) return { error: 'http-' + r.status };
    const data = await r.json();
    return { data };
  } catch (e) {
    return { error: 'network' };
  }
}

function page({ title, desc, image, canonical, appLink, body, status }) {
  return {
    status: status || 200,
    html: `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex">
<meta property="og:site_name" content="AEGIS">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image || SITE + '/og.png')}">
<meta property="og:url" content="${esc(canonical || SITE)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(image || SITE + '/og.png')}">
<link rel="icon" href="/favicon.png">
<style>
*{box-sizing:border-box}body{margin:0;background:#0a0f1a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{width:100%;max-width:440px;background:#111a2e;border:1px solid #1f2b46;border-radius:22px;overflow:hidden}
.img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;background:#16213a}
.pad{padding:20px}.brand{color:#d4a24c;font-size:11px;font-weight:800;letter-spacing:1.5px}
h1{font-size:20px;margin:6px 0 4px}.muted{color:#8f9bb3;font-size:14px;margin:2px 0}
.price{color:#d4a24c;font-size:24px;font-weight:800;margin:10px 0 2px}
.chip{display:inline-block;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;margin:8px 6px 0 0;background:#d4a24c26;color:#e8c688}
.chip.ok{background:#3ecf8e26;color:#3ecf8e}
.avatar{width:96px;height:96px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 12px;background:#16213a}
.center{text-align:center}
.btn{display:block;text-align:center;text-decoration:none;font-weight:800;font-size:15px;border-radius:14px;padding:14px;margin-top:14px}
.gold{background:#d4a24c;color:#1a1206}.off{background:#16213a;color:#8f9bb3}
.fine{color:#5c6785;font-size:11px;text-align:center;margin-top:14px;line-height:1.5}
</style></head><body>
<div class="card">${body}
<div class="pad" style="padding-top:0">
${appLink ? `<a class="btn gold" href="${esc(appLink)}">Open in AEGIS app</a>` : ''}
<a class="btn off" href="${SITE}">Get the AEGIS app, coming soon</a>
<div class="fine">AEGIS verifies agents, landlords and listings. Never pay outside the app.</div>
</div></div></body></html>`,
  };
}

function propertyPage(p, code) {
  const period = p.price_period && String(p.price_period).toLowerCase() !== 'once' ? ' / ' + esc(p.price_period) : '';
  const facts = [p.property_type, p.beds ? p.beds + ' bed' : '', p.baths ? p.baths + ' bath' : ''].filter(Boolean).join(' · ');
  const verified = p.status === 'verified';
  const desc = [naira(p.price) + (p.price_period && String(p.price_period).toLowerCase() !== 'once' ? ' / ' + p.price_period : ''), p.location, verified ? 'Verified by AEGIS' : 'Pending AEGIS verification'].filter(Boolean).join(' · ');
  const body = `${p.image ? `<img class="img" src="${esc(p.image)}" alt="">` : ''}
<div class="pad"><div class="brand">AEGIS</div><h1>${esc(p.title || 'Property')}</h1>
<div class="muted">${esc(p.location || '')}</div>
<div class="price">${esc(naira(p.price))}<span class="muted" style="font-size:13px;font-weight:500">${period}</span></div>
${facts ? `<div class="muted">${esc(facts)}</div>` : ''}
<span class="chip ${verified ? 'ok' : ''}">${verified ? 'Verified by AEGIS' : 'Pending verification'}</span>
${p.owner_name ? `<div class="muted" style="margin-top:12px">Listed by ${esc(p.owner_name)}</div>` : ''}</div>`;
  return page({
    title: (p.title || 'Property') + ' | AEGIS',
    desc,
    image: p.image,
    canonical: p.owner_username ? SITE + '/' + p.owner_username + '/property/' + code : SITE + '/p/' + code,
    appLink: p.owner_username ? 'aegisnative://' + p.owner_username + '/property/' + code : 'aegisnative://p/' + code,
    body,
  });
}

function profilePage(p) {
  const role = p.role === 'agent' ? (p.agent_type === 'agency' ? 'Real Estate Agency' : 'Independent Agent') : p.role === 'landlord' ? 'Landlord' : 'Tenant';
  const verified = p.verify_status === 'verified';
  const name = p.business_name && p.agent_type === 'agency' ? p.business_name : p.full_name || p.username;
  const desc = [role, verified ? 'Verified by AEGIS' : '', p.listings ? p.listings + ' verified listing' + (p.listings === 1 ? '' : 's') : ''].filter(Boolean).join(' · ');
  const body = `<div class="pad center" style="padding-top:28px"><div class="brand">AEGIS</div>
${p.avatar_url ? `<img class="avatar" style="margin-top:14px" src="${esc(p.avatar_url)}" alt="">` : `<div class="avatar" style="margin-top:14px"></div>`}
<h1>${esc(name)}</h1><div class="muted">@${esc(p.username)}</div><div class="muted">${esc(role)}</div>
<span class="chip ${verified ? 'ok' : ''}">${verified ? 'Verified by AEGIS' : 'Not yet verified'}</span>
<span class="chip">Trust ${esc(p.trust_score || 0)}/100</span>
${p.listings ? `<div class="muted" style="margin-top:12px">${esc(p.listings)} verified listing${p.listings === 1 ? '' : 's'}</div>` : ''}</div>`;
  return page({
    title: name + ' (@' + p.username + ') | AEGIS',
    desc,
    image: p.avatar_url,
    canonical: SITE + '/' + p.username,
    appLink: 'aegisnative://' + p.username,
    body,
  });
}

module.exports = async (req, res) => {
  const sp = new URL(req.url, 'http://x').searchParams;
  const type = sp.get('t');
  const raw = String(sp.get('c') || '').slice(0, 60);
  const key = raw.toLowerCase().replace(/[^a-z0-9_.-]/g, '');

  let out;
  if (!key || (type !== 'p' && type !== 'u')) {
    out = page({ title: 'AEGIS', desc: 'Verified real estate.', body: '<div class="pad center"><h1>Link not found</h1><div class="muted">Check the link and try again.</div></div>', status: 404 });
  } else {
    const r = type === 'p' ? await rpc('get_shared_property', { p_code: key }) : await rpc('get_shared_profile', { p_username: key });
    if (r.error === 'not-configured') {
      out = page({ title: 'AEGIS', desc: 'Verified real estate.', body: '<div class="pad center"><h1>AEGIS</h1><div class="muted">This page is not set up yet.</div></div>', status: 503 });
    } else if (r.error) {
      out = page({ title: 'AEGIS', desc: 'Verified real estate.', body: '<div class="pad center"><h1>Please try again</h1><div class="muted">We could not load this page right now.</div></div>', status: 502 });
    } else if (!r.data) {
      out = page({ title: 'Not available | AEGIS', desc: 'This link is no longer available.', body: '<div class="pad center"><h1>Not available</h1><div class="muted">This link is wrong, or the listing or account was removed.</div></div>', status: 404 });
    } else {
      out = type === 'p' ? propertyPage(r.data, key) : profilePage(r.data);
    }
  }
  res.statusCode = out.status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', out.status === 200 ? 'public, s-maxage=60, stale-while-revalidate=300' : 'no-store');
  res.end(out.html);
};
