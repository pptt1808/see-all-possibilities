import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const waitForTimeShift = async () => {
  await page.locator(".hr-time-transition").waitFor({ state: "hidden", timeout: 2500 });
};

const openApp = async (name) => {
  await page.locator(".hr-desktop-column .desktop-icon", { hasText: name }).click();
  await waitForTimeShift();
  await page.waitForTimeout(120);
};

const putDownBoard = async () => {
  await page.locator(".hr-held-board-dismiss").click({ position: { x: 12, y: 12 } });
  await page.locator(".hr-held-board-layer").waitFor({ state: "hidden" });
};

try {
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.setItem("career-experience-hrbp-v7", JSON.stringify({
    activeApp: "mail",
    prepGoal: "这是旧存档里此前填写但不完整的内容",
    prepOpening: "旧开场",
    prepQuestions: [],
    prepBoundary: "",
    prepFollowup: "",
    recordFacts: "旧纪要里不完整的事实",
    recordConcerns: "旧诉求",
    recordQuote: "",
    recordBoundary: "",
  })));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: /进入体验/ }).nth(1).click();

  const softwareNames = ["Mail", "People Chat", "WorkTime", "Talent", "Docs", "Meet", "Tasks", "Drive"];
  for (const name of softwareNames) {
    if (!(await page.locator(".hr-desktop-column .desktop-icon", { hasText: name }).count())) throw new Error(`missing desktop software: ${name}`);
  }
  if (await page.locator(".hr-desktop-column .desktop-icon.locked").count()) throw new Error("office software should not be locked by process stage");
  if (!(await page.locator(".mail-app-shell").count())) throw new Error("HR should begin in a real Mail app");
  if (!(await page.locator(".hr-physical-notes-board").count())) throw new Error("HR desk should include a physical notes board beside the keyboard");
  await page.locator(".hr-physical-notes-board").click();
  await page.locator(".hr-notes-board-window").waitFor({ state: "visible" });
  await page.locator(".hr-board-writing-section textarea").fill("初步心得：先区分主管判断、系统事实和员工体验。");
  await putDownBoard();

  await openApp("Docs");
  const initialPrepTextareas = page.locator(".hr-plan-canvas textarea");
  if (await initialPrepTextareas.count() !== 4) throw new Error("Docs should contain all four draft text areas");
  for (let index = 0; index < 4; index += 1) {
    if (!(await initialPrepTextareas.nth(index).inputValue()).trim()) throw new Error(`Docs draft field ${index + 1} should be prefilled`);
  }
  if ((await initialPrepTextareas.nth(0).inputValue()).includes("旧存档")) throw new Error("legacy partial draft should be replaced by the current preset once");
  if (await page.locator(".hr-created-questions > div").count() < 2) throw new Error("Docs should prefill at least two open questions");
  if (!(await page.getByRole("button", { name: /发送草案/ }).isEnabled())) throw new Error("prefilled Docs draft should be sendable before cross-app verification");
  await openApp("Mail");

  await page.getByRole("button", { name: /请协助看看小林最近的状态/ }).click();
  if (!(await page.locator(".hr-mail-reader-note").count())) throw new Error("manager email should open as the initial signal");
  await page.locator(".hr-physical-notes-board").click();
  await page.locator(".hr-notes-board-window").waitFor({ state: "visible" });
  if (await page.locator(".hr-board-signal-card").count() < 1) throw new Error("reading the manager email should sync a signal to the notes board");
  const cardsBeforeExcerpt = await page.locator(".hr-board-signal-card").count();
  await page.locator(".hr-board-signal-card").first().getByRole("button", { name: "摘录到纸面" }).click();
  if (!(await page.locator(".hr-board-writing-section textarea").inputValue()).includes("[Mail]")) throw new Error("a synced signal should be writable into the personal notes");
  if (await page.locator(".hr-board-signal-card").count() !== cardsBeforeExcerpt - 1) throw new Error("an excerpted signal should disappear from the pending-material list");
  await putDownBoard();
  await page.screenshot({ path: "tmp/hr-v7-mail.png", fullPage: false });

  await openApp("People Chat");
  if (!(await page.locator(".hr-board-teaser").count())) throw new Error("People Chat findings should point to the shared desktop notes board");
  for (const person of ["Alex", "周店长", "婷婷"]) {
    await page.locator(".hr-contact-list > button", { hasText: person }).click();
    if (!(await page.locator(".hr-contact-chat textarea").inputValue()).trim()) throw new Error(`People Chat should prefill the next message for ${person}`);
    if (await page.locator(".hr-contact-prompts").count()) throw new Error("People Chat should not offer branching reply choices");
    await page.getByRole("button", { name: "发送消息" }).click();
    await page.waitForTimeout(650);
  }

  await openApp("WorkTime");
  if (await page.locator(".hr-system-table > article").count() !== 6) throw new Error("WorkTime missing attendance/schedule records");
  await page.getByRole("button", { name: "标记为已核对" }).click();
  await page.screenshot({ path: "tmp/hr-v7-worktime.png", fullPage: false });

  await openApp("Talent");
  if (!(await page.getByText("流程停滞 248 天").count())) throw new Error("Talent missing stalled development process");
  await page.getByRole("button", { name: "标记为已核对" }).click();
  await page.screenshot({ path: "tmp/hr-v7-talent.png", fullPage: false });

  await page.locator(".hr-physical-notes-board").click();
  await page.locator(".hr-notes-board-window").waitFor({ state: "visible" });
  if (await page.locator(".hr-board-signal-card").count() < 5) throw new Error("unexcerpted People Chat, WorkTime and Talent signals should remain on the notes board");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "tmp/hr-v10-notes-board.png", fullPage: false });
  await putDownBoard();

  await openApp("Docs");
  const prepTextareas = page.locator(".hr-plan-canvas textarea");
  for (let index = 0; index < 4; index += 1) {
    if (!(await prepTextareas.nth(index).inputValue()).trim()) throw new Error(`Docs draft field ${index + 1} lost its prefilled content`);
  }
  if (await page.locator(".hr-created-questions > div").count() < 2) throw new Error("Docs open questions lost their prefilled content");
  if (!(await page.getByRole("button", { name: /发送草案/ }).isEnabled())) throw new Error("complete Docs draft should keep the send button enabled");
  await page.getByRole("button", { name: /发送草案/ }).click();
  await page.screenshot({ path: "tmp/hr-v7-docs.png", fullPage: false });

  await openApp("Meet");
  await page.screenshot({ path: "tmp/hr-v7-meet.png", fullPage: false });
  await page.getByRole("button", { name: /进入面谈/ }).click();
  if (!(await page.locator(".hr-live-notes-page").count())) throw new Error("interview computer should use a live notes interface");
  if (await page.locator(".hr-live-note-list article").count() !== 1) throw new Error("live notes should begin with the arrival observation");
  if (await page.locator(".hr-chat-msg").count()) throw new Error("interview computer should not duplicate the conversation as chat bubbles");
  for (let turn = 0; turn < 6; turn += 1) {
    if (!(await page.locator(".hr-chat-composer textarea").inputValue()).trim()) throw new Error(`interview turn ${turn + 1} should be prefilled`);
    if (await page.locator(".hr-idea-chips").count()) throw new Error("interview should not offer branching reply choices");
    await page.getByRole("button", { name: "发送面谈回应" }).click();
    await page.waitForTimeout(740);
    if (await page.locator(".hr-live-note-list article").count() !== turn + 2) throw new Error(`live notes should add entry ${turn + 2} after the employee response`);
    if (turn === 2) await page.screenshot({ path: "tmp/hr-v8-interview-notes.png", fullPage: false });
  }
  await page.getByRole("button", { name: /结束面谈并研判/ }).click();
  if (!(await page.locator(".hr-time-transition").count())) throw new Error("finishing the interview should show a time transition");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "tmp/hr-v9-time-transition.png", fullPage: false });
  await waitForTimeShift();
  if (!(await page.locator(".hr-record-grid").count())) throw new Error("finishing Meet should return to Docs for notes");

  const recordTextareas = page.locator(".hr-record-grid textarea");
  if (await recordTextareas.count() !== 4) throw new Error("post-conversation record should contain four draft fields");
  for (let index = 0; index < 4; index += 1) {
    if (!(await recordTextareas.nth(index).inputValue()).trim()) throw new Error(`post-conversation record field ${index + 1} should be prefilled`);
  }
  if ((await recordTextareas.nth(0).inputValue()).includes("旧纪要")) throw new Error("legacy partial record should be replaced by the current preset once");
  if (!(await page.getByRole("button", { name: /保存纪要/ }).isEnabled())) throw new Error("prefilled post-conversation record should be immediately saveable");
  await page.screenshot({ path: "tmp/hr-v8-record-draft.png", fullPage: false });
  await page.getByRole("button", { name: /保存纪要/ }).click();

  if (!(await page.locator(".hr-tasks-app").count())) throw new Error("notes should create work in Tasks");
  await page.getByRole("button", { name: /确认责任人与期限/ }).click();

  for (let phase = 0; phase < 2; phase += 1) {
    await openApp("People Chat");
    for (let turn = 0; turn < 2; turn += 1) {
      if (!(await page.locator(".hr-followup-conversation textarea").inputValue()).trim()) throw new Error("responsibility follow-up should prefill the next message");
      if (await page.locator(".hr-contact-prompts").count()) throw new Error("follow-up should not offer branching reply choices");
      await page.getByRole("button", { name: "发送跟进消息" }).click();
      await page.waitForTimeout(680);
    }
    await page.locator(".hr-phase-complete").click();
    if (!(await page.locator(".hr-time-transition").count())) throw new Error("crossing follow-up dates should show a time transition");
    await waitForTimeShift();
  }

  await openApp("Meet");
  if (!(await page.getByText("DAY 14").count())) throw new Error("employee callback should appear in Meet");
  for (let turn = 0; turn < 3; turn += 1) {
    if (!(await page.locator(".hr-followup-conversation textarea").inputValue()).trim()) throw new Error("employee callback should prefill the next message");
    await page.getByRole("button", { name: "发送跟进消息" }).click();
    await page.waitForTimeout(680);
  }
  await page.locator(".hr-phase-complete").click();
  if (!(await page.locator(".hr-time-transition").count())) throw new Error("closing the callback should show a time transition");
  await waitForTimeShift();

  await openApp("Drive");
  if (await page.locator(".hr-deliverable-grid > article").count() !== 4) throw new Error("Drive should contain the closed-loop package");
  await page.screenshot({ path: "tmp/hr-v7-drive.png", fullPage: false });

  for (const [name, width, height] of [["desktop", 1440, 900], ["tablet", 1024, 768], ["mobile", 390, 844]]) {
    await page.setViewportSize({ width, height });
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) throw new Error(`horizontal overflow at ${name}`);
  }
} finally {
  await browser.close();
}
