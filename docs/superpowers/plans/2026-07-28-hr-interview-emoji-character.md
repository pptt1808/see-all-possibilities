# HR 会谈室 Emoji 情绪与第一人称构图 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 HR 会谈室改为左下放大电脑、前置宽桌、右侧简化角色的第一人称构图，并以 emoji 清晰表达谈话情绪。

**Architecture:** 保留 `HrApp.tsx` 既有的信任分数和面谈状态机，在组件内集中派生情绪文案和 emoji。会谈室场景仍由 HTML/CSS 绘制；新增 CSS 覆盖规则只影响 `.hr-interview-mode`，避免改变 HR 的其他工作页。

**Tech Stack:** React 18、TypeScript、CSS、Vite、Playwright

---

### Task 1: 先建立会谈室情绪标识的回归检查

**Files:**
- Create: `verify-hr-interview-emoji.mjs`
- Test: `verify-hr-interview-emoji.mjs`

- [ ] **Step 1: 写入会失败的浏览器检查，要求会谈室出现情绪 emoji 与状态文字**

```js
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5174/');
await page.getByText('HRBP').first().click();
await page.evaluate(() => {
  const state = JSON.parse(localStorage.getItem('career-experience-hrbp-v3'));
  state.currentStage = 3;
  state.activeApp = 'interview';
  state.interviewMessages = [{ id: 1, role: 'employee', text: '主管让我来的。' }];
  localStorage.setItem('career-experience-hrbp-v3', JSON.stringify(state));
});
await page.reload();

if (await page.locator('.hr-interview-emotion').count() !== 2) throw new Error('expected two emotion indicators');
if ((await page.locator('.hr-interview-emotion').first().textContent())?.includes('😶‍🌫️') !== true) throw new Error('expected cautious emoji');

await browser.close();
```

- [ ] **Step 2: 运行检查并确认它因缺少 `.hr-interview-emotion` 失败**

Run: `node verify-hr-interview-emoji.mjs`

Expected: fails with `expected two emotion indicators`.

- [ ] **Step 3: 实现最小情绪派生与两个标识节点**

```tsx
const interviewEmotion = interviewTrust >= 5
  ? { emoji: '😊', label: '开始信任' }
  : interviewTrust >= 1
    ? { emoji: '🙂', label: '逐渐放松' }
    : interviewTrust >= -2
      ? { emoji: '😶‍🌫️', label: '保持谨慎' }
      : { emoji: '😟', label: '明显防御' };

<span className="hr-interview-emotion" aria-label={`小林当前状态：${interviewEmotion.label}`}>
  <span aria-hidden="true">{interviewEmotion.emoji}</span>
  {interviewEmotion.label}
</span>
```

- [ ] **Step 4: 再次运行检查，确认情绪标识通过**

Run: `node verify-hr-interview-emoji.mjs`

Expected: exit 0.

### Task 2: 调整会谈场景构图与人物状态

**Files:**
- Modify: `src/HrApp.tsx:1082-1165`
- Modify: `src/App.css:8268-8476`
- Test: `verify-hr-interview-emoji.mjs`

- [ ] **Step 1: 扩展浏览器检查，断言第一人称场景的关键定位类存在**

```js
const scene = await page.locator('.hr-interview-mode').evaluate((node) => getComputedStyle(node));
if (scene.getPropertyValue('--hr-table-line').trim() === '') throw new Error('expected meeting table layout token');
if (await page.locator('.hr-interview-character-emotion').count() !== 1) throw new Error('expected character-side emotion indicator');
```

- [ ] **Step 2: 运行检查并确认它因缺少人物侧情绪标识失败**

Run: `node verify-hr-interview-emoji.mjs`

Expected: fails with `expected character-side emotion indicator`.

- [ ] **Step 3: 在人物旁加入状态标识，并停用面部说话动画的状态 class**

```tsx
<span className="hr-interview-character-emotion" aria-hidden="true">
  {interviewEmotion.emoji}
</span>
```

将 `hr-face-stage` 的 class 从包含 `is-speaking` 改为只包含 `interviewMoodClass`。

- [ ] **Step 4: 在 CSS 末尾添加第一人称桌面覆盖规则**

```css
.hr-interview-mode > .desk { left: max(22px, calc(50% - 690px)); width: min(710px, 56vw); }
.hr-interview-mode .hr-meeting-table { right: 12px; left: 12px; }
.hr-interview-mode .hr-seated-character { right: clamp(22px, 5vw, 76px); }
.hr-interview-character-emotion { position: absolute; z-index: 5; }
```

规则须同时定义 900px 和 620px 以下的响应式位置，确保电脑、人物、宽桌不互相遮挡。

- [ ] **Step 5: 再次运行浏览器检查并截取 1440×900 画面**

Run: `node verify-hr-interview-emoji.mjs`

Expected: exit 0 and writes `tmp/hr-interview-emoji.png`.

### Task 3: 多视口目视验证和构建验证

**Files:**
- Modify: `verify-hr-interview-emoji.mjs`
- Modify: `src/App.css` only if a screenshot shows overlap

- [ ] **Step 1: 扩展检查脚本，依次截图三种视口**

```js
for (const [name, width, height] of [['desktop', 1440, 900], ['tablet', 1024, 768], ['mobile', 390, 844]]) {
  await page.setViewportSize({ width, height });
  await page.screenshot({ path: `tmp/hr-interview-${name}.png`, fullPage: false });
}
```

- [ ] **Step 2: 运行脚本并查看三张截图**

Run: `node verify-hr-interview-emoji.mjs`

Expected: exit 0; 三张截图中可见聊天窗口、宽桌、右侧人物和 emoji，且没有横向溢出。

- [ ] **Step 3: 执行 TypeScript 与生产构建**

Run: `npm run build`

Expected: exit 0; 若环境缺失本地可执行依赖，记录完整错误，改用已安装的运行时恢复依赖后重试。

- [ ] **Step 4: 删除未使用的本轮人物图片资产**

Delete: `src/assets/hr-interview/xiaolin-seated-storybook-v1.png`

Delete: `src/assets/hr-interview/xiaolin-seated-storybook-v2.png`

Expected: 项目只保留实际引用的资产，且页面不依赖这两个 PNG。
