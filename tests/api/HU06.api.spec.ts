import { test, expect } from '@playwright/test';

import {
  createAnswer,
  createQuestion,
  createVerifiedUser,
  loginByApi,
} from '../shared/apache-answer';

test.describe('HU06 - API de aceptacion de respuestas', () => {
  test('CP-HU06-03 - Aceptar respuesta via API con datos validos', async ({ request }) => {
    const authorToken = await loginByApi(request);
    const answerer = await createVerifiedUser(request, 'hu06_api_answerer');
    const questionId = await createQuestion(request, authorToken, `HU06 API aceptar docker ${crypto.randomUUID()}`);
    const answerId = await createAnswer(request, answerer.token, questionId);

    const response = await request.post('/answer/api/v1/answer/acceptance', {
      headers: { Authorization: `Bearer ${authorToken}` },
      data: { question_id: questionId, answer_id: answerId },
    });

    expect(response.status()).toBe(200);
  });

  test('CP-HU06-04 - Aceptar respuesta via API con pregunta invalida', async ({ request }) => {
    const authorToken = await loginByApi(request);
    const answerer = await createVerifiedUser(request, 'hu06_api_invalid_answerer');
    const questionId = await createQuestion(request, authorToken, `HU06 API invalida docker ${crypto.randomUUID()}`);
    const answerId = await createAnswer(request, answerer.token, questionId);

    const response = await request.post('/answer/api/v1/answer/acceptance', {
      headers: { Authorization: `Bearer ${authorToken}` },
      data: { question_id: `${questionId}123456789012345678901234567890`, answer_id: answerId },
    });

    expect(response.status()).toBe(404);
  });
});
