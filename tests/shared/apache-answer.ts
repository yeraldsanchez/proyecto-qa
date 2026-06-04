import type { APIRequestContext, Page } from '@playwright/test';

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@sistema.com';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '12345678';
export const TEST_PASSWORD = 'Segura123';

type AuthHeaders = { Authorization: string };
type TestUser = { email: string; password: string; displayName: string; token: string };

function auth(token: string): AuthHeaders {
  return { Authorization: `Bearer ${token}` };
}

function uniqueId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

async function jsonBody(response: { json: () => Promise<unknown> }): Promise<any> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function requireOk(response: { ok: () => boolean; status: () => number }, action: string): Promise<void> {
  if (!response.ok()) {
    throw new Error(`${action} fallo con HTTP ${response.status()}`);
  }
}

async function requireDataId(response: { json: () => Promise<unknown> }, action: string): Promise<string> {
  const body = await jsonBody(response);
  const id = body?.data?.id ?? body?.data?.info?.id ?? body?.data?.question_id ?? body?.data?.answer_id;
  if (!id) {
    throw new Error(`${action} no retorno id utilizable`);
  }
  return String(id);
}

export async function loginByApi(
  request: APIRequestContext,
  email = ADMIN_EMAIL,
  password = ADMIN_PASSWORD,
): Promise<string> {
  const response = await request.post('/answer/api/v1/user/login/email', {
    data: { e_mail: email, pass: password },
  });
  await requireOk(response, `login API ${email}`);

  const body = await jsonBody(response);
  const token = body?.data?.access_token;
  if (!token) {
    throw new Error(`login API ${email} no retorno access_token`);
  }
  return String(token);
}

export async function createVerifiedUser(request: APIRequestContext, prefix: string): Promise<TestUser> {
  const adminToken = await loginByApi(request);
  const displayName = uniqueId(prefix).slice(0, 30);
  const email = `${displayName}@test.com`;

  const response = await request.post('/answer/admin/api/user', {
    headers: auth(adminToken),
    data: { display_name: displayName, email, password: TEST_PASSWORD },
  });
  await requireOk(response, `crear usuario ${email}`);

  const token = await loginByApi(request, email, TEST_PASSWORD);
  return { email, password: TEST_PASSWORD, displayName, token };
}

export async function loginViaUi(page: Page, email: string, password = TEST_PASSWORD): Promise<void> {
  await page.goto('/users/login', { waitUntil: 'domcontentloaded' });
  await page.getByRole('textbox', { name: /Correo electr.nico|Email/i }).fill(email);
  await page.getByRole('textbox', { name: /Contrase.a|Password/i }).fill(password);
  await page.getByRole('button', { name: /Acceder|Login|Sign in/i }).click();
  await page.waitForLoadState('networkidle');
  await dismissModalIfPresent(page);
}

export async function dismissModalIfPresent(page: Page): Promise<void> {
  const closeButton = page.getByRole('button', { name: /Cerrar|Close/i }).first();
  if (await closeButton.isVisible({ timeout: 800 }).catch(() => false)) {
    await closeButton.click();
  }
}

export async function waitForQuestionTitle(page: Page, title: string): Promise<void> {
  await page.locator('#root').getByText(title).first().waitFor({ timeout: 15000 });
}

export async function createQuestion(
  request: APIRequestContext,
  token: string,
  title: string,
  content = 'Contenido suficiente para ejecutar el caso automatizado del plan de pruebas.',
): Promise<string> {
  const response = await request.post('/answer/api/v1/question', {
    headers: auth(token),
    data: {
      title,
      content,
      tags: [{ display_name: 'Docker', original_text: 'Docker', slug_name: 'docker' }],
    },
  });
  await requireOk(response, `crear pregunta ${title}`);
  return requireDataId(response, `crear pregunta ${title}`);
}

export async function createAnswer(
  request: APIRequestContext,
  token: string,
  questionId: string,
  content = 'Respuesta valida de prueba con contenido suficiente para el caso automatizado.',
): Promise<string> {
  const response = await request.post('/answer/api/v1/answer', {
    headers: auth(token),
    data: { question_id: questionId, content },
  });
  await requireOk(response, `crear respuesta para pregunta ${questionId}`);

  const body = await jsonBody(response);
  const directId = body?.data?.id ?? body?.data?.info?.id ?? body?.data?.answer_id;
  if (directId) {
    return String(directId);
  }

  const pageResponse = await request.get(
    `/answer/api/v1/answer/page?question_id=${questionId}&order=default&page=1&page_size=20`,
  );
  await requireOk(pageResponse, `listar respuestas de pregunta ${questionId}`);
  const pageBody = await jsonBody(pageResponse);
  const list = pageBody?.data?.list ?? [];
  const answer = Array.isArray(list)
    ? list.find((item) => {
        const value = item?.content ?? item?.html ?? item?.original_text ?? '';
        return typeof value === 'string' && value.includes(content);
      })
    : undefined;
  const id = answer?.id ?? list?.[0]?.id;
  if (!id) {
    throw new Error(`no se pudo resolver answer_id para pregunta ${questionId}`);
  }
  return String(id);
}

