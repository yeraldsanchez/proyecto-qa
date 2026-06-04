import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';

const BASE_URL = __ENV.BASE_URL ?? 'http://localhost:9080';
const ADMIN_URL = `${BASE_URL}/answer/admin/api`;
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL ?? 'admin@sistema.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD ?? '12345678';
const PASSWORD = 'Segura123';
const JSON_HDR = { 'Content-Type': 'application/json' };

type SetupData = { tokens: string[]; questionIds: string[] };

export const options: Options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<=800'],
    'checks{scenario:voto_concurrente}': ['rate>=0.95'],
  },
};

function tokenFromLogin(email: string, password: string): string {
  const response = http.post(
    `${BASE_URL}/answer/api/v1/user/login/email`,
    JSON.stringify({ e_mail: email, pass: password }),
    { headers: JSON_HDR },
  );
  return JSON.parse(response.body as string)?.data?.access_token ?? '';
}

export function setup(): SetupData {
  const runId = `${Date.now()}`;
  const adminToken = tokenFromLogin(ADMIN_EMAIL, ADMIN_PASSWORD);
  const adminHeaders = { ...JSON_HDR, Authorization: `Bearer ${adminToken}` };
  const tokens: string[] = [];
  const questionIds: string[] = [];

  for (let i = 1; i <= 50; i++) {
    const email = `perf_hu05_${runId}_${i}@test.com`;
    http.post(
      `${ADMIN_URL}/user`,
      JSON.stringify({ display_name: `PerfHU05${i}`, email, password: PASSWORD }),
      { headers: adminHeaders },
    );

    const token = tokenFromLogin(email, PASSWORD);
    if (token) {
      tokens.push(token);
    }

    const question = http.post(
      `${BASE_URL}/answer/api/v1/question`,
      JSON.stringify({
        title: `HU05 rendimiento voto docker ${runId} ${i}`,
        content: `Contenido de prueba para voto concurrente HU05 ${runId} ${i}`,
        tags: [{ display_name: 'Docker', original_text: 'Docker', slug_name: 'docker' }],
      }),
      { headers: adminHeaders },
    );

    const questionId = JSON.parse(question.body as string)?.data?.id;
    if (questionId) {
      questionIds.push(questionId);
    }
  }

  return { tokens, questionIds };
}

export default function (data: SetupData) {
  const token = data.tokens[(__VU - 1) % data.tokens.length];
  const objectId = data.questionIds[(__VU + __ITER) % data.questionIds.length];
  const direction = __ITER % 2 === 0 ? 'up' : 'down';

  const response = http.post(
    `${BASE_URL}/answer/api/v1/vote/${direction}`,
    JSON.stringify({ object_id: objectId }),
    { headers: { ...JSON_HDR, Authorization: `Bearer ${token}` }, responseCallback: http.expectedStatuses(200) },
  );

  check(response, {
    'voto registrado (200)': (r) => r.status === 200,
  }, { scenario: 'voto_concurrente' });

  sleep(1);
}
