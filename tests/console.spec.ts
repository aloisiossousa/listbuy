import { test, expect } from '@playwright/test';

test('sem erros no console ao abrir o app', async ({ page }) => {
  const messages: string[] = [];
  page.on('console', (msg) => {
    if (['error'].includes(msg.type())) messages.push(`[${msg.type()}] ${msg.text()}`);
  });
  const pageErrors: any[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await page.goto('/login.html');
  await page.fill('#username', 'admin');
  await page.fill('#password', '123456');
  await page.click('button.login-btn');

  await expect(page.locator('#mainApp')).toBeVisible();

  expect(messages, `Erros no console: \n${messages.join('\n')}`).toHaveLength(0);
  expect(pageErrors, `Exceções na página: \n${pageErrors.map(e=>String(e)).join('\n')}`).toHaveLength(0);
});


