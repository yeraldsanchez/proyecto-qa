import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';

const BASE_URL = __ENV.BASE_URL ?? 'http://localhost:9080';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL ?? 'admin@sistema.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD ?? '12345678';
const JSON_HDR = { 'Content-Type': 'application/json' };

export const options: Options = {
  vus: 100,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<=800'],
    'checks{scenario:busqueda_filtrado}': ['rate>=0.95'],
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

export function setup() {
  const runId = `${Date.now()}`;
  const adminToken = tokenFromLogin(ADMIN_EMAIL, ADMIN_PASSWORD);
  const headers = { ...JSON_HDR, Authorization: `Bearer ${adminToken}` };

  for (let i = 1; i <= 10; i++) {
    http.post(
      `${BASE_URL}/answer/api/v1/question`,
      JSON.stringify({
        title: `HU07 rendimiento busqueda docker ${runId} ${i}`,
        content: `Pregunta indexada para busqueda y filtrado HU07 docker ${runId} ${i}`,
        tags: [{ display_name: 'Docker', original_text: 'Docker', slug_name: 'docker' }],
      }),
      { headers },
    );
  }
}

export default function () {
  const url = __ITER % 2 === 0
    ? `${BASE_URL}/answer/api/v1/search?q=docker&order=relevance&page=1`
    : `${BASE_URL}/tags/docker`;

  const response = http.get(url, { responseCallback: http.expectedStatuses(200) });

  check(response, {
    'busqueda o filtro responde (200)': (r) => r.status === 200,
  }, { scenario: 'busqueda_filtrado' });

  sleep(1);
}
