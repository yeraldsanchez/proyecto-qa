import http from 'k6/http';
import { sleep, check } from 'k6';
import { Options } from 'k6/options';

// ── Configuración del escenario de carga ──────────────────────────────────────
export const options: Options = {
  vus: 100,        // 100 usuarios virtuales concurrentes
  duration: '30s', // durante 30 segundos

  thresholds: {
    // Tiempo de respuesta promedio debe ser ≤ 2000ms
    http_req_duration: ['avg<2000'],
    // Tasa de errores debe ser ≤ 5%
    http_req_failed: ['rate<0.05'],
  },
};

// ── Prueba principal ──────────────────────────────────────────────────────────
export default function () {
  const url = 'http://localhost:9080/answer/api/v1/user/register/email';

  // Genera datos únicos por usuario virtual (__VU) e iteración (__ITER)
  // para evitar errores de "email ya registrado"
  const payload = JSON.stringify({
    e_mail: `testuser_vu${__VU}_iter${__ITER}@gmail.com`,
    name:   `usuario_${__VU}_${__ITER}`,
    pass:   'Segura123',
  });

  const headers = { 'Content-Type': 'application/json' };

  const response = http.post(url, payload, { headers });

  // Verifica que la respuesta sea exitosa
  check(response, {
    'status es 200':              (r) => r.status === 200,
    'tiempo de respuesta <= 2000ms': (r) => r.timings.duration <= 2000,
  });

  sleep(1);
}
