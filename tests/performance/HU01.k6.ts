import http from 'k6/http';
import { sleep, check } from 'k6';
import { Options } from 'k6/options';

export const options: Options = {
  vus: 100,        // 100 usuarios virtuales concurrentes
  duration: '30s', // durante 30 segundos

  thresholds: {
    // Tiempo de respuesta promedio debe ser ≤ 3000ms
    http_req_duration: ['avg<=3000'],
    // Tasa de errores ≤ 5%
    // NOTA: http_req_failed solo contará como fallo los status NO esperados
    // (los que no estén en responseCallback). Con el responseCallback definido
    // abajo, 200 y 400 son válidos y NO cuentan como fallo aquí.
    http_req_failed: ['rate<0.05'],
  },
};

// ── Prueba principal ──────────────────────────────────────────────────────────
export default function () {
  const url = 'http://localhost:9080/answer/api/v1/user/register/email';

  const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 1e9)}_vu${__VU}_iter${__ITER}`;

  const payload = JSON.stringify({
    e_mail: `testuser_${uniqueSuffix}@gmail.com`,
    name:   `usuario_${uniqueSuffix}`,
    pass:   'Segura123',
  });

  const response = http.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },

    // Le dice a k6 que 200 Y 400 son respuestas válidas (no fallos).
    // Cualquier otro código (500, 503, etc.) sí contará como http_req_failed.
    responseCallback: http.expectedStatuses(200, 400),
  });

  check(response, {
    'status valido (200 o 400)':      (r) => r.status === 200 || r.status === 400,
    'tiempo de respuesta <= 3000ms':   (r) => r.timings.duration <= 3000,
  });

  sleep(1);
}
