import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

for (const port of [5173, 5174]) {
  await page.goto(`http://localhost:${port}/`);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `/tmp/hall-${port}.png` });

  // PM scene
  await page.getByText('产品经理').first().click().catch(e => console.log(port, 'pm click fail', e.message));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `/tmp/pm-${port}.png` });
  const pmKeys = await page.locator('.keyboard-key').count();
  const pmKb = await page.locator('.keyboard').boundingBox().catch(() => null);
  console.log(port, 'PM keys:', pmKeys, 'kb box:', JSON.stringify(pmKb));
  await page.goBack();
  await page.waitForTimeout(800);

  // HR scene
  await page.goto(`http://localhost:${port}/`);
  await page.getByText('HRBP').first().click().catch(e => console.log(port, 'hr click fail', e.message));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `/tmp/hr-${port}.png` });
  const hrKeys = await page.locator('.keyboard-key').count();
  const hrKb = await page.locator('.keyboard').boundingBox().catch(() => null);
  const hrKeyVisible = await page.locator('.keyboard-key').first().isVisible().catch(() => false);
  console.log(port, 'HR keys:', hrKeys, 'visible:', hrKeyVisible, 'kb box:', JSON.stringify(hrKb));
}
await browser.close();
