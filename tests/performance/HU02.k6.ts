import http from 'k6/http';
import { sleep, check } from 'k6';
import { Options } from 'k6/options';

export const options: Options = {
  vus: 100,
  duration: '30s',

  thresholds: {
    'http_req_duration':              ['avg<=1000'],
    'checks{scenario:login_valido}':  ['rate>=0.95'],
    'checks{scenario:login_invalido}': ['rate>=0.95'],
  },
};

const BASE_URL     = 'http://localhost:9080/answer/api/v1';
const PASS_VALIDA  = 'Segura123';
const PASS_INVALIDA = 'WrongPass99';

export function setup() {
  const users: { email: string; pass: string }[] = [];

  for (let i = 1; i <= 50; i++) {
    const email = `existing${i}@test.com`;

    const res = http.post(
      `${BASE_URL}/user/register/email`,
      JSON.stringify({ e_mail: email, name: `Existing${i}`, pass: PASS_VALIDA }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res.status === 200 || res.status === 400) {
      users.push({ email, pass: PASS_VALIDA });
    }
  }

  return { users };
}

// ── Prueba principal ──────────────────────────────────────────────────────────
export default function (data: { users: { email: string; pass: string }[] }) {
  const url = `${BASE_URL}/user/login/email`;

  // Elige aleatoriamente uno de los 3 casos de prueba
  const caso = Math.floor(Math.random() * 3);
  //   0 → login válido → espera 200
  //   1 → email que no existe → espera 400
  //   2 → contraseña incorrecta → espera 400

  if (caso === 0) {
    // ── Escenario LOGIN VÁLIDO → esperamos 200 ────────────────────────────────
    const user = data.users[Math.floor(Math.random() * data.users.length)];

    const response = http.post(url, JSON.stringify({ e_mail: user.email, pass: user.pass }), {
      headers:          { 'Content-Type': 'application/json' },
      responseCallback: http.expectedStatuses(200),
    });

    check(response, {
      'login exitoso (200)': (r) => r.status === 200,
    }, { scenario: 'login_valido' });

  } else {
    // ── Escenario LOGIN INVÁLIDO → esperamos 400 ──────────────────────────────
    const payload = caso === 1
      // Email que nunca fue registrado
      ? JSON.stringify({ e_mail: 'noexiste@fake.com', pass: PASS_VALIDA })
      // Usuario real pero con contraseña incorrecta
      : JSON.stringify({
          e_mail: data.users[Math.floor(Math.random() * data.users.length)].email,
          pass:   PASS_INVALIDA,
        });

    const response = http.post(url, payload, {
      headers:          { 'Content-Type': 'application/json' },
      responseCallback: http.expectedStatuses(400),
    });

    check(response, {
      'login rechazado (400)': (r) => r.status === 400,
    }, { scenario: 'login_invalido' });
  }

  sleep(1);
}
