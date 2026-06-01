import { test, expect } from '@playwright/test';

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? 'admin@sistema.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '12345678';

test.describe('Inicio de sesión', () => {

    test('Login vía API con credenciales válidas', async ({ request }) => {
        const response = await request.post('/answer/api/v1/user/login/email', {
            data: { e_mail: ADMIN_EMAIL, pass: ADMIN_PASSWORD },
        });
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body).toBeTruthy();
        expect(body.data).toBeTruthy();
        expect(body.data?.access_token).toBeTruthy();
        expect(typeof body.data?.access_token).toBe('string');
    });

    test('Login vía API con correo no registrado', async ({ request }) => {
        // Email con UUID para garantizar que nunca existe en el sistema
        const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
        const response = await request.post('/answer/api/v1/user/login/email', {
            data: { e_mail: `noexiste_${uuid}@never.invalid`, pass: 'Segura123' },
        });
        expect(response.status()).toBe(401);
    });

});
