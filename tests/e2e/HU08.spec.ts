import { test, expect } from '@playwright/test';

import {
  clickReplyToComment,
  createComment,
  createQuestion,
  createVerifiedUser,
  fillCommentInput,
  fillLastTextbox,
  loginByApi,
  loginViaUi,
  openCommentEditor,
  submitComment,
  waitForQuestionTitle,
} from '../shared/apache-answer';

test.describe('HU08 - Comentarios', () => {
  test('CP-HU08-01 - Publicacion exitosa de comentario valido', async ({ page, request }) => {
    const user = await createVerifiedUser(request, 'hu08_comment_user');
    const authorToken = await loginByApi(request);
    const title = `HU08 comentar docker ${crypto.randomUUID()}`;
    const questionId = await createQuestion(request, authorToken, title);

    await loginViaUi(page, user.email);
    await page.goto(`/questions/${questionId}`);
    await waitForQuestionTitle(page, title);
    await openCommentEditor(page);
    await fillCommentInput(page, 'Buen aporte.');
    const commentResponse = page.waitForResponse((response) =>
      response.url().includes('/answer/api/v1/comment') && response.request().method() === 'POST',
    );
    await submitComment(page);

    expect((await commentResponse).status()).toBe(200);
  });

  test('CP-HU08-02 - Publicacion de comentario demasiado corto', async ({ page, request }) => {
    const user = await createVerifiedUser(request, 'hu08_short_user');
    const authorToken = await loginByApi(request);
    const title = `HU08 comentario corto docker ${crypto.randomUUID()}`;
    const questionId = await createQuestion(request, authorToken, title);

    await loginViaUi(page, user.email);
    await page.goto(`/questions/${questionId}`);
    await waitForQuestionTitle(page, title);
    await openCommentEditor(page);
    await fillCommentInput(page, 'a');
    await submitComment(page);

    await expect(page.locator('#root')).toContainText(/campo requerido|required|longitud|mínimo|minimo|minimum/i);
  });

  test('CP-HU08-03 - Respuesta a comentario existente desde la interfaz', async ({ page, request }) => {
    const user = await createVerifiedUser(request, 'hu08_reply_user');
    const authorToken = await loginByApi(request);
    const title = `HU08 responder comentario docker ${crypto.randomUUID()}`;
    const questionId = await createQuestion(request, authorToken, title);
    await createComment(request, authorToken, questionId, 'Comentario base para responder.');

    await loginViaUi(page, user.email);
    await page.goto(`/questions/${questionId}`);
    await waitForQuestionTitle(page, title);
    await clickReplyToComment(page);
    await fillCommentInput(page, 'Gracias por la aclaracion.');
    const commentResponse = page.waitForResponse((response) =>
      response.url().includes('/answer/api/v1/comment') && response.request().method() === 'POST',
    );
    await submitComment(page);

    expect((await commentResponse).status()).toBe(200);
  });

  test('CP-HU08-04 - Intento de publicar comentario sin iniciar sesion', async ({ page, request }) => {
    const authorToken = await loginByApi(request);
    const title = `HU08 comentario invitado docker ${crypto.randomUUID()}`;
    const questionId = await createQuestion(request, authorToken, title);

    await page.goto(`/questions/${questionId}`);
    await waitForQuestionTitle(page, title);
    await openCommentEditor(page).catch(() => undefined);

    await expect(page.locator('#root')).toContainText(/Inicia sesi.n para continuar|Acceder|Login/i);
  });
});
