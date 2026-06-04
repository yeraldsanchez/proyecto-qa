import http from 'k6/http';
import { sleep, check } from 'k6';
import { Options } from 'k6/options';

const BASE_URL = __ENV.BASE_URL ?? 'http://localhost:9080';
const JSON_HDR = { 'Content-Type': 'application/json' };

export const options: Options = {
  vus: 50,
  duration: '30s',

  thresholds: {
    'http_req_duration':                       ['p(95)<=2000'],
    'checks{scenario:recuperacion_valida}':    ['rate>=0.95'],
  },
};

export function setup() {
  const runId = `${Date.now()}`;

  const emails: string[] = [
    'admin@sistema.com',
    `recuperacion_${runId}_1@test.com`,
    `recuperacion_${runId}_2@test.com`,
    `recuperacion_${runId}_3@test.com`,
    `recuperacion_${runId}_4@test.com`,
  ];

  return { emails };
}

export default function (data: { emails: string[] }) {
  const email = data.emails[Math.floor(Math.random() * data.emails.length)];

  const response = http.post(
    `${BASE_URL}/answer/api/v1/user/password/reset`,
    JSON.stringify({ e_mail: email }),
    { headers: JSON_HDR, responseCallback: http.expectedStatuses(200) }
  );

  check(response, {
    'solicitud recuperacion procesada (200)': (r) => r.status === 200,
  }, { scenario: 'recuperacion_valida' });

  sleep(1);
}