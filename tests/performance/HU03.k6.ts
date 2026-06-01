import http from 'k6/http';
import { sleep, check } from 'k6';
import { Options } from 'k6/options';

const BASE_URL       = __ENV.BASE_URL       ?? 'http://localhost:9080';
const ADMIN_EMAIL    = __ENV.ADMIN_EMAIL    ?? 'admin@sistema.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD ?? '12345678';

export const options: Options = {
  vus: 100,
  duration: '30s',

  thresholds: {
    'http_req_duration':                  ['avg<=2500'],
    'checks{scenario:pregunta_valida}':   ['rate>=0.95'],
    'checks{scenario:pregunta_invalida}': ['rate>=0.95'],
  },
};

export function setup() {
  const runId = `${Date.now()}`;

  const adminLogin = http.post(
    `${BASE_URL}/answer/api/v1/user/login/email`,
    JSON.stringify({ e_mail: ADMIN_EMAIL, pass: ADMIN_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  const adminToken = JSON.parse(adminLogin.body as string)?.data?.access_token;
  const adminHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };

  const tokens: string[] = [];

  for (let i = 1; i <= 50; i++) {
    const email = `perf_hu03_${i}@test.com`;

    // La admin API crea el usuario ya verificado, sin necesitar confirmación por correo
    http.post(
      `${BASE_URL}/answer/admin/api/user`,
      JSON.stringify({ display_name: `PerfHU03-${i}`, email, password: 'Segura123' }),
      { headers: adminHeaders }
    );

    const loginRes = http.post(
      `${BASE_URL}/answer/api/v1/user/login/email`,
      JSON.stringify({ e_mail: email, pass: 'Segura123' }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (loginRes.status === 200) {
      const token = JSON.parse(loginRes.body as string)?.data?.access_token;
      if (token) tokens.push(token);
    }
  }

  if (tokens.length === 0) tokens.push(adminToken);

  return { tokens, runId };
}

export default function (data: { tokens: string[]; runId: string }) {
  const token   = data.tokens[Math.floor(Math.random() * data.tokens.length)];
  const url     = `${BASE_URL}/answer/api/v1/question`;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const caso    = Math.floor(Math.random() * 2);

  if (caso === 0) {
    const response = http.post(
      url,
      JSON.stringify({
        content: `Contenido de prueba de rendimiento generado por vu${__VU} iteracion${__ITER} run${data.runId}`,
        tags: [{ display_name: 'Docker', original_text: 'Docker', slug_name: '' }],
        title: `Pregunta rendimiento ${data.runId} vu${__VU} i${__ITER}`,
      }),
      { headers, responseCallback: http.expectedStatuses(200) }
    );

    check(response, {
      'pregunta publicada (200)': (r) => r.status === 200,
    }, { scenario: 'pregunta_valida' });

  } else {
    const response = http.post(
      url,
      JSON.stringify({
        content: 'Hola',
        tags: [{ display_name: 'Docker', original_text: 'Docker', slug_name: '' }],
        title: `Pregunta invalida ${data.runId} vu${__VU} i${__ITER}`,
      }),
      { headers, responseCallback: http.expectedStatuses(400) }
    );

    check(response, {
      'contenido rechazado (400)': (r) => r.status === 400,
    }, { scenario: 'pregunta_invalida' });
  }

  sleep(1);
}
