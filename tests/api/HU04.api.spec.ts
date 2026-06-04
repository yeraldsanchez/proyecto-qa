import { test, expect } from '@playwright/test';

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? 'admin@sistema.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '12345678';
const PASSWORD = 'Segura123';

test.describe('Publicación de respuestas', () => {

    let access_token: string;
    let questionId: string;

    test.beforeAll(async ({ request }) => {
        const adminLogin = await request.post('/answer/api/v1/user/login/email', {
            data: { e_mail: ADMIN_EMAIL, pass: ADMIN_PASSWORD },
        });
        const adminToken = (await adminLogin.json()).data.access_token;
        const adminHeaders = { Authorization: `Bearer ${adminToken}` };

        // La admin API crea el usuario ya verificado, sin necesitar confirmación por correo
        const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
        const email = `hu04_api_${uuid}@test.com`;
        await request.post('/answer/admin/api/user', {
            headers: adminHeaders,
            data: { display_name: `HU04Api${uuid}`, email, password: PASSWORD },
        });
        const loginRes = await request.post('/answer/api/v1/user/login/email', {
            data: { e_mail: email, pass: PASSWORD },
        });
        access_token = (await loginRes.json()).data.access_token;

        const qRes = await request.post('/answer/api/v1/question', {
            headers: adminHeaders,
            data: {
                title: `Pregunta N${uuid} cerrada para prueba HU04 api`,
                content: 'Contenido suficiente para la prueba de respuesta en pregunta cerrada',
                tags: [{ display_name: 'Docker', original_text: 'Docker', slug_name: 'docker' }],
            },
        });
        questionId = (await qRes.json()).data.id;

        await request.put('/answer/admin/api/question/status', {
            headers: adminHeaders,
            data: { question_id: questionId, status: 'closed' },
        });
    });

    test('Publicar respuesta vía API a una pregunta cerrada.', async ({ request }) => {
        const response = await request.post('/answer/api/v1/answer', {
            headers: { Authorization: `Bearer ${access_token}` },
            data: { question_id: questionId, content: 'Hay que hacer ciertas cosas' },
        });
        expect(response.status()).toBe(403);
    });

});
