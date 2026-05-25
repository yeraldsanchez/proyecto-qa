import { test, expect } from '@playwright/test';
test.describe('Registro de nuevo usuario', () => {
  test.only('Registro vía API con nombre de usuario ya en uso', async ({ request }) => {
    const response = await request.post('/answer/api/v1/user/register/email', {
      data: {
        e_mail: 'nuevo@gmail.com',
        name: 'usuario123',
        pass: 'Segura123',
      },
    });

    expect(response.status()).toBe(409);
  });
});
