import { test, expect } from '@playwright/test';

import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  clickAnswerVote,
  loginByApi,
  createAnswer,
  createQuestion,
  createVerifiedUser,
  loginViaUi,
  waitForQuestionTitle,
} from '../shared/apache-answer';

test.describe('HU05 - Votacion de contenido', () => {
  test('CP-HU05-01 - Votacion positiva de contenido existente', async ({ page, request }) => {
    const authorToken = await loginByApi(request);
    const title = `HU05 voto positivo docker ${crypto.randomUUID()}`;
    const questionId = await createQuestion(request, authorToken, title);
    const answerer = await createVerifiedUser(request, 'hu05_up_answerer');
    await createAnswer(request, answerer.token, questionId);

    await loginViaUi(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto(`/questions/${questionId}`);
    await waitForQuestionTitle(page, title);
    const voteResponse = page.waitForResponse((response) =>
      response.url().includes('/answer/api/v1/vote/up') && response.request().method() === 'POST',
    );
    await clickAnswerVote(page, 'up');

    expect((await voteResponse).status()).toBe(200);
  });

  test('CP-HU05-02 - Votacion negativa de contenido existente', async ({ page, request }) => {
    const authorToken = await loginByApi(request);
    const title = `HU05 voto negativo docker ${crypto.randomUUID()}`;
    const questionId = await createQuestion(request, authorToken, title);
    const answerer = await createVerifiedUser(request, 'hu05_down_answerer');
    await createAnswer(request, answerer.token, questionId);

    await loginViaUi(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto(`/questions/${questionId}`);
    await waitForQuestionTitle(page, title);
    const voteResponse = page.waitForResponse((response) =>
      response.url().includes('/answer/api/v1/vote/down') && response.request().method() === 'POST',
    );
    await clickAnswerVote(page, 'down');

    expect((await voteResponse).status()).toBe(200);
  });
});
