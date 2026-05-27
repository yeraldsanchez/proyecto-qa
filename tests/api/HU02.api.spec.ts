import { test, expect } from '@playwright/test';
test.describe('Inicio de sesión', () => {
    test('Login vía API con credenciales válidas', async ({ request }) => {
        const response = await request.post('/answer/api/v1/user/login/email', {
            data: {
                e_mail: 'admin@sistema.com',
                pass: '12345678',
            },
        });
        // Verificar código HTTP
        expect(response.status()).toBe(200);

        // Verificar que el body contiene el token de acceso
        const body = await response.json();
        // Asegurarnos de que la estructura esperada exista y que access_token sea una cadena no vacía
        expect(body).toBeTruthy();
        expect(body.data).toBeTruthy();
        expect(body.data?.access_token).toBeTruthy();
        expect(typeof body.data?.access_token).toBe('string');
    });

    test('Login vía API con correo no registrado', async ({ request }) => {
        const response = await request.post('/answer/api/v1/user/login/email', {
            data: {
                e_mail: 'test@gmail.com',
                pass: 'Segura123',
            },
        });

        expect(response.status()).toBe(401);
    });


});
