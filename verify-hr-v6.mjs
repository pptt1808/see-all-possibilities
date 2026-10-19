import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("career-experience-hrbp-v6"));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: /进入体验/ }).nth(1).click();
  await page.waitForTimeout(300);
  if (!(await page.getByRole("button", { name: /主动联系知情人/ }).count())) {
    throw new Error(`failed to enter HR: ${(await page.locator("body").innerText()).slice(0, 1200)}`);
  }
  await page.getByRole("button", { name: /主动联系知情人/ }).click();

  const nextFromResearch = page.getByRole("button", { name: /用采集的信息设计面谈/ });
  if (await nextFromResearch.isEnabled()) throw new Error("research should require active participation");

  for (const [person, prompt] of [
    ["Alex", "这类面谈最容易犯什么错？"],
    ["周店长", "你说的“状态不对”，具体发生过什么？"],
    ["婷婷", "最近调班实际是怎么发生的？"],
  ]) {
    await page.getByRole("button", { name: new RegExp(person) }).click();
    await page.getByRole("button", { name: prompt, exact: true }).click();
    await page.waitForTimeout(650);
  }
  await page.getByRole("button", { name: /婷婷/ }).click();
  await page.getByRole("button", { name: "这是小林个人的问题，还是大家都有类似感受？", exact: true }).click();
  await page.waitForTimeout(650);
  if (!(await page.locator(".hr-contact-message.contact").last().innerText()).includes("不只小林")) throw new Error("contact prompts should reveal distinct information");
  if (!(await nextFromResearch.isEnabled())) throw new Error("research should unlock after mentor plus two colleagues");
  if (await page.locator(".hr-field-notes > div").count() < 3) throw new Error("research findings were not generated from conversations");
  await page.screenshot({ path: "tmp/hr-v6-research.png", fullPage: false });
  await nextFromResearch.click();

  const prepNext = page.getByRole("button", { name: /带着自己的方案进入面谈/ });
  if (await prepNext.isEnabled()) throw new Error("blank prep should not be accepted");
  const prepTextareas = page.locator(".hr-plan-canvas textarea");
  await prepTextareas.nth(0).fill("理解小林近期工作变化背后的真实经历，并确认可以同步的范围和后续安排。");
  await prepTextareas.nth(1).fill("我注意到最近工作数据和临时调班有所变化，想先听听这段时间对你来说发生了什么。");
  const questionInput = page.locator(".hr-question-add input");
  await questionInput.fill("最近一次临时调班是怎么发生的，对你有什么影响？");
  await page.getByRole("button", { name: /添加/ }).click();
  await questionInput.fill("关于去年的储备店长面谈，你现在最希望得到什么？");
  await page.getByRole("button", { name: /添加/ }).click();
  await prepTextareas.nth(2).fill("只同步排班与发展反馈问题，不转述家庭细节，也不承诺晋升结果。");
  await prepTextareas.nth(3).fill("两周后回访，验证排班规则和发展反馈是否真正发生变化。");
  await page.getByRole("button", { name: /发送草案/ }).click();
  if (!(await prepNext.isEnabled())) throw new Error("mentor-approved prep should unlock interview");
  await page.screenshot({ path: "tmp/hr-v6-prep.png", fullPage: false });
  await prepNext.click();

  if (await page.locator(".hr-chat-beats").count()) throw new Error("interview still exposes fixed rounds");
  if (await page.locator(".hr-fixed-dialogue-input").count()) throw new Error("interview still uses fixed script");
  const interviewInputs = [
    "我注意到最近调班和出勤有些变化，这段时间对你来说发生了什么？",
    "能具体说说最近一次临时调班是什么时候，又造成了什么影响吗？",
    "除了排班，去年储备店长面谈后的发展反馈对你有什么影响？",
    "听起来你很失望，你现在最希望公司为你解决什么？",
    "关于今天的信息，你希望我可以向主管同步哪些范围？",
    "我们约两周后回访，届时一起确认排班和反馈是否变化，可以吗？",
  ];
  for (const message of interviewInputs) {
    await page.locator(".hr-chat-composer textarea").fill(message);
    await page.getByRole("button", { name: "发送面谈回应" }).click();
    await page.waitForTimeout(760);
  }
  await page.screenshot({ path: "tmp/hr-v6-interview.png", fullPage: false });
  const finish = page.getByRole("button", { name: /结束面谈并研判/ });
  if (!(await finish.isEnabled())) throw new Error("rich free interview should be finishable");
  if (await page.locator(".hr-chat-msg.from-hr").count() !== interviewInputs.length) throw new Error("free interview did not retain user turns");
  await finish.click();

  const recordTextareas = page.locator(".hr-record-grid textarea");
  await recordTextareas.nth(0).fill("近四周发生多次临时调班，最近一次在前一晚十点通知；储备店长面谈后没有收到正式反馈。");
  await recordTextareas.nth(1).fill("希望排班更可预期，并明确了解发展差距和下一次机会，而不是被持续悬置。");
  await recordTextareas.nth(2).fill("我可以接受没选上，但至少想知道差在哪里。");
  await recordTextareas.nth(3).fill("可同步排班与发展反馈，不转述家庭细节；还需验证规则是否真正执行。");
  await page.getByRole("button", { name: /带着研判推动行动/ }).click();
  await page.screenshot({ path: "tmp/hr-v6-followup.png", fullPage: false });

  const followupTurns = [2, 2, 3];
  for (let phase = 0; phase < followupTurns.length; phase += 1) {
    for (let turn = 0; turn < followupTurns[phase]; turn += 1) {
      await page.locator(".hr-followup-conversation textarea").fill(phase === 0
        ? (turn === 0 ? "我只同步工作议题，不转述私人细节。" : "请明确排班规则、负责人和期限。")
        : phase === 1
          ? (turn === 0 ? "反馈需要说明优势、差距和下一步。" : "请确认负责人、反馈时间和系统留痕。")
          : ["过去两周排班实际有什么变化？", "发展反馈是否清楚和有帮助？", "还有什么没有解决，需要继续观察？"][turn]);
      await page.getByRole("button", { name: "发送跟进消息" }).click();
      await page.waitForTimeout(680);
    }
    await page.locator(".hr-phase-complete").click();
  }
  if (await page.locator(".hr-loop-complete").count() !== 1) throw new Error("employee callback did not close the loop");
  await page.getByRole("button", { name: /生成闭环交付包/ }).click();
  if (await page.locator(".hr-deliverable-grid > article").count() !== 4) throw new Error("final package should include callback record");
  if (!(await page.getByText("员工回访记录").count())) throw new Error("final package missing employee callback");
  await page.screenshot({ path: "tmp/hr-v6-final.png", fullPage: false });

  for (const [name, width, height] of [["desktop", 1440, 900], ["tablet", 1024, 768], ["mobile", 390, 844]]) {
    await page.setViewportSize({ width, height });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (overflow) throw new Error(`horizontal overflow at ${name}`);
  }
} finally {
  await browser.close();
}
