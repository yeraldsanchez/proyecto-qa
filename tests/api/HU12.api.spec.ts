import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@sistema.com';

test.describe('Recuperación de contraseña', () => {

    test('Solicitar recuperación de contraseña vía API con correo registrado', async ({ request }) => {
        const response = await request.post('/answer/api/v1/user/password/reset', {
            data: { e_mail: ADMIN_EMAIL },
        });

        expect(response.status()).toBe(200);
    });

});