import { test, expect } from '@playwright/test';

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? 'admin@sistema.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '12345678';

test.describe('Publicación de una nueva pregunta', () => {

    let access_token: string;

    test.beforeEach(async ({ request }) => {
        const response = await request.post('/answer/api/v1/user/login/email', {
            data: { e_mail: ADMIN_EMAIL, pass: ADMIN_PASSWORD },
        });
        access_token = (await response.json()).data.access_token;
    });

    test.only('Publicar pregunta vía API con contenido menor a 6 caracteres', async ({ request }) => {
        const response = await request.post('/answer/api/v1/question', {
            headers: { Authorization: `Bearer ${access_token}` },
            data: {
                content: 'Hola',
                tags: [{ display_name: 'Docker', original_text: 'Docker', slug_name: '' }],
                title: '¿Cómo instalar Docker en Ubuntu?',
            },
        });
        expect(response.status()).toBe(422);
    });

});
