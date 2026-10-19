import { chromium } from 'playwright';

const base = process.env.BASE_URL ?? 'http://localhost:5174/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto(base);
await page.evaluate(() => localStorage.removeItem('career-experience-hrbp-v3'));
await page.reload();

// 进入 HRBP 职业
const hrCard = page.locator('.career-card', { hasText: 'HRBP' });
await hrCard.getByRole('button', { name: '进入体验' }).click();
await page.waitForTimeout(800);

// 任务邮件 -> 查看员工工作记录
await page.getByText('查看员工工作记录').click();
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/hr-profile-intro.png' });

// 第 1 回合：自由文本回答事实/评价区分
await page.locator('.hr-chat-composer textarea').fill('①②③⑤是事实，完成率、考勤、排班系统里都能查到记录；④⑥是周店长的主观评价和推测，要先打个问号');
await page.locator('.hr-chat-composer textarea').press('Enter');
await page.waitForTimeout(2600);
await page.screenshot({ path: '/tmp/hr-profile-turn1.png' });

// 第 2 回合：怎么用
await page.locator('.hr-chat-composer textarea').fill('我会用完成率和调班记录这些事实开场，找工作的推测只当线索放在心里，等他自己说到');
await page.locator('.hr-chat-composer textarea').press('Enter');
await page.waitForTimeout(2600);
await page.screenshot({ path: '/tmp/hr-profile-done.png' });

console.log('profile complete card:', await page.getByText('读档案的手感').count());

// 直接跳到跟进方案（走一遍完整流程太慢，用 localStorage 预置状态）
const state = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('career-experience-hrbp-v3'));
  return { stage: s.currentStage, profileComplete: s.profileComplete, outcomes: s.profileOutcomes };
});
console.log('persisted:', JSON.stringify(state));

// 预置一个已面谈完的状态来看跟进方案
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('career-experience-hrbp-v3'));
  s.currentStage = 5;
  s.activeApp = 'followup';
  s.interviewOutcomes = [{ beat: 2, outcomeId: 'boundary', tier: 'good', trust: 3 }];
  s.recordFacts = 'f'; s.recordConcerns = 'c'; s.recordQuote = 'q'; s.recordBoundary = 'b';
  localStorage.setItem('career-experience-hrbp-v3', JSON.stringify(s));
});
await page.reload();
await page.waitForTimeout(900);
await page.locator('.career-card', { hasText: 'HRBP' }).getByRole('button', { name: '进入体验' }).click();
await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/hr-followup-intro.png' });

// 跟进方案第 1 回合：自由指定（含负责人+期限+两类动作）
await page.locator('.hr-chat-composer textarea').fill('1. 区域HR协调周店长，7个工作日内补交储备店长面谈反馈；2. 门店主管定规则，非紧急调班提前48小时沟通；3. 我两周后约小林做一次20分钟回访');
await page.locator('.hr-chat-composer textarea').press('Enter');
await page.waitForTimeout(2600);
await page.screenshot({ path: '/tmp/hr-followup-done.png' });
console.log('followup complete card:', await page.getByText('方案方向已确认').count());

// 键盘检查
const keys = await page.locator('.keyboard-key').count();
console.log('keyboard keys rendered:', keys);

await browser.close();
