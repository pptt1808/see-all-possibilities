import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const base = "http://localhost:5173/";
await mkdir("tmp", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const key = "career-experience-hrbp-v5";
    const stored = JSON.parse(localStorage.getItem(key) ?? "{}");
    localStorage.setItem(key, JSON.stringify({
      ...stored,
      currentStage: 3,
      activeApp: "interview",
      interviewBeat: 0,
      interviewMessages: [{ id: 1, role: "employee", text: "Test employee message" }],
      interviewOutcomes: [],
      interviewComplete: false,
    }));
  });
  await page.getByRole("button", { name: /进入体验/ }).nth(1).click();

  const emotionCount = await page.locator(".hr-interview-emotion").count();
  if (emotionCount !== 2) throw new Error(`expected two emotion indicators, got ${emotionCount}`);

  const emotionText = await page.locator(".hr-interview-emotion").allTextContents();
  if (emotionText.some((text) => !text.includes("😶‍🌫️") || !text.includes("保持谨慎"))) {
    throw new Error(`expected cautious emoji and label, got ${emotionText.join(" | ")}`);
  }

  const characterEmotionCount = await page.locator(".hr-interview-character-emotion").count();
  if (characterEmotionCount !== 1) throw new Error(`expected character-side emotion indicator, got ${characterEmotionCount}`);

  const tableToken = await page.locator(".hr-interview-mode").evaluate((node) =>
    getComputedStyle(node).getPropertyValue("--hr-table-line").trim(),
  );
  if (!tableToken) throw new Error("expected meeting table layout token");

  const desktopGeometry = await page.evaluate(() => {
    const rect = (selector) => {
      const node = document.querySelector(selector);
      if (!node) throw new Error(`missing ${selector}`);
      const { top, right, bottom, left, width, height } = node.getBoundingClientRect();
      return { top: Math.round(top), right: Math.round(right), bottom: Math.round(bottom), left: Math.round(left), width: Math.round(width), height: Math.round(height) };
    };
    return {
      desk: rect(".hr-interview-mode > .desk"),
      monitor: rect(".hr-interview-mode .monitor-shell"),
      table: rect(".hr-interview-mode .hr-meeting-table"),
      tableSurfaceTop: Math.round(parseFloat(getComputedStyle(document.querySelector(".hr-interview-mode .hr-meeting-table"), "::before").top) + document.querySelector(".hr-interview-mode .hr-meeting-table").getBoundingClientRect().top),
      keyboard: rect(".hr-interview-mode .keyboard"),
      character: rect(".hr-seated-character"),
      dialogue: rect(".hr-face-dialogue"),
    };
  });
  if (desktopGeometry.desk.top < 96 || desktopGeometry.desk.left > 90) {
    throw new Error(`expected lower-left monitor placement, got desk top ${desktopGeometry.desk.top}`);
  }
  if (desktopGeometry.monitor.bottom > desktopGeometry.tableSurfaceTop + 28) {
    throw new Error(`expected monitor above the table surface, got monitor ${desktopGeometry.monitor.bottom} / table surface ${desktopGeometry.tableSurfaceTop}`);
  }
  if (desktopGeometry.keyboard.top < desktopGeometry.tableSurfaceTop - 20 || desktopGeometry.keyboard.top > desktopGeometry.tableSurfaceTop + 150) {
    throw new Error(`expected keyboard on table surface, got keyboard ${desktopGeometry.keyboard.top} / table surface ${desktopGeometry.tableSurfaceTop}`);
  }
  if (desktopGeometry.character.left < desktopGeometry.monitor.right + 90) {
    throw new Error("expected the employee to remain visually separate from the computer");
  }
  for (const [name, width, height] of [["desktop", 1440, 900], ["tablet", 1024, 768], ["mobile", 390, 844]]) {
    await page.setViewportSize({ width, height });
    const viewportCheck = await page.evaluate(() => {
      const box = (selector) => {
        const rect = document.querySelector(selector).getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      };
      return {
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        monitor: box(".hr-interview-mode .monitor-shell"),
        character: box(".hr-seated-character"),
        stage: box(".hr-face-stage"),
        stageStyle: {
          borderWidth: getComputedStyle(document.querySelector(".hr-face-stage")).borderTopWidth,
          borderRadius: getComputedStyle(document.querySelector(".hr-face-stage")).borderRadius,
          shadow: getComputedStyle(document.querySelector(".hr-face-stage")).boxShadow,
        },
        tableLegs: document.querySelectorAll(".hr-table-leg").length,
      };
    });
    if (viewportCheck.overflow) throw new Error(`unexpected horizontal overflow at ${name}`);
    if (viewportCheck.stage.left !== 0 || viewportCheck.stage.top !== 0
      || Math.round(viewportCheck.stage.right) !== width || Math.round(viewportCheck.stage.bottom) !== height
      || viewportCheck.stageStyle.borderWidth !== "0px" || viewportCheck.stageStyle.borderRadius !== "0px"
      || viewportCheck.stageStyle.shadow !== "none") {
      throw new Error(`expected a borderless full-viewport scene at ${name}`);
    }
    if (viewportCheck.tableLegs !== 0) throw new Error(`expected no table legs at ${name}`);
    const overlapWidth = Math.min(viewportCheck.monitor.right, viewportCheck.character.right)
      - Math.max(viewportCheck.monitor.left, viewportCheck.character.left);
    const overlapHeight = Math.min(viewportCheck.monitor.bottom, viewportCheck.character.bottom)
      - Math.max(viewportCheck.monitor.top, viewportCheck.character.top);
    if (overlapWidth > 120 && overlapHeight > 120) {
      throw new Error(`computer obscures too much of the character at ${name}`);
    }
    await page.screenshot({ path: resolve(`tmp/hr-interview-${name}.png`), fullPage: false });
  }
} finally {
  await browser.close();
}
