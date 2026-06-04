import { test, expect } from '@playwright/test';

import {
  clickAcceptAnswer,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  createQuestion,
  createAnswer,
  createVerifiedUser,
  loginByApi,
  loginViaUi,
  waitForQuestionTitle,
} from '../shared/apache-answer';

test.describe('HU06 - Aceptacion de respuestas', () => {
  test('CP-HU06-01 - Aceptar una respuesta valida como solucion', async ({ page, request }) => {
    const authorToken = await loginByApi(request);
    const answerer = await createVerifiedUser(request, 'hu06_answerer');
    const title = `HU06 aceptar respuesta docker ${crypto.randomUUID()}`;
    const questionId = await createQuestion(request, authorToken, title);
    await createAnswer(request, answerer.token, questionId);

    await loginViaUi(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto(`/questions/${questionId}`);
    await waitForQuestionTitle(page, title);
    await clickAcceptAnswer(page);

    await expect(page.locator('#root')).toContainText(/Aceptada|Best answer|Accepted/i);
  });

  test('CP-HU06-02 - Intento de aceptar respuesta por usuario no autor', async ({ page, request }) => {
    const authorToken = await loginByApi(request);
    const answerer = await createVerifiedUser(request, 'hu06_answerer_no');
    const otherUser = await createVerifiedUser(request, 'hu06_other');
    const title = `HU06 no autor docker ${crypto.randomUUID()}`;
    const questionId = await createQuestion(request, authorToken, title);
    await createAnswer(request, answerer.token, questionId);

    await loginViaUi(page, otherUser.email);
    await page.goto(`/questions/${questionId}`);
    await waitForQuestionTitle(page, title);

    await expect(page.getByRole('button', { name: /aceptar respuesta|accept answer|accept/i })).toHaveCount(0);
  });
});
