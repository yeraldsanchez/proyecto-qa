import http from 'k6/http';
import { sleep, check } from 'k6';
import { Options } from 'k6/options';

const BASE_URL = __ENV.BASE_URL ?? 'http://localhost:9080';

// Probabilidad de que un VU use un correo duplicado (0.0 – 1.0)
const DUPLICATE_RATE = 0.2;

export const options: Options = {
  vus: 100,
  duration: '30s',

  thresholds: {
    'http_req_duration':          ['avg<=3000'],
    'checks{scenario:nuevo}':     ['rate>=0.95'],
    'checks{scenario:duplicado}': ['rate>=0.95'],
  },
};

export function setup(): { runId: string; existingEmails: string[] } {
  const runId = `${Date.now()}`;
  const url = `${BASE_URL}/answer/api/v1/user/register/email`;
  const existingEmails: string[] = [];

  // Registrar correos que se usarán como duplicados en la prueba
  for (let i = 1; i <= 3; i++) {
    const email = `perf_dup_${runId}_${i}@test.com`;
    const res = http.post(
      url,
      JSON.stringify({ e_mail: email, name: `perf_dup_${runId}_${i}`, pass: 'Segura123' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (res.status === 200 || res.status === 400) {
      existingEmails.push(email);
    }
  }

  return { runId, existingEmails };
}

export default function (data: { runId: string; existingEmails: string[] }) {
  const url = `${BASE_URL}/answer/api/v1/user/register/email`;
  const isDuplicate = Math.random() < DUPLICATE_RATE;

  if (isDuplicate) {
    // ── Escenario DUPLICADO: correo ya existente → esperamos 400 ──────────────
    const email = data.existingEmails[Math.floor(Math.random() * data.existingEmails.length)];

    const response = http.post(
      url,
      JSON.stringify({ e_mail: email, name: 'usuario_duplicado', pass: 'Segura123' }),
      { headers: { 'Content-Type': 'application/json' }, responseCallback: http.expectedStatuses(400) }
    );

    check(response, {
      'duplicado rechazado (400)': (r) => r.status === 400,
    }, { scenario: 'duplicado' });

  } else {
    // ── Escenario NUEVO: correo único garantizado → esperamos 200 ─────────────
    const email = `perf_${data.runId}_vu${__VU}_i${__ITER}@test.com`;

    const response = http.post(
      url,
      JSON.stringify({ e_mail: email, name: `perf_user_vu${__VU}_i${__ITER}`, pass: 'Segura123' }),
      { headers: { 'Content-Type': 'application/json' }, responseCallback: http.expectedStatuses(200) }
    );

    check(response, {
      'registro exitoso (200)': (r) => r.status === 200,
    }, { scenario: 'nuevo' });
  }

  sleep(1);
}
