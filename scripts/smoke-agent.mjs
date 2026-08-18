/**
 * Agent MVP duman testi.
 *
 * satici@talpio.com ile giriş yapar, sohbet açar, "Bugün ne yapacağım?" sorar.
 * Çalışan API + seed demo hesapları gerekir.
 */
const BASE = process.env.API_URL ?? 'http://localhost:3000/api/v1';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'Demo1234!';

let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function call(method, path, { body, token } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Platform': 'WEB',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await response.json().catch(() => null);
  return { status: response.status, json };
}

function abort(message, payload) {
  console.error(`\n${message}`);
  if (payload) console.error(JSON.stringify(payload).slice(0, 500));
  process.exit(1);
}

console.log(`Agent duman testi — ${BASE}\n`);

const login = await call('POST', '/auth/login', {
  body: { email: 'satici@talpio.com', password: DEMO_PASSWORD },
});
if (login.status !== 200) abort('Satıcı girişi başarısız.', login.json);
const token = login.json?.data?.tokens?.accessToken;
if (!token) abort('Erişim jetonu yok.', login.json);
check('satıcı girişi 200', login.status === 200);

const thread = await call('POST', '/agent/threads', {
  token,
  body: { title: 'Smoke' },
});
check('thread 201/200', thread.status === 201 || thread.status === 200, `status=${thread.status}`);
const threadId = thread.json?.data?.id;
if (!threadId) abort('Thread kimliği yok.', thread.json);

const chat = await call('POST', `/agent/threads/${threadId}/messages`, {
  token,
  body: { content: 'Bugün ne yapacağım?' },
});
check('mesaj 200/201', chat.status === 200 || chat.status === 201, `status=${chat.status}`);
check('başarı zarfı', chat.json?.success === true);
const messages = chat.json?.data?.messages ?? [];
const assistant = [...messages].reverse().find((item) => item.role === 'ASSISTANT');
check('assistant yanıtı var', typeof assistant?.content === 'string' && assistant.content.length > 0);
check(
  'tool/veri yolu (halüsinasyon yok veya boş kayıt)',
  Boolean(assistant?.content),
  assistant?.content?.slice(0, 120),
);

console.log(`\nSonuç: ${passed} geçti, ${failed} kaldı`);
process.exit(failed > 0 ? 1 : 0);
