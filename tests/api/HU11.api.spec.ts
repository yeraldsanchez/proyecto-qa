import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@sistema.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '12345678';

test.describe('Reporte de contenido inapropiado', () => {

    let access_token: string;
    let questionId: string;

    test.beforeEach(async ({ request }) => {
        const loginRes = await request.post('/answer/api/v1/user/login/email', {
            data: { e_mail: ADMIN_EMAIL, pass: ADMIN_PASSWORD },
        });

        access_token = (await loginRes.json()).data.access_token;

        const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 8);

        const questionRes = await request.post('/answer/api/v1/question', {
            headers: { Authorization: `Bearer ${access_token}` },
            data: {
                title: `Pregunta HU11 API ${uuid}`,
                content: 'Contenido suficiente para probar el reporte de contenido vía API.',
                tags: [{ display_name: 'Docker', original_text: 'Docker', slug_name: '' }],
            },
        });

        questionId = (await questionRes.json()).data.id;
    });

    test('Reportar contenido vía API con motivo válido', async ({ request }) => {
        const response = await request.post('/answer/api/v1/report', {
            headers: { Authorization: `Bearer ${access_token}` },
            data: {
                object_id: questionId,
                report_type: 1,
                content: 'spam',
            },
        });

        expect(response.status()).toBe(200);
    });

    test('Reportar contenido vía API sin motivo válido', async ({ request }) => {
        const response = await request.post('/answer/api/v1/report', {
            headers: { Authorization: `Bearer ${access_token}` },
            data: {
                object_id: questionId,
            },
        });

        expect(response.status()).toBe(422);
    });

});