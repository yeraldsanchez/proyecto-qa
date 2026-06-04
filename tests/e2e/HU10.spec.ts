import { test, expect, Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@sistema.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '12345678';
const ADMIN_NAME = process.env.ADMIN_NAME ?? 'admin';

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

async function openProfileSettings(page: Page) {
    await page.goto('/users/settings/profile');
    await page.waitForLoadState('domcontentloaded');
    await closeModalIfVisible(page);
}

test.describe('Edición del perfil de usuario', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ page }) => {
        await loginIfNeeded(page);
        await openProfileSettings(page);
    });

    test.afterEach(async ({ request }) => {
        const login = await request.post('/answer/api/v1/user/login/email', {
            data: { e_mail: ADMIN_EMAIL, pass: ADMIN_PASSWORD },
        });
        const token = (await login.json()).data.access_token;
        await request.put('/answer/api/v1/user/info', {
            headers: { Authorization: `Bearer ${token}` },
            data: {
                display_name: ADMIN_NAME,
                username: 'admin',
                bio: '',
                website: '',
                location: '',
            },
        });
    });

    test('Editar perfil con datos válidos', async ({ page }) => {
        const publicNameInput = page.getByLabel('Nombre público');

        await publicNameInput.fill('Admin QA');
        await page.getByLabel('Sobre mí (opcional)').fill('Estudiante de ingeniería realizando pruebas automatizadas.');
        await page.getByLabel('Sitio Web (opcional)').fill('https://example.com');
        await page.getByLabel('Ubicación (opcional)').fill('Costa Rica');
        await page.getByRole('button', { name: 'Guardar' }).click();

        await expect(publicNameInput).toHaveValue('Admin QA');
    });

    test('Validar nombre público vacío', async ({ page }) => {
        const publicNameInput = page.getByLabel('Nombre público');

        await publicNameInput.fill('');
        await page.getByRole('button', { name: 'Guardar' }).click();

        await expect(publicNameInput).toHaveValue('');
    });

    test('Validar sitio web con formato inválido', async ({ page }) => {
        const websiteInput = page.getByLabel('Sitio Web (opcional)');

        await websiteInput.fill('miweb.com');
        await page.getByRole('button', { name: 'Guardar' }).click();

        await expect(websiteInput).toHaveValue('miweb.com');
    });
});