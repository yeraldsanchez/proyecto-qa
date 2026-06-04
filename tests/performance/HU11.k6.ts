import http from 'k6/http';
import { sleep, check } from 'k6';
import { Options } from 'k6/options';

const BASE_URL       = __ENV.BASE_URL       ?? 'http://localhost:9080';
const ADMIN_EMAIL    = __ENV.ADMIN_EMAIL    ?? 'admin@sistema.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD ?? '12345678';
const JSON_HDR       = { 'Content-Type': 'application/json' };

export const options: Options = {
  vus: 50,
  duration: '30s',

  thresholds: {
    'http_req_duration':                     ['p(95)<=1500'],
    'checks{scenario:reporte_valido}':       ['rate>=0.95'],
    'checks{scenario:reporte_invalido}':     ['rate>=0.95'],
  },
};

export function setup() {
  const runId = `${Date.now()}`;

  const loginRes = http.post(
    `${BASE_URL}/answer/api/v1/user/login/email`,
    JSON.stringify({ e_mail: ADMIN_EMAIL, pass: ADMIN_PASSWORD }),
    { headers: JSON_HDR }
  );

  const token = JSON.parse(loginRes.body as string)?.data?.access_token;
  const headers = { ...JSON_HDR, Authorization: `Bearer ${token}` };

  const questionIds: string[] = [];

  for (let i = 1; i <= 100; i++) {
    const questionRes = http.post(
      `${BASE_URL}/answer/api/v1/question`,
      JSON.stringify({
        title: `Pregunta rendimiento HU11 ${runId} num${i}`,
        content: `Contenido de prueba para reporte de contenido HU11 numero ${i}`,
        tags: [{ display_name: 'Docker', original_text: 'Docker', slug_name: '' }],
      }),
      { headers }
    );

    if (questionRes.status === 200) {
      const id = JSON.parse(questionRes.body as string)?.data?.id;
      if (id) questionIds.push(id);
    }
  }

  return { token, questionIds };
}

export default function (data: { token: string; questionIds: string[] }) {
  const questionId = data.questionIds[Math.floor(Math.random() * data.questionIds.length)];
  const headers = { ...JSON_HDR, Authorization: `Bearer ${data.token}` };
  const caso = Math.floor(Math.random() * 2);

  if (caso === 0) {
    const response = http.post(
      `${BASE_URL}/answer/api/v1/report`,
      JSON.stringify({
        object_id: questionId,
        report_type: 1,
        content: 'spam',
      }),
      { headers, responseCallback: http.expectedStatuses(200) }
    );

    check(response, {
      'reporte registrado (200)': (r) => r.status === 200,
    }, { scenario: 'reporte_valido' });

  } else {
    const response = http.post(
      `${BASE_URL}/answer/api/v1/report`,
      JSON.stringify({
        object_id: questionId,
      }),
      { headers, responseCallback: http.expectedStatuses(400) }
    );

    check(response, {
      'reporte rechazado (400)': (r) => r.status === 400,
    }, { scenario: 'reporte_invalido' });
  }

  sleep(1);
}