import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem("career-experience-hrbp-v5", JSON.stringify({
      activeApp: "interview",
      currentStage: 3,
      interviewBeat: 0,
      interviewMessages: [
        { id: 1, role: "scene", text: "小林坐下后把水杯放在桌边。" },
        { id: 2, role: "employee", text: "主管让我来的。" },
      ],
      // 回归旧存档中的负向结果：新版必须完全忽略它。
      interviewOutcomes: [{ beat: 0, outcomeId: "judge", tier: "bad", trust: -99 }],
      interviewComplete: false,
    }));
  });
  await page.getByRole("button", { name: /进入体验/ }).nth(1).click();

  const expectedTurns = [
    "我看到最近临时调班比较多",
    "能不能讲讲最近的一次",
    "真正让你失望的不只是没选上",
    "我不会逐字转达",
  ];

  for (const expected of expectedTurns) {
    const fixedText = await page.locator(".hr-fixed-dialogue-input p").innerText();
    if (!fixedText.includes(expected)) throw new Error(`missing fixed guided turn: ${expected}`);
    if (await page.locator(".hr-guided-turn-note").count() !== 1) throw new Error("expected in-process guidance");
    await page.getByRole("button", { name: /说出这句话/ }).click();
    await page.waitForTimeout(850);
  }

  const completion = await page.locator(".hr-chat-complete").innerText();
  if (!completion.includes("一次完整的员工面谈已经完成")) throw new Error("expected one complete conversation ending");
  if (/坏结局|保持防御|没有获得足够信息|信任值/.test(await page.locator("body").innerText())) {
    throw new Error("found deprecated game-like outcome language");
  }
} finally {
  await browser.close();
}
