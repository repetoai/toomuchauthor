// 쓰다보니 작가가 너무 많아 — 응원 메시지·박수 API
// index.html / admin.html 이 쓰던 Apps Script 와 같은 약속(action=…)을 그대로 지킵니다.
//   공개:   action=get | clap&n= | msg&t=&name=
//   관리자: action=admin_list | hide&row= | unhide&row= | delete&row= | reset_claps   (모두 &key=관리자비밀번호)
// 저장소: Upstash Redis (북내면과 같은 저장소를 쓰되 서랍 이름이 달라 섞이지 않음)
import { Redis } from '@upstash/redis';

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = (url && token) ? new Redis({ url, token }) : null;

const NS = process.env.CHEERS_KEY || 'toomuchauthor';   // 서랍 이름 (북내면은 letters:v1)
const K_MSGS = `${NS}:cheers:v1`;     // 응원 목록 (최신이 앞)
const K_HIDE = `${NS}:hidden:v1`;     // 숨긴 응원 id 모음
const K_CLAP = `${NS}:claps:v1`;      // 박수 수
const LIMIT = 1000;

// 저장소가 아직 연결되지 않았을 때를 위한 임시 메모리
const mem = globalThis.__cheers || (globalThis.__cheers = { msgs: [], hidden: new Set(), claps: 0 });
const rate = globalThis.__cheersRate || (globalThis.__cheersRate = new Map());
const BANNED = ['시발', '씨발', '병신', '새끼', '좆', '개새'];

const ipOf = r => (r.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'local';
function limited(k, max) { const now = Date.now(); const a = (rate.get(k) || []).filter(t => now - t < 60000); a.push(now); rate.set(k, a); return a.length > max; }
function today() {
  const d = new Date(Date.now() + 9 * 3600 * 1000); // 한국 시간
  return `${d.getUTCMonth() + 1}. ${d.getUTCDate()}.`;
}
const parse = v => (typeof v === 'string' ? JSON.parse(v) : v);

async function readAll() {
  if (!redis) return { msgs: mem.msgs.slice(), hidden: new Set(mem.hidden), claps: mem.claps };
  const [rows, hid, claps] = await Promise.all([
    redis.lrange(K_MSGS, 0, LIMIT - 1), redis.smembers(K_HIDE), redis.get(K_CLAP)
  ]);
  return { msgs: rows.map(parse), hidden: new Set(hid || []), claps: +claps || 0 };
}
// 화면이 기대하는 모양: { claps, msgs:[{t,n,d,row,hidden}] }
function shape(all, admin) {
  const msgs = all.msgs
    .map(m => ({ t: m.t, n: m.n, d: m.d, row: m.id, hidden: all.hidden.has(m.id), ...(admin ? { at: m.at } : {}) }))
    .filter(m => admin || !m.hidden);
  return { claps: all.claps, msgs: admin ? msgs : msgs.slice(0, 200), persistent: !!redis };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const q = { ...(req.query || {}) };
  if (req.method === 'POST') Object.assign(q, typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}));
  const action = String(q.action || 'get');
  const isAdmin = !!process.env.ADMIN_TOKEN && q.key === process.env.ADMIN_TOKEN;

  try {
    // ---- 공개 ----
    if (action === 'get') return res.status(200).json(shape(await readAll(), false));

    if (action === 'clap') {
      if (limited('c' + ipOf(req), 30)) return res.status(200).json(shape(await readAll(), false));
      const n = Math.max(1, Math.min(50, parseInt(q.n, 10) || 1));
      if (redis) await redis.incrby(K_CLAP, n); else mem.claps += n;
      return res.status(200).json(shape(await readAll(), false));
    }

    if (action === 'msg') {
      if (limited('m' + ipOf(req), 5)) return res.status(429).json({ error: '잠시 후 다시 남겨 주세요.' });
      const t = String(q.t || '').trim().replace(/\s+/g, ' ').slice(0, 60);
      const n = String(q.name || '').trim().slice(0, 10);
      if (!t) return res.status(400).json({ error: '한 줄만 적어 주세요.' });
      if (BANNED.some(w => (t + n).includes(w))) return res.status(400).json({ error: '게시할 수 없는 표현이 있어요.' });
      const m = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t, n, d: today(), at: new Date().toISOString() };
      if (redis) { await redis.lpush(K_MSGS, JSON.stringify(m)); await redis.ltrim(K_MSGS, 0, LIMIT - 1); }
      else { mem.msgs.unshift(m); mem.msgs.length = Math.min(mem.msgs.length, LIMIT); }
      return res.status(200).json(shape(await readAll(), false));
    }

    // ---- 관리자 ----
    if (['admin_list', 'hide', 'unhide', 'delete', 'reset_claps'].includes(action)) {
      if (!process.env.ADMIN_TOKEN) return res.status(200).json({ error: 'ADMIN_TOKEN이 설정되지 않았어요.' });
      if (!isAdmin) return res.status(200).json({ error: '비밀번호가 맞지 않아요' });
      const id = String(q.row || '');
      if (action === 'hide' && id) { if (redis) await redis.sadd(K_HIDE, id); else mem.hidden.add(id); }
      if (action === 'unhide' && id) { if (redis) await redis.srem(K_HIDE, id); else mem.hidden.delete(id); }
      if (action === 'delete' && id) {
        if (redis) {
          const rows = await redis.lrange(K_MSGS, 0, LIMIT - 1);
          const hit = rows.find(r => parse(r).id === id);
          if (hit) await redis.lrem(K_MSGS, 1, typeof hit === 'string' ? hit : JSON.stringify(hit));
          await redis.srem(K_HIDE, id);
        } else { mem.msgs = mem.msgs.filter(m => m.id !== id); mem.hidden.delete(id); }
      }
      if (action === 'reset_claps') { if (redis) await redis.set(K_CLAP, 0); else mem.claps = 0; }
      return res.status(200).json(shape(await readAll(), true));
    }

    return res.status(400).json({ error: 'unknown action' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '서버 오류가 났어요.' });
  }
}
