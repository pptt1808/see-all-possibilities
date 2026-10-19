import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("career-experience-hrbp-v5"));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: /进入体验/ }).nth(1).click();

  const expectedStages = [
    ["异常信号", ".hr-intake-layout"],
    ["事实研判", ".hr-evidence-board"],
    ["面谈设计", ".hr-plan-frame"],
  ];

  for (const [label, selector] of expectedStages) {
    if (!(await page.getByRole("button", { name: new RegExp(label) }).first().evaluate((node) => !node.classList.contains("locked")))) {
      throw new Error(`${label} should be unlocked`);
    }
    if ((await page.locator(selector).count()) !== 1) throw new Error(`${label} missing ${selector}`);
    const next = page.locator(".hr-primary-action").last();
    await next.click();
  }

  for (let index = 0; index < 4; index += 1) {
    await page.getByRole("button", { name: /说出这句话/ }).click();
    await page.waitForTimeout(850);
  }
  await page.getByRole("button", { name: /结束面谈并整理记录/ }).click();

  if ((await page.locator(".hr-analysis-grid > article").count()) !== 4) throw new Error("missing post-conversation analysis");
  await page.getByRole("button", { name: /把研判转成组织行动/ }).click();
  if ((await page.locator(".hr-action-table > article").count()) !== 4) throw new Error("missing organisation actions");
  await page.getByRole("button", { name: /生成工作交付包/ }).click();
  if ((await page.locator(".hr-deliverable-grid > article").count()) !== 3) throw new Error("missing work deliverables");

  const finalText = await page.locator(".hr-final-page").innerText();
  for (const expected of ["面谈纪要", "主管沟通摘要", "行动跟踪表", "模糊判断变得可验证"]) {
    if (!finalText.includes(expected)) throw new Error(`final package missing: ${expected}`);
  }
  if (/得分|评分|信任值|需要加强/.test(finalText)) throw new Error("final package contains game-like evaluation");
} finally {
  await browser.close();
}
