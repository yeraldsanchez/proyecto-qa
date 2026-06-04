import { test, expect } from '@playwright/test';

import { createVerifiedUser } from '../shared/apache-answer';

test.describe('HU05 - API de votos', () => {
  test('CP-HU05-03 - Voto via API con contenido vacio', async ({ request }) => {
    const user = await createVerifiedUser(request, 'hu05_api_empty');

    const response = await request.post('/answer/api/v1/vote/up', {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { object_id: '' },
    });

    expect(response.status()).toBe(422);
  });

  test('CP-HU05-04 - Voto via API sobre contenido inexistente', async ({ request }) => {
    const user = await createVerifiedUser(request, 'hu05_api_missing');

    const response = await request.post('/answer/api/v1/vote/up', {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { object_id: 'noexiste999' },
    });

    expect(response.status()).toBe(404);
  });
});
