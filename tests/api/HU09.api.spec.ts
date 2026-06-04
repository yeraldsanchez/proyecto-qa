import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@sistema.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '12345678';

test.describe('Guardado de publicaciones', () => {

    let access_token: string;
    let questionId: string;

    test.beforeAll(async ({ request }) => {
        const loginRes = await request.post('/answer/api/v1/user/login/email', {
            data: { e_mail: ADMIN_EMAIL, pass: ADMIN_PASSWORD },
        });

        access_token = (await loginRes.json()).data.access_token;

        const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 8);

        const questionRes = await request.post('/answer/api/v1/question', {
            headers: { Authorization: `Bearer ${access_token}` },
            data: {
                title: `Pregunta HU09 API ${uuid}`,
                content: 'Contenido suficiente para probar el guardado de publicaciones vía API.',
                tags: [{ display_name: 'Docker', original_text: 'Docker', slug_name: '' }],
            },
        });

        questionId = (await questionRes.json()).data.id;
    });

    test('Guardar publicación vía API con datos válidos', async ({ request }) => {
        const response = await request.post('/answer/api/v1/collection/switch', {
            headers: { Authorization: `Bearer ${access_token}` },
            data: {
                object_id: questionId,
                group_id: '0',
                bookmark: true,
            },
        });

        expect(response.status()).toBe(200);
    });

    test('Consultar publicaciones guardadas vía API', async ({ request }) => {
        const response = await request.get('/answer/api/v1/personal/collection/page?page=1&page_size=20', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        expect(response.status()).toBe(200);
    });

});