export async function createComment(
  request: APIRequestContext,
  token: string,
  objectId: string,
  text: string,
  replyCommentId?: string,
): Promise<string> {
  const data: { object_id: string; original_text: string; reply_comment_id?: string } = {
    object_id: objectId,
    original_text: text,
  };
  if (replyCommentId) {
    data.reply_comment_id = replyCommentId;
  }

  const response = await request.post('/answer/api/v1/comment', {
    headers: auth(token),
    data,
  });
  await requireOk(response, `crear comentario en objeto ${objectId}`);
  return requireDataId(response, `crear comentario en objeto ${objectId}`).catch(() => objectId);
}

export async function clickFirstVisible(locators: Array<ReturnType<Page['locator']>>): Promise<void> {
  for (const locator of locators) {
    const first = locator.first();
    if (await first.isVisible({ timeout: 5000 }).catch(() => false)) {
      await first.click();
      return;
    }
  }
  throw new Error('no se encontro un control visible para la accion solicitada');
}

export async function clickVote(page: Page, direction: 'up' | 'down'): Promise<void> {
  const upLocators = [
    page.locator('button[title="Es útil y claro"], button[title="Es útil"]'),
    page.getByRole('button', { name: /voto positivo|vote up|upvote|like/i }),
    page.locator('button[aria-label*="up" i], button[title*="up" i], button[aria-label*="positivo" i], button[title*="positivo" i]'),
    page.locator('[class*="vote" i] button').nth(0),
    page.locator('.question-item button, .question-detail button, article button').nth(0),
  ];
  const downLocators = [
    page.locator('button[title="Es poco claro o no es útil"], button[title="No es útil"]'),
    page.getByRole('button', { name: /voto negativo|vote down|downvote|dislike/i }),
    page.locator('button[aria-label*="down" i], button[title*="down" i], button[aria-label*="negativo" i], button[title*="negativo" i]'),
    page.locator('[class*="vote" i] button').nth(1),
    page.locator('.question-item button, .question-detail button, article button').nth(1),
  ];

  await clickFirstVisible(direction === 'up' ? upLocators : downLocators);
}

export async function clickAnswerVote(page: Page, direction: 'up' | 'down'): Promise<void> {
  await clickFirstVisible([
    direction === 'up'
      ? page.locator('button[title="Es útil"]').first()
      : page.locator('button[title="No es útil"]').first(),
  ]);
}

export async function clickAcceptAnswer(page: Page): Promise<void> {
  await clickFirstVisible([
    page.getByRole('button', { name: /Aceptar|aceptar respuesta|accept answer|accept/i }),
    page.locator('.answer-item button[aria-label*="accept" i], .answer-item button[title*="accept" i]'),
    page.locator('.answer-item button[aria-label*="acept" i], .answer-item button[title*="acept" i]'),
    page.locator('.answer-item button').first(),
  ]);
}

export async function openCommentEditor(page: Page): Promise<void> {
  await clickFirstVisible([
    page.locator('button:has-text("Añadir comentario"), button:has-text("Add comment")').first(),
    page.getByRole('button', { name: /A.adir comentario|Add comment/i }),
    page.getByText(/A.adir comentario|Add comment/i),
    page.locator('button[aria-label*="comment" i], button[title*="comment" i]'),
  ]);
}

export async function fillLastTextbox(page: Page, text: string): Promise<void> {
  const textbox = page.getByRole('textbox').last();
  if (await textbox.isVisible({ timeout: 1500 }).catch(() => false)) {
    await textbox.fill(text);
    return;
  }

  const editable = page.locator('textarea, [contenteditable="true"], .cm-content').last();
  await editable.click();
  await page.keyboard.type(text);
}

export async function fillCommentInput(page: Page, text: string): Promise<void> {
  const input = page.locator('textarea.resize-none, textarea.form-control-sm').first();
  if (await input.isVisible({ timeout: 1500 }).catch(() => false)) {
    await input.fill(text);
    return;
  }

  await fillLastTextbox(page, text);
}

export async function submitComment(page: Page): Promise<void> {
  await clickFirstVisible([
    page.locator('button.btn-primary:has-text("Añadir comentario"), button.btn-primary:has-text("Add comment")').first(),
    page.locator('button.btn-primary:has-text("Responder"), button.btn-primary:has-text("Reply")').first(),
    page.locator('button[type="submit"]').first(),
  ]);
}

export async function clickReplyToComment(page: Page): Promise<void> {
  await clickFirstVisible([
    page.getByRole('button', { name: /Responder|Reply/i }).last(),
    page.getByText(/Responder|Reply/i).last(),
  ]);
}

export async function searchFromHeader(page: Page, query: string): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const input = page.locator('input[type="search"], input[placeholder*="Buscar" i], input[placeholder*="Search" i]').first();
  if (await input.isVisible({ timeout: 1500 }).catch(() => false)) {
    await input.fill(query);
    await input.press('Enter');
    await page.waitForLoadState('networkidle');
    return;
  }
  await page.goto(`/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded' });
}
