import { test, expect } from '@playwright/test';

test('login then add item', async ({ page }) => {
  await page.goto('/login.html');

  // Login with demo credentials
  await page.fill('#username', 'admin');
  await page.fill('#password', '123456');
  await page.click('button.login-btn');

  // redirected to index
  await expect(page.locator('#mainApp')).toBeVisible();
  await expect(page.locator('#welcomeUser')).toContainText('Bem-vindo, admin');

  // Add a sample item
  await page.fill('#itemName', 'Arroz');
  await page.fill('#itemPrice', '10');
  await page.fill('#itemQuantity', '2');
  await page.selectOption('#itemCategory', 'padaria');
  await page.click('button.btn-primary');

  await expect(page.locator('.list-item')).toHaveCount(1);
  await expect(page.locator('.item-name')).toContainText('Arroz');
});


