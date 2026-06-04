import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@sistema.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '12345678';

test.describe('Edición del perfil de usuario', () => {

    let access_token: string;

    test.beforeEach(async ({ request }) => {
        const response = await request.post('/answer/api/v1/user/login/email', {
            data: { e_mail: ADMIN_EMAIL, pass: ADMIN_PASSWORD },
        });

        access_token = (await response.json()).data.access_token;
    });

    test('Actualizar perfil vía API con datos válidos', async ({ request }) => {
        const response = await request.put('/answer/api/v1/user/info', {
            headers: { Authorization: `Bearer ${access_token}` },
            data: {
                display_name: 'Luis Ambrón',
                username: 'admin',
                bio: 'Estudiante de ingeniería',
                website: 'https://ejemplo.com',
            },
        });

        expect(response.status()).toBe(200);
    });

    test('Actualizar perfil vía API con URL inválida', async ({ request }) => {
        const response = await request.put('/answer/api/v1/user/info', {
            headers: { Authorization: `Bearer ${access_token}` },
            data: {
                display_name: 'Luis Ambrón',
                username: 'admin',
                bio: 'Estudiante de ingeniería',
                website: 'miweb.com',
            },
        });

        expect(response.status()).toBe(422);
    });

});