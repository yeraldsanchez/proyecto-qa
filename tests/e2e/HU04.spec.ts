import { test, expect } from '@playwright/test';

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? 'admin@sistema.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '12345678';
const PASSWORD = 'Segura123';

test.describe('Publicación de respuestas', () => {

    let userEmail: string;
    let questionId: string;

    test.beforeAll(async ({ request }) => {
        // Login como admin para crear la pregunta de prueba
        const login = await request.post('/answer/api/v1/user/login/email', {
            data: { e_mail: ADMIN_EMAIL, pass: ADMIN_PASSWORD },
        });
        const token = (await login.json()).data.access_token;

        const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
        const q = await request.post('/answer/api/v1/question', {
            headers: { Authorization: `Bearer ${token}` },
            data: {
                title: `Pregunta N${uuid} para pruebas HU04 e2e`,
                content: 'Contenido suficiente para la prueba de publicación de respuestas',
                tags: [{ display_name: 'Docker', original_text: 'Docker', slug_name: '' }],
            },
        });
        questionId = (await q.json()).data.id;
    });

    test.beforeEach(async ({ page, request }) => {
        const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
        userEmail = `hu04_${uuid}@test.com`;

        // Login como admin para crear usuario verificado
        const adminLogin = await request.post('/answer/api/v1/user/login/email', {
            data: { e_mail: ADMIN_EMAIL, pass: ADMIN_PASSWORD },
        });
        const adminToken = (await adminLogin.json()).data.access_token;

        await request.post('/answer/admin/api/user', {
            headers: { Authorization: `Bearer ${adminToken}` },
            data: { display_name: `HU04_${uuid}`, email: userEmail, password: PASSWORD },
        });

        // Login en el navegador con el usuario recién creado
        await page.goto('/users/login');
        await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(userEmail);
        await page.getByRole('textbox', { name: 'Contraseña' }).fill(PASSWORD);
        await page.getByRole('button', { name: 'Acceder' }).click();
    });

    test('Publicación exitosa de respuesta con contenido válido en pregunta abierta', async ({ page }) => {
        await page.goto(`/questions/${questionId}`);

        await page.getByRole('textbox').click();
        const editor = page.locator('.cm-content');
        await editor.click();
        await page.keyboard.type('La solución es ejecutar docker-compose up -d en el directorio del proyecto.');
        await page.getByRole('button', { name: 'Publica tu respuesta' }).click();
        await expect(page.getByRole('link', { name: 'Editar mi respuesta existente' })).toBeVisible();
    });

    test('Publicar respuesta con contenido menor a 6 caracteres', async ({ page }) => {
        await page.goto(`/questions/${questionId}`);

        await page.getByRole('textbox').click();
        const editor = page.locator('.cm-content');
        await editor.click();
        await page.keyboard.type('Hola');
        await page.getByRole('button', { name: 'Publica tu respuesta' }).click();
        await expect(page.getByText('el contenido debe tener al menos 6 caracteres.')).toBeVisible();
    });

});
