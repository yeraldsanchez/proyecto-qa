import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';

const BASE_URL = __ENV.BASE_URL ?? 'http://localhost:9080';
const ADMIN_URL = `${BASE_URL}/answer/admin/api`;
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL ?? 'admin@sistema.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD ?? '12345678';
const PASSWORD = 'Segura123';
const JSON_HDR = { 'Content-Type': 'application/json' };

type AcceptancePair = { questionId: string; answerId: string };
type SetupData = { authorToken: string; answererToken: string; pairs: AcceptancePair[] };

export const options: Options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<=1200'],
    'checks{scenario:aceptacion_concurrente}': ['rate>=0.95'],
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

function createVerifiedUser(adminToken: string, runId: string, role: string): string {
  const email = `perf_hu06_${role}_${runId}@test.com`;
  http.post(
    `${ADMIN_URL}/user`,
    JSON.stringify({ display_name: `PerfHU06${role}${runId.slice(-4)}`, email, password: PASSWORD }),
    { headers: { ...JSON_HDR, Authorization: `Bearer ${adminToken}` } },
  );
  return tokenFromLogin(email, PASSWORD);
}

function firstAnswerId(questionId: string): string {
  const response = http.get(`${BASE_URL}/answer/api/v1/answer/page?question_id=${questionId}&order=default&page=1&page_size=10`);
  const list = JSON.parse(response.body as string)?.data?.list ?? [];
  return list.length > 0 ? list[0].id : '';
}

export function setup(): SetupData {
  const runId = `${Date.now()}`;
  const adminToken = tokenFromLogin(ADMIN_EMAIL, ADMIN_PASSWORD);
  const authorToken = createVerifiedUser(adminToken, runId, 'author');
  const answererToken = createVerifiedUser(adminToken, runId, 'answerer');
  const pairs: AcceptancePair[] = [];

  for (let i = 1; i <= 100; i++) {
    const question = http.post(
      `${BASE_URL}/answer/api/v1/question`,
      JSON.stringify({
        title: `HU06 rendimiento aceptacion docker ${runId} ${i}`,
        content: `Pregunta abierta para aceptacion concurrente HU06 ${runId} ${i}`,
        tags: [{ display_name: 'Docker', original_text: 'Docker', slug_name: 'docker' }],
      }),
      { headers: { ...JSON_HDR, Authorization: `Bearer ${authorToken}` } },
    );
    const questionId = JSON.parse(question.body as string)?.data?.id;

    http.post(
      `${BASE_URL}/answer/api/v1/answer`,
      JSON.stringify({
        question_id: questionId,
        content: `Respuesta candidata para aceptacion concurrente HU06 ${runId} ${i}`,
      }),
      { headers: { ...JSON_HDR, Authorization: `Bearer ${answererToken}` } },
    );

    const answerId = firstAnswerId(questionId);
    if (questionId && answerId) {
      pairs.push({ questionId, answerId });
    }
  }

  return { authorToken, answererToken, pairs };
}

export default function (data: SetupData) {
  const pair = data.pairs[(__VU + __ITER) % data.pairs.length];
  const response = http.post(
    `${BASE_URL}/answer/api/v1/answer/acceptance`,
    JSON.stringify({ question_id: pair.questionId, answer_id: pair.answerId }),
    { headers: { ...JSON_HDR, Authorization: `Bearer ${data.authorToken}` }, responseCallback: http.expectedStatuses(200) },
  );

  check(response, {
    'respuesta aceptada (200)': (r) => r.status === 200,
  }, { scenario: 'aceptacion_concurrente' });

  sleep(1);
}
