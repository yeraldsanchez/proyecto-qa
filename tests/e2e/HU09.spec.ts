import { test, expect, Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@sistema.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '12345678';

async function closeModalIfVisible(page: Page) {
    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible().catch(() => false)) {
        const closeBtn = dialog.getByRole('button', {
            name: /cerrar|close|ok|está bien|aceptar|continuar|entendido/i,
        });
        if (await closeBtn.isVisible().catch(() => false)) {
            await closeBtn.click();
        } else {
            await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(500);
    }
}

async function loginIfNeeded(page: Page) {
    await page.goto('/users/login');

    const emailInput = page.getByRole('textbox', { name: 'Correo electrónico' });

    if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill(ADMIN_EMAIL);
        await page.getByRole('textbox', { name: 'Contraseña' }).fill(ADMIN_PASSWORD);
        await page.getByRole('button', { name: 'Acceder' }).click();
        await page.waitForURL(url => !url.toString().includes('/users/login'), { timeout: 15000 });
        await page.waitForLoadState('domcontentloaded');
    }

    await closeModalIfVisible(page);
}

function saveButton(page: Page) {
    return page.locator('button, a').filter({
        hasText: /guardar|save|bookmark|follow|seguir/i,
    }).first();
}

function savedButton(page: Page) {
    return page.locator('button, a').filter({
        hasText: /guardado|saved|bookmarked|following|siguiendo/i,
    }).first();
}

test.describe('Guardado de publicaciones', () => {
    test.describe.configure({ mode: 'serial' });

    let questionId: string;

    test.beforeAll(async ({ request }) => {
        const login = await request.post('/answer/api/v1/user/login/email', {
            data: { e_mail: ADMIN_EMAIL, pass: ADMIN_PASSWORD },
        });
        const token = (await login.json()).data.access_token;

        const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
        const q = await request.post('/answer/api/v1/question', {
            headers: { Authorization: `Bearer ${token}` },
            data: {
                title: `Pregunta HU09 E2E ${uuid}`,
                content: 'Contenido suficiente para probar el guardado de publicaciones.',
                tags: [{ display_name: 'Docker', original_text: 'Docker', slug_name: '' }],
            },
        });
        questionId = (await q.json()).data.id;
    });

    test.beforeEach(async ({ page }) => {
        await loginIfNeeded(page);
    });

    test('Guardar publicación existente con usuario autenticado', async ({ page }) => {
        await page.goto(`/questions/${questionId}`);
        await page.waitForLoadState('networkidle');

        if (await savedButton(page).isVisible().catch(() => false)) {
            await savedButton(page).click();
            await page.waitForTimeout(1000);
        }

        await saveButton(page).click();

        await expect(savedButton(page)).toBeVisible();
    });

    test('Remover publicación previamente guardada', async ({ page }) => {
        await page.goto(`/questions/${questionId}`);
        await page.waitForLoadState('networkidle');

        if (await saveButton(page).isVisible().catch(() => false)) {
            await saveButton(page).click();
            await page.waitForTimeout(1000);
        }

        await savedButton(page).click();

        await expect(saveButton(page)).toBeVisible();
    });
});
