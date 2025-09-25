import { test, expect } from '@playwright/test';

test.describe('Responsividade', () => {
  test('login empilha colunas no mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto('/login.html');
    const card = page.locator('.login-card');
    await expect(card).toBeVisible();
    const hero = page.locator('.login-hero');
    const form = page.locator('.login-form');
    const heroBox = await hero.boundingBox();
    const formBox = await form.boundingBox();
    expect(heroBox && formBox).toBeTruthy();
    // No mobile, form deve estar abaixo do hero (maior Y)
    if (heroBox && formBox) {
      expect(formBox.y).toBeGreaterThan(heroBox.y);
    }
  });

  test('app empilha sidebar abaixo no mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto('/login.html');
    await page.fill('#username', 'admin');
    await page.fill('#password', '123456');
    await page.click('button.login-btn');
    await expect(page.locator('#mainApp')).toBeVisible();
    const main = page.locator('.main-panel');
    const side = page.locator('.sidebar');
    const mainBox = await main.boundingBox();
    const sideBox = await side.boundingBox();
    expect(mainBox && sideBox).toBeTruthy();
    if (mainBox && sideBox) {
      expect(sideBox.y).toBeGreaterThan(mainBox.y);
    }
  });
});


