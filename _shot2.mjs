import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

await page.goto('http://localhost:5173/');
await page.waitForTimeout(1000);

// PM scene: click the card's 进入体验 button
const pmCard = page.locator('.career-card', { hasText: '产品经理' });
await pmCard.getByRole('button', { name: '进入体验' }).click();
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/pm-scene.png', fullPage: true });
const pmKeys = await page.locator('.keyboard-key').count();
console.log('PM keys:', pmKeys);

// back to hall
await page.getByRole('button', { name: /职业大厅/ }).click();
await page.waitForTimeout(800);

// HR scene
const hrCard = page.locator('.career-card', { hasText: 'HRBP' });
await hrCard.getByRole('button', { name: '进入体验' }).click();
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/hr-scene.png', fullPage: true });
const hrKeys = await page.locator('.keyboard-key').count();
const vis = await page.locator('.keyboard-key').first().isVisible().catch(() => 'n/a');
console.log('HR keys:', hrKeys, 'first visible:', vis);

// keyboard region close-up for both
const kb = page.locator('.keyboard');
await kb.screenshot({ path: '/tmp/hr-keyboard.png' }).catch(e => console.log('hr kb shot fail:', e.message));

await browser.close();
