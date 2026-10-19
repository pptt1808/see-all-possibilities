import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem("career-experience-hrbp-v5", JSON.stringify({
      activeApp: "profile",
      currentStage: 5,
    }));
  });
  await page.getByRole("button", { name: /进入体验/ }).nth(1).click();

  if ((await page.getByText("表达灵感").count()) !== 0) throw new Error("profile still contains inspiration UI");
  if ((await page.locator(".hr-evidence-board").count()) !== 1) throw new Error("profile missing evidence workbench");
  if ((await page.locator(".hr-evidence-board > article").count()) !== 6) throw new Error("profile missing evidence rows");
  if ((await page.locator(".hr-chat-page").count()) !== 0) throw new Error("profile should not be another chat page");

  await page.getByRole("button", { name: /组织行动/ }).click();
  if ((await page.getByText("表达灵感").count()) !== 0) throw new Error("follow-up still contains inspiration UI");
  if ((await page.locator(".hr-action-table > article").count()) !== 4) throw new Error("follow-up missing organisation actions");
  if ((await page.locator(".hr-chat-page").count()) !== 0) throw new Error("follow-up should not be another chat page");

  await page.getByRole("button", { name: /面谈设计/ }).click();
  if ((await page.getByText("表达灵感").count()) !== 0) throw new Error("prep still contains inspiration UI");
  if ((await page.locator(".hr-question-route > div").count()) !== 4) throw new Error("prep missing fixed conversation route");
  if ((await page.locator("textarea").count()) !== 0) throw new Error("prep still contains free input");

  await page.getByRole("button", { name: /会后研判/ }).click();
  if ((await page.locator(".hr-analysis-grid > article").count()) !== 4) throw new Error("analysis missing four-part judgement");

  await page.evaluate(() => {
    const body = document.body.innerText;
    if (/好结局|坏结局|信任值|回答评分|需要加强/.test(body)) throw new Error("found deprecated game language");
  });
} finally {
  await browser.close();
}
