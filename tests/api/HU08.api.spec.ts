import { test, expect } from '@playwright/test';

import {
  createQuestion,
  createVerifiedUser,
  loginByApi,
} from '../shared/apache-answer';

test.describe('HU08 - API de comentarios', () => {
  test('CP-HU08-05 - Publicar comentario via API con texto demasiado largo', async ({ request }) => {
    const user = await createVerifiedUser(request, 'hu08_api_comment_user');
    const authorToken = await loginByApi(request);
    const questionId = await createQuestion(request, authorToken, `HU08 API comentario largo docker ${crypto.randomUUID()}`);

    const response = await request.post('/answer/api/v1/comment', {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { object_id: questionId, original_text: 'a'.repeat(601) },
    });

    expect(response.status()).toBe(422);
  });
});
