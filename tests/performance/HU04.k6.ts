import http from 'k6/http';
import { sleep, check } from 'k6';
import { Options } from 'k6/options';

const BASE_URL       = __ENV.BASE_URL       ?? 'http://localhost:9080';
const ADMIN_URL      = `${BASE_URL}/answer/admin/api`;
const ADMIN_EMAIL    = __ENV.ADMIN_EMAIL    ?? 'admin@sistema.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD ?? '12345678';
const PASSWORD       = 'Segura123';
const JSON_HDR       = { 'Content-Type': 'application/json' };

export const options: Options = {
  vus: 100,
  duration: '30s',

  thresholds: {
    'http_req_duration':                   ['avg<=2000'],
    'checks{scenario:respuesta_valida}':   ['rate>=0.95'],
    'checks{scenario:contenido_invalido}': ['rate>=0.95'],
  },
};

export function setup() {
  const runId = `${Date.now()}`;

  // Login como admin
  const adminLogin = http.post(
    `${BASE_URL}/answer/api/v1/user/login/email`,
    JSON.stringify({ e_mail: ADMIN_EMAIL, pass: ADMIN_PASSWORD }),
    { headers: JSON_HDR }
  );
  const adminToken = JSON.parse(adminLogin.body as string)?.data?.access_token;
  const adminHeaders = { ...JSON_HDR, Authorization: `Bearer ${adminToken}` };

  // ── Crear 100 usuarios ──────────────────────────────────────────────────────
  const tokens: string[] = [];

  for (let i = 1; i <= 100; i++) {
    const email = `perf_hu04_${i}@test.com`;

    http.post(
      `${ADMIN_URL}/user`,
      JSON.stringify({ display_name: `PerfHU04-${i}`, email, password: PASSWORD }),
      { headers: adminHeaders }
    );

    const loginRes = http.post(
      `${BASE_URL}/answer/api/v1/user/login/email`,
      JSON.stringify({ e_mail: email, pass: PASSWORD }),
      { headers: JSON_HDR }
    );

    if (loginRes.status === 200) {
      const token = JSON.parse(loginRes.body as string)?.data?.access_token;
      if (token) tokens.push(token);
    }
  }

  // ── Crear 100 preguntas con admin ──────────────────────────────────────────
  const questionIds: string[] = [];

  for (let i = 1; i <= 100; i++) {
    const res = http.post(
      `${BASE_URL}/answer/api/v1/question`,
      JSON.stringify({
        title: `Pregunta de rendimiento HU04 ${runId} num${i}`,
        content: `Contenido de pregunta de rendimiento número ${i} para prueba HU04 run ${runId}`,
        tags: [{ display_name: 'Docker', original_text: 'Docker', slug_name: '' }],
      }),
      { headers: adminHeaders }
    );

    if (res.status === 200) {
      const id = JSON.parse(res.body as string)?.data?.id;
      if (id) questionIds.push(id);
    }
  }

  return { tokens, questionIds, runId };
}

export default function (data: { tokens: string[]; questionIds: string[]; runId: string }) {
  const token      = data.tokens[Math.floor(Math.random() * data.tokens.length)];
  const questionId = data.questionIds[Math.floor(Math.random() * data.questionIds.length)];
  const url        = `${BASE_URL}/answer/api/v1/answer`;
  const headers    = { ...JSON_HDR, Authorization: `Bearer ${token}` };

  // 0 → contenido válido (>= 6 chars) → espera 200
  // 1 → contenido inválido (< 6 chars) → espera 400
  const caso = Math.floor(Math.random() * 2);

  if (caso === 0) {
    // ── Escenario RESPUESTA VÁLIDA → esperamos 200 ────────────────────────────
    const response = http.post(
      url,
      JSON.stringify({
        question_id: questionId,
        content: `Respuesta de prueba de rendimiento vu${__VU} iteracion${__ITER} run${data.runId}`,
      }),
      { headers, responseCallback: http.expectedStatuses(200) }
    );

    check(response, {
      'respuesta publicada (200)': (r) => r.status === 200,
    }, { scenario: 'respuesta_valida' });

  } else {
    // ── Escenario CONTENIDO INVÁLIDO → esperamos 400 ──────────────────────────
    const response = http.post(
      url,
      JSON.stringify({ question_id: questionId, content: 'Hola' }),
      { headers, responseCallback: http.expectedStatuses(400) }
    );

    check(response, {
      'contenido rechazado (400)': (r) => r.status === 400,
    }, { scenario: 'contenido_invalido' });
  }

  sleep(1);
}
