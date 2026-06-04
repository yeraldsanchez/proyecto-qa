import { test, expect } from '@playwright/test';

import {
  createQuestion,
  loginByApi,
  searchFromHeader,
} from '../shared/apache-answer';

test.describe('HU07 - Busqueda y filtrado', () => {
  test('CP-HU07-01 - Busqueda de preguntas con texto valido', async ({ page, request }) => {
    const authorToken = await loginByApi(request);
    const title = `HU07 docker busqueda ${crypto.randomUUID()}`;
    await createQuestion(request, authorToken, title);

    await searchFromHeader(page, 'docker');

    await expect(page.locator('#root')).toContainText(/docker/i);
  });

  test('CP-HU07-02 - Filtrado de preguntas por etiqueta existente', async ({ page, request }) => {
    const authorToken = await loginByApi(request);
    await createQuestion(request, authorToken, `HU07 filtro etiqueta docker ${crypto.randomUUID()}`);

    await page.goto('/tags/docker', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#root')).toContainText(/docker/i);
  });
});
