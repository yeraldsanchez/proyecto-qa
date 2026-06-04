import { test, expect } from '@playwright/test';

import {
  createQuestion,
  createVerifiedUser,
  loginByApi,
} from '../shared/apache-answer';

test.describe('HU07 - API de busqueda', () => {
  test('CP-HU07-03 - Busqueda via API con texto y orden validos', async ({ request }) => {
    const adminToken = await loginByApi(request);
    await createQuestion(request, adminToken, `HU07 API docker busqueda ${crypto.randomUUID()}`);

    const response = await request.get('/answer/api/v1/search?q=docker&order=relevance&page=1', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status()).toBe(200);
  });

  test('CP-HU07-04 - Busqueda via API con orden no permitido', async ({ request }) => {
    const adminToken = await loginByApi(request);

    const response = await request.get('/answer/api/v1/search?q=docker&order=popular&page=1', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status()).toBe(422);
  });
});
