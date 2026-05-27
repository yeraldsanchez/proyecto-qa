import http from 'k6/http';
import { sleep, check } from 'k6';
import { Options } from 'k6/options';

// ── Correos que YA existen en la BD (esperamos 400 al intentar registrarlos) ──
const EXISTING_EMAILS: string[] = [
  'existing1@test.com',
  'existing2@test.com',
  'existing3@test.com',
];

// Probabilidad de que un VU use un correo duplicado (0.0 – 1.0)
// 0.2 = 20% solicitudes duplicadas, 80% registros nuevos
const DUPLICATE_RATE = 0.2;

export const options: Options = {
  vus: 100,
  duration: '30s',

  thresholds: {
    // Tiempo de respuesta: aquí se valida el rendimiento (no en check())
    'http_req_duration':                  ['avg<=3000'],
    'checks{scenario:nuevo}':             ['rate>=0.95'],
    'checks{scenario:duplicado}':         ['rate>=0.95'],
  },
};

export function setup(): { runId: string } {
  return { runId: `${Date.now()}` };
}

// ── Prueba principal ──────────────────────────────────────────────────────────
export default function (data: { runId: string }) {
  const url = 'http://localhost:9080/answer/api/v1/user/register/email';

  const isDuplicate = Math.random() < DUPLICATE_RATE;

  if (isDuplicate) {
    // ── Escenario DUPLICADO: correo ya existente → esperamos 400 ──────────────
    const email = EXISTING_EMAILS[Math.floor(Math.random() * EXISTING_EMAILS.length)];

    const payload = JSON.stringify({
      e_mail: email,
      name:   'usuario_duplicado',
      pass:   'Segura123',
    });

    const response = http.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      responseCallback: http.expectedStatuses(400),
    });

    check(response, {
      'duplicado rechazado (400)': (r) => r.status === 400,
    }, { scenario: 'duplicado' });

  } else {
    // ── Escenario NUEVO: correo único garantizado → esperamos 200 ─────────────
    const email = `perf_${data.runId}_vu${__VU}_i${__ITER}@test.com`;

    const payload = JSON.stringify({
      e_mail: email,
      name:   `perf_user_vu${__VU}_i${__ITER}`,
      pass:   'Segura123',
    });

    const response = http.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      responseCallback: http.expectedStatuses(200),
    });

    check(response, {
      'registro exitoso (200)': (r) => r.status === 200,
    }, { scenario: 'nuevo' });
  }

  sleep(1);
}
