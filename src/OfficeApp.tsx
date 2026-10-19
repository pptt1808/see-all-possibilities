import {
  Archive,
  ArrowRight,
  AtSign,
  Bold,
  Bot,
  ChevronDown,
  CheckCircle2,
  ClipboardCopy,
  Clock3,
  Download,
  FileText,
  Inbox,
  LayoutGrid,
  Lock,
  MessageSquare,
  Monitor,
  MoreHorizontal,
  Paperclip,
  Plus,
  Reply,
  RefreshCw,
  Search,
  SendHorizontal,
  Smile,
  Star,
  Italic,
  Sparkles,
  Trophy,
  Users,
  Wand2,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

type Accent = "teal" | "coral" | "amber" | "mint";
type AppId = "brief" | "chat" | "doc" | "flow" | "final";
type ChatChannel = "mentor" | "developer" | "manager" | "participant";
type ProductPath = "group" | "solo";

type DesktopApp = {
  id: AppId;
  label: string;
  title: string;
  subtitle: string;
  glyph: string;
  accent: Accent;
  stageIndex: number;
};

type AppNudge = {
  appId: AppId;
  text: string;
};

type PrdDraft = {
  goal: string;
  background: string;
  objective: string;
  users: string;
  scenario: string;
  pain: string;
  assumptions: string[];
  successMetrics: {
    name: string;
    target: string;
  }[];
  scope: string[];
  outOfScope: string[];
  userStories: string[];
  requirements: {
    title: string;
    description: string;
    acceptance: string[];
  }[];
  risks: string[];
};

type PrdDraftResult = {
  coreFeatures: string[];
  laterFeatures: string[];
  prdDraft: PrdDraft;
};

type PrototypeScreen = {
  name: string;
  purpose: string;
  blocks: string[];
  accent: Accent;
  nextScreen?: string;
};

type RoleFeedback = {
  role: string;
  focus: string;
  value: string;
  concern: string;
  suggestion: string;
  accent: Accent;
};

type ChatMessage = {
  speaker: string;
  role: "user" | "mentor" | "system" | "manager" | "developer" | "participant";
  text: string;
  time?: string;
};

type ChatProgress = Partial<Record<ChatChannel, number>>;
type ChatSentInputs = Partial<Record<ChatChannel, string[]>>;
type PendingChatMessage = {
  turnIndex: number;
  input: string;
};
type ChatPending = Partial<Record<ChatChannel, PendingChatMessage>>;
type ReviewContact = Exclude<ChatChannel, "mentor">;

type ChatScriptTurn = {
  input: string;
  userTime: string;
  replies: ChatMessage[];
};

type ChatScript = {
  intro: ChatMessage[];
  turns: ChatScriptTurn[];
};

type DocReviewStep = {
  speaker: string;
  role: string;
  comment: string;
  input: string;
  impact: string;
};

type PreviewPage = "home" | "create" | "friends" | "options" | "vote" | "final";

type ExperienceState = {
  currentStage: number;
  activeApp: AppId;
  productPath: ProductPath | null;
  idea: string;
  featuresInput: string;
  docGenerationInput: string;
  flowInput: string;
  iterationInput: string;
  chatProgress: ChatProgress;
  chatSentInputs: ChatSentInputs;
  chatPending: ChatPending;
  docReviewProgress: number;
  docReviewInputs: string[];
  productDirection: string;
  targetUser: string;
  painPoint: string;
  firstValue: string;
  prdDraft: PrdDraft | null;
  coreFeatures: string[];
  laterFeatures: string[];
  flowNodes: string[];
  prototypeScreens: PrototypeScreen[];
  prototypeEdited: boolean;
  prototypePreviewed: boolean;
  teamFeedback: RoleFeedback[];
  businessTestReceived: boolean;
  dataIterationApplied: boolean;
  iterationDecisions: string[];
  finalSummary: string[];
  toast: string | null;
  updatedAt: string;
};

const STORAGE_KEY = "pm-career-experience-demo-office-v6";

const APPS: DesktopApp[] = [
  {
    id: "brief",
    label: "邮箱",
    title: "Inbox",
    subtitle: "读取今天的任务邮件",
    glyph: "📮",
    accent: "amber",
    stageIndex: 0,
  },
  {
    id: "chat",
    label: "Chat",
    title: "Campus Chat",
    subtitle: "和 Mentor、开发、业务沟通",
    glyph: "💬",
    accent: "teal",
    stageIndex: 1,
  },
  {
    id: "doc",
    label: "Docs",
    title: "Product Docs",
    subtitle: "编辑 PRD 与版本范围",
    glyph: "📜",
    accent: "coral",
    stageIndex: 2,
  },
  {
    id: "flow",
    label: "Figma",
    title: "Figma Design",
    subtitle: "设计页面、连接原型并预览交互",
    glyph: "🗺️",
    accent: "mint",
    stageIndex: 3,
  },
  {
    id: "final",
    label: "交付",
    title: "Delivery Folder",
    subtitle: "导出并复盘这次体验",
    glyph: "🎁",
    accent: "coral",
    stageIndex: 4,
  },
];

const KEYBOARD_ROWS = [
  ["Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "⌫"],
  ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Del"],
  ["Caps", "A", "S", "D", "F", "G", "H", "J", "K", "L", "Enter"],
  ["Fn", "Ctrl", "Alt", "Space", "Alt", "←", "↓", "→"],
] as const;

function createDefaultState(): ExperienceState {
  return {
    currentStage: 0,
    activeApp: "brief",
    productPath: null,
    idea: "",
    featuresInput: "",
    docGenerationInput: "",
    flowInput: "",
    iterationInput: "",
    chatProgress: {},
    chatSentInputs: {},
    chatPending: {},
    docReviewProgress: 0,
    docReviewInputs: [],
    productDirection: "",
    targetUser: "",
    painPoint: "",
    firstValue: "",
    prdDraft: null,
    coreFeatures: [],
    laterFeatures: [],
    flowNodes: [],
    prototypeScreens: [],
    prototypeEdited: false,
    prototypePreviewed: false,
    teamFeedback: [],
    businessTestReceived: false,
    dataIterationApplied: false,
    iterationDecisions: [],
    finalSummary: [],
    toast: null,
    updatedAt: "",
  };
}

function loadState(): ExperienceState {
  if (typeof window === "undefined") {
    return createDefaultState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }

    const parsed = JSON.parse(raw) as Partial<ExperienceState> & {
      currentStep?: number;
    };
    const currentStage =
      typeof parsed.currentStage === "number"
        ? parsed.currentStage
        : typeof parsed.currentStep === "number"
          ? parsed.currentStep
          : 0;
    const activeApp = APPS.some((app) => app.id === parsed.activeApp)
      ? (parsed.activeApp as AppId)
      : APPS[Math.min(currentStage, APPS.length - 1)]?.id ?? "brief";

    return {
      ...createDefaultState(),
      ...parsed,
      currentStage: clamp(currentStage, 0, APPS.length - 1),
      activeApp,
      chatPending: {},
    };
  } catch {
    return createDefaultState();
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function stamp(state: ExperienceState): ExperienceState {
  return {
    ...state,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeText(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function hasAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function uniqueList(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function linkPrototypeScreens(screens: PrototypeScreen[]) {
  return screens.map((screen, index) => ({
    ...screen,
    nextScreen: screen.nextScreen || screens[index + 1]?.name || "",
  }));
}

const DEFAULT_FEATURES_INPUT = "用户可以发起计划、私下填写硬性限制和可妥协偏好，看到共同点与冲突，比较带妥协说明的方案，并确认一个所有人都能接受的计划。";
const SOLO_DEFAULT_FEATURES_INPUT = "小组先设置一次共同边界，系统轮换本周主理人；主理人在边界内发布一个计划，其他成员只需选择能参加、本周跳过或因违反边界而否决，截止后锁定行程。";
const DEFAULT_DOC_GENERATION_INPUT = "请根据我和 Mentor 在 Chat 中确认的产品方向，生成 PRD Draft v1。第一版先聚焦核心用户、关键痛点、核心流程、成功指标和版本范围。";
const MENTOR_DIRECTION_TURN_COUNT = 3;
const GROUP_BUSINESS_TEST_METRICS = [
  { label: "计划创建完成率", value: "72%", note: "基本符合预期" },
  { label: "约束提交率", value: "68%", note: "接近 70% 目标" },
  { label: "可接受方案确认率", value: "42%", note: "低于 60% 目标" },
  { label: "达成共识耗时", value: "23 min", note: "高于 15 min 目标" },
];
const SOLO_BUSINESS_TEST_METRICS = [
  { label: "共同边界设置率", value: "81%", note: "达到 75% 目标" },
  { label: "主理人发布率", value: "74%", note: "达到 70% 目标" },
  { label: "成员按时响应率", value: "46%", note: "低于 80% 目标" },
  { label: "计划按时锁定率", value: "38%", note: "低于 60% 目标" },
];
const DATA_ITERATION_DECISION =
  "根据 20 组灰度测试数据，在候选方案中补充共同点、冲突点和每个人的妥协成本，并提供接受、提出替代或否决并说明原因的协商入口。";

const GROUP_DOC_REVIEW_STEPS: DocReviewStep[] = [
  {
    speaker: "Mentor",
    role: "PM coach · PRD review",
    comment:
      "目标这段还是有点虚。先别写“提升效率”，直接写清楚：这群人能不能在 15 分钟里确认一个都能接受的方案。",
    input: "第一版验证目标：一组朋友能否在 15 分钟内看见共同点、理解冲突与妥协成本，并确认一个所有人都能接受的共同计划。",
    impact: "把产品目标改成可验证假设",
  },
  {
    speaker: "Mentor",
    role: "PM coach · PRD review",
    comment:
      "范围再收一点。账号、AA、优惠、攻略库都先拿掉；这版只留提交约束、看冲突和确认方案。",
    input: "MVP 只保留：创建计划、私下提交硬性限制与可妥协偏好、查看共同点和冲突、比较最多 3 个妥协方案、接受或提出替代。账号历史、AA、优惠和完整攻略暂不做。",
    impact: "收敛 MVP 范围并补齐 out of scope",
  },
  {
    speaker: "Mentor",
    role: "PM coach · PRD review",
    comment:
      "指标不用铺太多。就盯三件事：有没有人填、最后有没有确认、用了多久。投票点了几次不重要。",
    input: "成功指标：80% 发起人在 3 分钟内创建计划；70% 受邀成员完成约束提交；60% 计划在 15 分钟内确认一个可接受方案。",
    impact: "补充可衡量的行为漏斗",
  },
  {
    speaker: "Mentor",
    role: "PM coach · PRD review",
    comment:
      "验收这里还少一块：用户得看得出冲突在哪、自己要让什么；不接受时也得能说原因或换一个方案。",
    input: "验收补充：硬性限制与可妥协偏好分开提交；方案首屏展示共同点、冲突点和每个人的妥协成本；成员可以接受、提出替代或否决并说明原因；邀请失败时允许重新复制链接。",
    impact: "把关键体验写进验收标准",
  },
];

const SOLO_DOC_REVIEW_STEPS: DocReviewStep[] = [
  {
    speaker: "Mentor",
    role: "PM coach · PRD review",
    comment: "目标别写成“让决策更轻松”。直接验证：轮到一个人负责以后，小组能不能更快发布并锁定一个计划。",
    input: "第一版验证目标：主理人能否在 10 分钟内基于共同边界发布一个计划，成员能否在截止前完成轻量响应，并让小组锁定可执行行程。",
    impact: "把责任机制改成可验证假设",
  },
  {
    speaker: "Mentor",
    role: "PM coach · PRD review",
    comment: "别顺手做成群聊和攻略平台。第一版只验证共同边界、轮值主理人、发布一个计划和轻量响应。",
    input: "MVP 只保留：建立小组共同边界、轮换或抽取主理人、主理人发布一个计划、成员选择能参加/本周跳过/边界否决、截止后锁定行程。群聊、路线推荐、预订和支付暂不做。",
    impact: "收敛主理人机制的 MVP 范围",
  },
  {
    speaker: "Mentor",
    role: "PM coach · PRD review",
    comment: "指标要能看出责任有没有真的转起来：边界有没有建、主理人有没有发、成员有没有回、计划有没有锁定。",
    input: "成功指标：75% 小组完成共同边界设置；70% 主理人在 10 分钟内发布计划；80% 成员在截止前响应；60% 小组在 2 小时内锁定计划。",
    impact: "补充责任交接与响应漏斗",
  },
  {
    speaker: "Mentor",
    role: "PM coach · PRD review",
    comment: "规则得公平。主理人不能越过共同底线；不想参加的人也不能被迫背锅。换人和没人响应的兜底要写清楚。",
    input: "验收补充：主理人发布的计划必须满足共同硬性边界；成员可选择本周跳过且不阻塞其他人；只有违反共同边界时才能否决并说明原因；主理人可一键换人；未响应者不计入参加名单，截止后仍为已响应成员锁定行程。",
    impact: "把角色权责与公平兜底写进验收标准",
  },
];

function hasMentorPrdFeedback(state: ExperienceState) {
  return Boolean(state.prdDraft) && (state.chatProgress.mentor ?? 0) > MENTOR_DIRECTION_TURN_COUNT;
}

function appendDocRevisionInput(existing: string, revision: string) {
  const base = normalizeText(existing, DEFAULT_FEATURES_INPUT);
  const cleanRevision = revision.trim();

  if (!cleanRevision || base.includes(cleanRevision)) {
    return base;
  }

  return `${base}\n${cleanRevision}`;
}

function inferProductPath(value: string): ProductPath {
  return hasAny(value, ["主理人", "负责人", "轮值", "收敛", "没人拍板", "没有人负责", "责任"])
    ? "solo"
    : "group";
}

function getProductPath(state: Pick<ExperienceState, "productPath" | "idea" | "productDirection">): ProductPath {
  return state.productPath ?? inferProductPath(`${state.idea} ${state.productDirection}`);
}

function getDocReviewSteps(path: ProductPath) {
  return path === "solo" ? SOLO_DOC_REVIEW_STEPS : GROUP_DOC_REVIEW_STEPS;
}

function getBusinessTestMetrics(path: ProductPath) {
  return path === "solo" ? SOLO_BUSINESS_TEST_METRICS : GROUP_BUSINESS_TEST_METRICS;
}

function getDefaultFeaturesInput(path: ProductPath) {
  return path === "solo" ? SOLO_DEFAULT_FEATURES_INPUT : DEFAULT_FEATURES_INPUT;
}

function createDirectionDraft(idea: string, explicitPath?: ProductPath) {
  const path = explicitPath ?? inferProductPath(idea);
  const consensusMode = path === "group";

  const targetUser = "想和朋友周末出门、却总在群聊里迟迟定不下来的大学生小组";

  const painPoint = consensusMode
    ? "群聊里每个人只说自己想要什么，却没人看见共同点、硬性限制和需要谁妥协"
    : "群聊里每个人都能继续提意见，却没有明确的人负责收敛并发布计划，讨论因此一直停在“再看看”";

  const firstValue = consensusMode
    ? "私下收集硬性限制和可妥协偏好，展示共同点与冲突，并帮助大家确认一个都能接受的计划"
    : "先建立共同边界，再轮换一位周末主理人负责发布一个计划，让其他成员轻量响应并在截止后锁定行程";

  const productDirection = `面向${targetUser}，通过${firstValue}。`;

  return {
    targetUser,
    painPoint,
    firstValue,
    productDirection,
  };
}

function createSoloPrdDraft(state: ExperienceState): PrdDraftResult {
  const reviewCount = clamp(state.docReviewProgress, 0, SOLO_DOC_REVIEW_STEPS.length);
  const direction = createDirectionDraft(
    normalizeText(state.idea, "我觉得大家一直定不下来，是因为每个人都能提意见，却没人负责把讨论收敛成一个计划"),
    "solo",
  );
  const features = [
    "建立小组共同硬性边界",
    "轮换或抽取本周主理人",
    "主理人在边界内发布一个计划",
    "成员轻量响应参加、跳过或边界否决",
    "截止后锁定已响应成员的行程",
    "换主理人与保底计划兜底",
  ];
  const laterFeatures = ["群内即时聊天", "智能路线推荐", "交通与门票预订", "支付与 AA", "主理人积分排行榜"];
  const scope = features;
  const successMetrics = reviewCount >= 3
    ? [
        { name: "共同边界设置率", target: "75% 新建小组完成时间、预算和活动半径设置。" },
        { name: "主理人发布率", target: "70% 当周主理人在接棒后 10 分钟内发布一个计划。" },
        { name: "成员按时响应率", target: "80% 受邀成员在截止前选择参加、跳过或边界否决。" },
        { name: "计划按时锁定率", target: "60% 小组在发起后 2 小时内锁定可执行计划。" },
      ]
    : [
        { name: "主理人接棒率", target: "被选中的成员愿意接下本周决策任务。" },
        { name: "计划发布时间", target: "主理人能快速在共同边界内发布一个计划。" },
        { name: "群体响应率", target: "其他成员愿意用轻量方式表态，而不是回到群聊继续讨论。" },
      ];
  const responseAcceptance = reviewCount >= 4
    ? ["成员可以选择能参加或本周跳过，跳过不会阻塞其他成员。", "只有计划违反共同硬性边界时才能否决，并需选择原因。", "未响应者不会被默认算作参加，截止后不阻止已响应成员锁定行程。"]
    : ["成员可以用一个操作完成响应。", "响应状态对主理人可见。", "截止前允许修改自己的选择。"];

  return {
    coreFeatures: scope,
    laterFeatures,
    prdDraft: {
      goal: state.productDirection || direction.productDirection,
      background: "访谈中，多组学生都提到周末群聊会不断增加新意见，却很少有人愿意负责收敛。即使大家的基本边界并不冲突，也会因为等待所有人继续表态而错过行动时间。",
      objective: reviewCount >= 1
        ? "第一版验证一件事：明确一位主理人负责发布后，小组能否减少反复讨论，并在 2 小时内锁定一个可执行计划。"
        : "通过轮值责任和轻量响应，把群聊里的无限讨论变成一次有负责人、有截止时间的行动。",
      users: state.targetUser || direction.targetUser,
      scenario: "周五晚上，四位朋友又开始讨论周末去哪。小组已经有预算、返程时间和活动半径等共同边界，本周主理人接棒后在边界内发布一个计划；其他成员只需在截止前确认参加、跳过或指出计划违反了哪条共同边界。",
      pain: state.painPoint || direction.painPoint,
      assumptions: [
        "小组愿意提前建立少量共同硬性边界，并允许主理人在边界内自主决策。",
        "明确责任人比继续收集所有人的偏好更能缩短决策时间。",
        "成员愿意用参加、跳过或边界否决代替开放式讨论。",
      ],
      successMetrics,
      scope,
      outOfScope: laterFeatures.slice(0, reviewCount >= 2 ? 5 : 3),
      userStories: [
        "作为小组成员，我希望只设置一次真正不能越过的共同边界，不必每周重新填一遍偏好。",
        "作为本周主理人，我希望清楚知道自己可以决定什么，并快速发布一个计划。",
        "作为其他成员，我希望能轻量选择参加或本周跳过，不必为了照顾所有人重新开一轮讨论。",
        "如果计划违反了共同边界，我希望能指出具体原因；如果主理人临时没空，也能快速换人。",
      ],
      requirements: [
        {
          title: "共同边界与主理人轮值",
          description: "小组设置预算、返程时间和活动半径等硬性边界，并轮换或抽取本周主理人。",
          acceptance: ["共同边界只保留少量硬性条件，不收集完整偏好。", "所有成员都能看到轮值顺序和本周负责人。", "主理人可主动换人，接棒者需要确认。"],
        },
        {
          title: "发布一个计划",
          description: "主理人在共同边界内直接发布一个包含时间、地点和预算的计划，不再发起多选投票。",
          acceptance: ["计划若超出共同硬性边界会在发布前提示。", "第一版只允许发布一个当前计划，修改后保留变更提示。", "发布时必须设置成员响应截止时间。"],
        },
        {
          title: "成员响应与截止锁定",
          description: "成员轻量表态，截止后为已响应成员锁定行程，并保留换人和保底计划兜底。",
          acceptance: responseAcceptance,
        },
      ],
      risks: ["主理人角色可能被理解成替所有人承担攻略劳动，需要提供换人和保底模板。", "公开否决可能带来社交压力，应限制在违反共同边界的场景并允许选择原因。", "把未响应者默认算作参加会造成误解，锁定时必须明确参加名单。"],
    },
  };
}

function createPrdDraft(state: ExperienceState, input: string): PrdDraftResult {
  const productPath = getProductPath(state);
  if (productPath === "solo") {
    return createSoloPrdDraft(state);
  }

  const friendMode = true;
  const reviewCount = clamp(state.docReviewProgress, 0, GROUP_DOC_REVIEW_STEPS.length);
  const features = [
    "发起周末计划",
    friendMode
      ? "邀请朋友私下提交硬性限制与可妥协偏好"
      : "填写自己的硬性限制与可妥协偏好",
    "识别共同点与冲突",
    "生成带妥协说明的可接受方案",
    friendMode
      ? "成员接受、提出替代或否决"
      : "确认一个可执行的共同计划",
  ];

  if (reviewCount < 2) {
    features.push("保存历史计划");
  }

  const laterFeatures = uniqueList([
    "账号体系与历史计划",
    "AA 拆账",
    "优惠提醒",
    "完整攻略与商家库",
    "复杂社交关系链",
  ]);
  const scope =
    reviewCount >= 2
      ? uniqueList(features.filter((item) => item !== "保存历史计划" && item !== "设置预算和时间约束")).slice(0, 4)
      : uniqueList(features).slice(0, 6);
  const outOfScope = reviewCount >= 2 ? laterFeatures.slice(0, 4) : ["AA 拆账", "优惠提醒"];
  const users = state.targetUser || "想和朋友周末出门、但彼此有不同硬性限制的大学生小组";
  const pain = state.painPoint || "群聊里每个人只表达个人偏好，却看不见共同点、冲突和妥协成本，讨论容易反复";
  const goal =
    state.productDirection ||
    createDirectionDraft(normalizeText(state.idea, "帮大学生更快决定周末去哪玩"), "group").productDirection;
  const objective =
    reviewCount >= 1
      ? "第一版验证一件事：一组朋友能否在 15 分钟内看见共同点和冲突，理解妥协成本，并确认一个所有人都能接受的共同计划。"
      : "帮助大学生把群聊里的个人偏好转成共同约束，减少无效争论，找到一个所有人都能接受的周末方案。";
  const successMetrics =
    reviewCount >= 3
      ? [
          {
            name: "创建完成率",
            target: "80% 发起人能在 3 分钟内完成一次计划创建。",
          },
          {
            name: friendMode ? "约束提交率" : "约束表达率",
            target: friendMode
              ? "邀请链接打开后，至少 70% 朋友完成硬性限制与可妥协偏好提交。"
              : "用户能够明确标记至少 1 条硬性限制和 1 条可妥协偏好。",
          },
          {
            name: "共识完成率",
            target: "至少 60% 计划能在发起后的 15 分钟内确认一个所有人都能接受的方案。",
          },
        ]
      : [
          {
            name: "创建完成率",
            target: "多数试用用户能够顺利创建计划。",
          },
          {
            name: friendMode ? "约束表达率" : "约束表达率",
            target: friendMode ? "被邀请的朋友愿意表达硬性限制和可妥协偏好。" : "用户愿意说清楚自己的限制。",
          },
          {
            name: "共识完成率",
            target: "用户能够从冲突摘要进入一个可接受方案的确认。",
          },
        ];
  const preferenceAcceptance =
    reviewCount >= 4
      ? [
          "成员可以分别标记硬性限制与可妥协偏好，身份不会在汇总前暴露。",
          "发起人能看到已提交、待确认两类状态，邀请失败时可以重新复制链接。",
          "硬性限制会进入冲突分析，不会被多数投票直接覆盖。",
        ]
      : [
          "朋友可以私下填写时间、预算上限、体力和活动类型等限制。",
          "成员可以把每项标记为必须满足或可以妥协。",
          "发起人只能看到群体汇总，不会先看到谁和谁意见不同。",
        ];
  const optionAcceptance =
    reviewCount >= 4
      ? [
          "每个方案首屏展示满足人数、冲突点和每个人的妥协成本。",
          "方案数量默认不超过 3 个，并说明每个方案适合解决哪种冲突。",
          "成员可以接受、提出替代或否决并说明原因。",
        ]
      : [
          "每个方案展示共同点、冲突点和推荐理由。",
          "用户可以查看谁需要做什么妥协，而不是只看一个总分。",
          "用户可以从方案进入接受、替代或否决流程。",
        ];

  return {
    coreFeatures: scope,
    laterFeatures,
    prdDraft: {
      goal,
      background:
        "访谈里多名同学提到：周末想和朋友出门，但群聊只会叠加彼此的个人偏好。大家看不见哪些是不能动的硬性限制，也不知道为了一个方案谁需要牺牲什么，讨论因此反复且容易让少数人的限制被忽略。",
      objective,
      users,
      scenario: friendMode
        ? "周五晚上或周六上午，发起人临时想约 2-4 个朋友出门。每个人先私下写下时间、预算、体力等硬性限制和可妥协项，系统再把共同点、冲突和妥协成本放到同一张方案卡上，帮助大家确认一个可接受计划。"
        : "用户临时想安排半日或一日城市出行，不想阅读长攻略，希望快速得到少量可执行方案。",
      pain,
      assumptions: [
        "用户愿意先描述一个模糊出行意图，而不是填写完整攻略表单。",
        friendMode
          ? "成员愿意把限制拆成必须满足与可以妥协两类，并接受先私下提交、再看群体汇总。"
          : "用户能区分必须满足与可以妥协的条件，才会认为推荐结果可信。",
        "用户不一定追求所有偏好都满足，但需要知道方案解决了什么冲突、谁承担了什么妥协成本。",
      ],
      successMetrics,
      scope,
      outOfScope,
      userStories: [
        "作为发起人，我希望用一句话描述想法，并补充时间、预算和偏好，这样不用从零写攻略。",
        friendMode
          ? "作为被邀请的朋友，我希望私下写清不能接受什么、哪里可以让步，而且不必先暴露自己和谁冲突。"
          : "作为临时出门的学生，我希望先看到共同点、冲突和不同方案的妥协代价，而不是一长篇攻略。",
        "作为参与者，我希望能接受方案、提出一个替代方案或说明否决原因，而不是被多数票直接覆盖。",
        "作为发起人，我希望确认后的共同计划保留约束和妥协依据，方便解释并分享到群聊。",
      ],
      requirements: [
        {
          title: "创建计划",
          description: "发起人输入一句话出行想法，并补充时间、预算、人数和偏好。",
          acceptance: [
            "用户不填写完整表单也能用默认值生成计划。",
            "必填信息缺失时页面给出明确提示，不阻塞已填写内容。",
            "创建完成后能直接进入邀请或候选方案流程。",
          ],
        },
        {
          title: friendMode ? "约束与偏好收集" : "约束输入",
          description: friendMode
            ? "朋友通过轻量链接私下提交硬性限制与可妥协偏好，发起人只看到汇总状态。"
            : "用户标记必须满足与可以妥协的条件，系统据此生成冲突摘要。",
          acceptance: preferenceAcceptance,
        },
        {
          title: "共同点与妥协方案",
          description: "先展示群体共同点和未解决冲突，再生成最多 3 个带妥协说明的可接受方案。",
          acceptance: optionAcceptance,
        },
        {
          title: friendMode ? "共识确认" : "共同计划确认",
          description: friendMode
            ? "参与者查看妥协成本后，可以接受、提出替代或否决并说明原因，发起人确认共同计划。"
            : "用户查看冲突与妥协依据后确认一个可执行的共同计划。",
          acceptance: [
            "确认页展示共同点、未解决冲突、妥协成本和每位成员的选择状态。",
            "成员可以接受、提出替代或否决并留下原因，不能只点一个无解释的反对票。",
            "最终计划页保留集合时间、路线摘要、预算、返回时间和妥协说明，并可分享。",
          ],
        },
      ],
      risks: [
        "如果把硬性限制和可妥协偏好混在一起，系统可能用多数意见覆盖少数人的底线。",
        "如果只展示推荐分数而不展示妥协成本，用户会觉得系统在替他们做决定。",
        "第一版如果加入 AA、优惠、完整商家库，会稀释共同共识机制的验证目标。",
      ],
    },
  };
}

function createFlowAndPrototype(state: ExperienceState, input: string) {
  const friendMode = getProductPath(state) === "group";

  const flowNodes = friendMode
    ? ["创建计划", "私下提交硬性限制", "汇总共同点与冲突", "比较妥协方案", "成员接受/提出替代", "确认共同计划"]
    : ["建立共同边界", "轮换本周主理人", "主理人发布一个计划", "成员轻量响应", "截止后锁定行程", "换人或启用保底计划"];

  const prototypeScreens: PrototypeScreen[] = friendMode
    ? [
        {
          name: "发起计划",
          purpose: "让发起人用一句话说明周末想法，并邀请成员先私下写约束",
          blocks: ["一句话想法", "时间与人数边界", "生成邀请"],
          accent: "teal",
        },
        {
          name: "私人约束",
          purpose: "让成员把不能退让的底线和可以让步的偏好分开提交",
          blocks: ["必须满足", "可以妥协", "不公开身份"],
          accent: "mint",
        },
        {
          name: "共识方案",
          purpose: "把共同点、冲突和每个人的妥协成本放在同一张卡上",
          blocks: ["共同点", "冲突摘要", "妥协成本"],
          accent: "amber",
        },
        {
          name: "成员确认",
          purpose: "让成员接受、提出替代或否决并说明原因",
          blocks: ["接受", "提出替代", "否决原因", "共同计划"],
          accent: "coral",
        },
      ]
    : [
        {
          name: "小组共同边界",
          purpose: "让小组只设置真正不能越过的时间、预算和距离底线",
          blocks: ["预算上限", "最晚返程", "活动半径", "全员确认"],
          accent: "teal",
        },
        {
          name: "本周主理人",
          purpose: "明确本周由谁负责把讨论收敛成一个计划",
          blocks: ["轮值顺序", "本周负责人", "确认接棒", "一键换人"],
          accent: "amber",
        },
        {
          name: "发布一个计划",
          purpose: "让主理人在共同边界内直接发布一个计划而不是再次投票",
          blocks: ["时间与地点", "预算核对", "边界检查", "响应截止时间"],
          accent: "mint",
        },
        {
          name: "成员轻量响应",
          purpose: "让成员不再展开讨论，只选择参加、跳过或指出边界问题",
          blocks: ["能参加", "本周跳过", "边界否决原因", "剩余时间"],
          accent: "coral",
        },
        {
          name: "行程锁定",
          purpose: "截止后为已经响应的成员锁定计划并明确参加名单",
          blocks: ["参加名单", "集合信息", "未响应成员", "保底与换人记录"],
          accent: "coral",
        },
      ];

  return {
    flowNodes,
    prototypeScreens,
  };
}

function createRoleFeedback(state: ExperienceState): RoleFeedback[] {
  const direction = state.productDirection || "这个周末出行产品";
  if (getProductPath(state) === "solo") {
    return [
      {
        role: "业务负责人",
        focus: "第一版目标",
        value: `${direction} 把重点从“继续收集意见”换成了“明确谁负责收敛”，和第一条解法确实不同。`,
        concern: "如果主理人只是被迫替大家做攻略，这个角色很快就没人愿意接；如果默认所有人参加，又会产生新的协调问题。",
        suggestion: "先验证共同边界设置、主理人发布、成员响应和计划锁定四段漏斗，同时观察换人率。",
        accent: "teal",
      },
      {
        role: "前端开发",
        focus: "页面与交互",
        value: "这条流程可以按“定边界、接棒、发计划、成员回应、锁定”拆开，角色关系很清楚。",
        concern: "不过主理人、普通成员和未响应成员看到的按钮不一样，再加上过期和换人，状态会比第一条支线多。",
        suggestion: "我建议先把三个角色和截止时间做扎实，群聊、推荐和预订先不接，不然第一版很容易做散。",
        accent: "amber",
      },
      {
        role: "模拟用户",
        focus: "真实使用感受",
        value: "如果这周不是我负责，我只要点一下能不能参加，会比继续在群里解释轻松。",
        concern: "但我不想因为没及时回复就被默认算作参加，也不想公开否决后显得是我扫兴。",
        suggestion: "给我一个不阻塞别人的“本周跳过”；只有计划越过共同底线时才让我说明否决原因。",
        accent: "coral",
      },
    ];
  }
  const consensusMetric = state.flowNodes.some((node) => node.includes("确认")) ? "可接受共识效率" : "约束表达清晰度";

  return [
    {
      role: "业务负责人",
      focus: "第一版目标",
      value: `${direction} 已经有明确的学生场景，也抓到了群聊决策反复的根因。`,
      concern: "如果最后还是用多数票结束讨论，少数人的硬性限制会被掩盖，产品只是在更快地制造新一轮争论。",
      suggestion: `先验证“${consensusMetric}”：成员是否能看见冲突和妥协成本，并在 15 分钟内确认一个都能接受的方案。`,
      accent: "teal",
    },
    {
      role: "前端开发",
      focus: "页面与交互",
      value: "这条流程可以按“填限制、看冲突、确认方案”分成几步，第一版做成网页 Demo 没问题。",
      concern: "但别把硬性限制、可以让步的偏好和确认状态全塞进一张表里，用户看不懂，我们做起来也容易乱。",
      suggestion: "我建议拆成三张页面：先填自己的限制，再看冲突摘要，最后确认方案。每一步只处理一件事。",
      accent: "amber",
    },
    {
      role: "模拟用户",
      focus: "真实使用感受",
      value: "如果打开后能先看到大家的共同点和真正的冲突，我愿意参与。",
      concern: "我不想被一个总分或多数意见逼着接受，也不想填很多字段。",
      suggestion: "方案卡直接写清谁需要让步、让多少，以及我可以接受、提出替代或说明否决的原因。",
      accent: "coral",
    },
  ];
}

function createIterationDecisions(state: ExperienceState, input: string) {
  if (getProductPath(state) === "solo") {
    const basis = normalizeText(input, "成员可以轻量选择参加或跳过，只有违反共同边界时才否决；未响应者不默认参加。");
    return uniqueList([
      "保留主路径：建立共同边界 -> 轮换主理人 -> 发布一个计划 -> 成员轻量响应 -> 截止锁定",
      "主理人只能在共同硬性边界内发布，但不需要再次满足每个人的全部偏好",
      hasAny(basis, ["跳过", "否决", "未响应", "边界", "数据"])
        ? "成员响应拆成能参加、本周跳过和边界否决；未响应者不默认参加"
        : "成员响应保持一步完成，不重新打开自由讨论",
      "补充一键换主理人与无人接棒时的保底计划",
      "群聊、智能推荐、预订和支付明确放到后续版本",
    ]);
  }
  const basis = normalizeText(
    input,
    "成员先私下提交硬性限制和可妥协偏好，方案优先展示共同点、冲突项和妥协成本。",
  );

  return uniqueList([
    "保留主路径：发起计划 -> 私下提交约束 -> 看见共同点与冲突 -> 比较妥协方案 -> 确认共同计划",
    hasAny(basis, ["简单", "轻", "朋友", "标签"])
      ? "约束输入拆成必须满足与可以妥协，成员不需要先公开身份"
      : "用户输入保持自然语言为主，再明确标记硬性限制",
    hasAny(basis, ["冲突", "共同", "妥协", "代价", "数据"])
      ? "方案卡强化共同点、冲突摘要、妥协成本和替代入口"
      : "方案卡强化可比较的约束满足情况",
    hasAny(basis, ["AA", "拆账", "优惠", "攻略"])
      ? "AA、优惠和完整攻略明确放到后续版本"
      : "第一版暂不扩展复杂周边功能",
  ]);
}

function createFinalSummary(state: ExperienceState) {
  const direction =
    state.productDirection ||
    createDirectionDraft(normalizeText(state.idea, "帮大学生更快决定周末去哪玩"), getProductPath(state)).productDirection;
  const hasReview = state.iterationDecisions.length > 0;
  const soloMode = getProductPath(state) === "solo";

  return [
    `你聊出来的产品方向是：${direction}`,
    `你完成了 ${state.coreFeatures.length || 4} 个第一版核心功能，并把它们组织成 ${state.flowNodes.length || 5} 个流程节点。`,
    hasReview
      ? "你经历了一次同事评审，并把反馈转成了可执行的迭代决策。"
      : "你已经完成了产品雏形，后续可以补一次同事反馈迭代。",
    state.dataIterationApplied
      ? soloMode
        ? "你读懂了责任机制漏斗：共同边界设置率和主理人发布率都达标，但成员按时响应率只有 46%，计划锁定率只有 38%。你据此重做了成员响应规则，并补上跳过、边界否决和未响应兜底。"
        : "你读懂了业务部门的测试漏斗：约束提交率尚可，但可接受方案确认率只有 42%，达成共识平均要 23 分钟。你据此把原型升级为展示共同点、冲突与妥协成本的共识方案。"
      : "后续还可以结合测试数据，验证关键功能是否真的改善了用户行为。",
    "这段体验对应了产品经理的典型工作：澄清真实问题、判断优先级、组织流程、沟通反馈、分析数据和推进迭代。",
    "如果你喜欢这种把模糊想法推进成具体方案的过程，可以继续体验产品经理、用户研究或运营策划方向。",
  ];
}

const MENTOR_GROUP_IDEA = "我觉得大家一直定不下来，是因为共同点、硬性限制和妥协成本都藏在群聊里。我想先让这些冲突变得透明，再一起确认可接受方案。";
const MENTOR_SOLO_IDEA = "我觉得是另一个原因：每个人都能继续提意见，却没人负责把讨论收敛。我想让小组先设共同边界，再轮换一位周末主理人发布一个计划，其他人只做轻量响应。";
const MENTOR_DEFAULT_IDEA = MENTOR_GROUP_IDEA;
const ITERATION_DEFAULT_REPLY =
  "我会把流程改成：成员先私下提交硬性限制和可妥协偏好，系统展示共同点、冲突和妥协成本，再让每个人接受、提出替代或说明否决原因。";
const SOLO_ITERATION_DEFAULT_REPLY =
  "我会保留主理人发布一个计划的机制，但把成员响应改成能参加、本周跳过或边界否决；未响应者不默认参加，并补上一键换主理人和保底计划。";

const REVIEW_CONTACT_CONFIG: Record<
  ReviewContact,
  {
    speaker: string;
    role: ChatMessage["role"];
    focus: string;
    emptyText: string;
    ackText: string;
  }
> = {
  developer: {
    speaker: "前端开发",
    role: "developer",
    focus: "页面怎么拆、第一版能不能落地",
    emptyText: "我这边还没看到原型。你先把 PRD 和 Figma 发过来，我顺着点一遍，看看哪些地方好做、哪些地方容易做重。",
    ackText: "可以，这样拆就清楚多了。我先做填限制、看冲突和确认方案这三步，每个页面只管一件事，第一版比较好控。",
  },
  manager: {
    speaker: "业务负责人",
    role: "manager",
    focus: "版本目标与优先级",
    emptyText: "我会看第一版到底验证什么。先把 PRD 和 Figma 原型准备好，我们再谈范围是否发散。",
    ackText: "这个版本边界比较清楚。只要第一版能证明用户愿意完成一次共同决策，就可以先不扩展周边能力。",
  },
  participant: {
    speaker: "模拟用户",
    role: "participant",
    focus: "真实使用感受",
    emptyText: "我只从使用者角度看：打开后能不能马上看懂、愿不愿意填、会不会愿意分享。",
    ackText: "这样我更愿意用。不要逼我接受一个总分，直接告诉我冲突在哪里、我要让步什么，我才敢确认。",
  },
};

function getChatProgress(state: ExperienceState, contact: ChatChannel, script?: ChatScript) {
  const progress = state.chatProgress[contact] ?? 0;
  return script ? clamp(progress, 0, script.turns.length) : Math.max(0, progress);
}

function getSentChatInput(state: ExperienceState, contact: ChatChannel, index: number, fallback: string) {
  const sentInput = state.chatSentInputs[contact]?.[index]?.trim();
  return sentInput && sentInput.length > 0 ? sentInput : fallback;
}

function getReviewFeedback(feedbackList: RoleFeedback[], contact: ReviewContact) {
  return feedbackList.find((item) => {
    if (contact === "developer") {
      return item.role.includes("开发");
    }
    if (contact === "manager") {
      return item.role.includes("业务");
    }
    return item.role.includes("用户");
  });
}

function buildMentorScript(state: ExperienceState): ChatScript {
  const pendingIdea = state.chatPending.mentor?.turnIndex === 0 ? state.chatPending.mentor.input : "";
  const ideaInput = normalizeText(pendingIdea || state.chatSentInputs.mentor?.[0] || state.idea, MENTOR_DEFAULT_IDEA);
  const productPath = state.productPath ?? inferProductPath(ideaInput);
  const directionDraft = createDirectionDraft(ideaInput, productPath);
  const painPoint = state.painPoint || directionDraft.painPoint;
  const reviewSteps = getDocReviewSteps(productPath);
  const directionTurns: ChatScriptTurn[] = productPath === "solo"
    ? [
        {
          input: ideaInput,
          userTime: "09:14",
          replies: [
            {
              speaker: "Mentor",
              role: "mentor",
              text: `你判断的根因是：${painPoint}。也就是说，你不准备让所有人继续讨论到完全同意，而是先给一个人明确的决策责任，对吗？`,
              time: "09:16",
            },
          ],
        },
        {
          input: "对。小组先把预算、最晚返程和活动半径定成共同边界，然后每周轮一个主理人，在边界内直接发布计划。",
          userTime: "09:17",
          replies: [
            {
              speaker: "Mentor",
              role: "mentor",
              text: "这和共识工具是两套机制。第一版就盯住责任交接：谁接棒、能决定什么、其他人怎么轻量回应、到点怎么锁定。别又做成一轮投票。",
              time: "09:18",
            },
          ],
        },
        {
          input: "好，我先把共同边界、主理人轮值、发布一个计划、成员响应和截止锁定写成一版 PRD。",
          userTime: "09:19",
          replies: [
            {
              speaker: "Mentor",
              role: "mentor",
              text: "行。记住这版要验证的不是大家喜不喜欢“主理人”这个名字，而是责任明确后，计划能不能更快发布和锁定，同时又不让其他成员觉得被强迫。写完发我。",
              time: "09:20",
            },
          ],
        },
      ]
    : [
        {
          input: ideaInput,
          userTime: "09:14",
          replies: [
            {
              speaker: "Mentor",
              role: "mentor",
              text: `我大概明白了。真正麻烦的不是“去哪”，而是${painPoint}。比如有人必须七点前回来，有人预算不能过一百。你想先解决的是这个，对吗？`,
              time: "09:16",
            },
          ],
        },
        {
          input: "对。我想先让大家把不能退的条件和可以商量的地方说清楚，再去看方案。",
          userTime: "09:17",
          replies: [
            {
              speaker: "Mentor",
              role: "mentor",
              text: "那就顺了。攻略库、优惠这些先放一边。先把三件事做出来：每个人私下填限制、把冲突摆到桌面上、最后确认一个大家都能接受的方案。",
              time: "09:18",
            },
          ],
        },
        {
          input: "好，我先按这个写一版 PRD，把暂时不做的东西也列出来。",
          userTime: "09:19",
          replies: [
            {
              speaker: "Mentor",
              role: "mentor",
              text: "行。先出一版，别急着画页面。写完发我，我帮你看看目标有没有说清、范围会不会太大、指标和验收能不能真的用。",
              time: "09:20",
            },
          ],
        },
      ];

  return {
    intro: [
      {
        speaker: "Mentor",
        role: "mentor",
        text: "早，我看了 Lynn 那封邮件。现在只有一个问题：朋友在群里聊很久还是定不下来。你觉得根因更像哪一个，是大家看不清冲突，还是每个人都能提意见、却没人负责收敛？",
        time: "09:12",
      },
    ],
    turns: [
      ...directionTurns,
      ...(state.prdDraft
        ? [
            {
              input: `📎 PRD Draft v1.pm-doc\nv1 我放这儿了。你帮我看看目标和范围有没有跑偏，指标、验收有没有明显缺口。`,
              userTime: "10:02",
              replies: [
                {
                  speaker: "Mentor",
                  role: "mentor" as const,
                  text: "看完了，方向没跑偏。不过有四个地方如果现在不改，后面画原型时大概率还得返工。",
                  time: "10:07",
                },
                ...reviewSteps.map((step, index) => ({
                  speaker: "Mentor",
                  role: "mentor" as const,
                  text: `${step.comment}${index === reviewSteps.length - 1 ? " 你先回 Docs 按这四处改，改完我们再看页面。" : ""}`,
                  time: `10:${8 + index < 10 ? `0${8 + index}` : 8 + index}`,
                })),
              ],
            },
          ]
        : []),
    ],
  };
}

function buildReviewContactScript(state: ExperienceState, contact: ReviewContact): ChatScript {
  const hasFlow = state.flowNodes.length > 0 || state.prototypeScreens.length > 0;
  const direction = state.productDirection || "第一版周末出行产品";
  const config = REVIEW_CONTACT_CONFIG[contact];
  const soloMode = getProductPath(state) === "solo";

  if (!hasFlow) {
    return {
      intro: [
        {
          speaker: config.speaker,
          role: config.role,
          text: `我这边还没看到 PRD 和 Figma 原型。${config.emptyText}`,
          time: "11:06",
        },
      ],
      turns: [],
    };
  }

  if (contact === "manager" && (!state.prototypeEdited || !state.prototypePreviewed)) {
    return {
      intro: [
        {
          speaker: "业务负责人",
          role: "manager",
          text: "我会等你把低保真原型走通一遍再发测试结果。先在 Figma 修改一个 Frame，并用 Present 模式完成一次点击体验。",
          time: "13:52",
        },
      ],
      turns: [],
    };
  }

  if (contact === "manager") {
    if (soloMode) {
      return {
        intro: [
          {
            speaker: "业务负责人",
            role: "manager",
            text: "我们刚让 20 组学生用“周末主理人”原型安排一次周末活动，关键漏斗出来了。共同边界和主理人发布都能走通，但计划还是没有顺利锁定。",
            time: "14:02",
          },
          {
            speaker: "业务负责人",
            role: "manager",
            text: "📊 灰度测试数据（20 组）\n共同边界设置率 81%｜主理人发布率 74%｜成员按时响应率 46%｜计划按时锁定率 38%\n录屏里很多成员看完计划后没有点任何按钮：有人不想参加，但担心“跳过”等于扫兴；也有人以为不回复会被默认算作参加。响应规则是当前最大的流失点。",
            time: "14:03",
          },
        ],
        turns: [
          {
            input: "我看到数据了。主理人能发布计划，问题出在其他成员不敢表态。我准备把响应改成能参加、本周跳过和边界否决；未响应者不默认参加，截止后只为已响应成员锁定行程，并补上换主理人兜底。",
            userTime: "14:06",
            replies: [
              {
                speaker: "业务负责人",
                role: "manager",
                text: "判断对。先只调整响应与锁定规则，不要顺手加群聊。下一轮重点看成员按时响应率能否从 46% 提升到 80%，计划锁定率能否从 38% 提升到 60%。",
                time: "14:08",
              },
            ],
          },
        ],
      };
    }

    return {
      intro: [
        {
          speaker: "业务负责人",
          role: "manager",
          text: "我们刚把可用原型给 20 组学生做了小范围测试，数据出来了。有一个功能的表现明显低于预期，我把关键漏斗发你。",
          time: "14:02",
        },
        {
          speaker: "业务负责人",
          role: "manager",
          text: "📊 灰度测试数据（20 组）\n计划创建完成率 72%｜约束提交率 68%｜可接受方案确认率 42%｜达成共识耗时 23 分钟\n录屏里成员大多完成了私下填写，却在方案卡前重新争论：他们看不见哪些是共同点、谁需要牺牲什么，也不知道不同意时该怎么提出替代。共识确认是当前最大的流失点。",
          time: "14:03",
        },
      ],
      turns: [
        {
          input:
            "我看到数据了。约束提交率已经接近目标，真正的问题是大家不知道方案的冲突和妥协成本。我准备在 Figma 把共识方案卡改成共同点、冲突摘要、个人妥协成本，并提供接受、提出替代或否决原因的入口。",
          userTime: "14:06",
          replies: [
            {
              speaker: "业务负责人",
              role: "manager",
              text: "判断对。先只调整这个功能，不要顺手重做整条流程。请在 Figma 更新共识方案页，保留邀请失败时重新复制链接的兜底。下一轮重点看可接受方案确认率能否从 42% 提升到 60%，达成共识耗时能否从 23 分钟降到 15 分钟以内。",
              time: "14:08",
            },
          ],
        },
      ],
    };
  }

  const feedbackList = state.teamFeedback.length > 0 ? state.teamFeedback : createRoleFeedback(state);
  const feedback = getReviewFeedback(feedbackList, contact);
  const feedbackText = feedback
    ? contact === "developer"
      ? `我刚顺着原型点了一遍。${feedback.value}${feedback.concern}${feedback.suggestion}`
      : `我只看${config.focus}。价值：${feedback.value} 担心：${feedback.concern} 建议：${feedback.suggestion}`
    : contact === "developer"
      ? "文件我收到了。你告诉我最想确认哪一段，我先从实现上帮你过一遍。"
      : "我看到了。你先发起一次反馈请求，我会只针对我的角色给出价值、担心和建议。";

  return {
    intro: [
      {
        speaker: config.speaker,
        role: config.role,
        text: contact === "developer"
          ? "文件我收到了。你最担心哪一段？我先顺着流程点一遍，看看页面怎么拆、哪些地方容易做重。"
          : soloMode
            ? "我看到共享文件了。你发我一句想让我重点看的地方，我会从成员角度看看主理人机制会不会让人有压力、响应是不是足够轻。"
            : "我看到共享文件了。你发我一句想让我重点看的地方，我按我的角色看它是否真的帮助成员理解冲突并达成共识。",
        time: "11:05",
      },
    ],
    turns: [
      {
        input: `我把「${direction}」的 PRD 和 Figma 原型同步给你了，想听你对${config.focus}的看法。`,
        userTime: "11:14",
        replies: [
          {
            speaker: config.speaker,
            role: config.role,
            text: feedbackText,
            time: "11:16",
          },
        ],
      },
      {
        input: normalizeText(state.iterationInput, soloMode ? SOLO_ITERATION_DEFAULT_REPLY : ITERATION_DEFAULT_REPLY),
        userTime: "11:22",
        replies: [
          {
            speaker: config.speaker,
            role: config.role,
            text: soloMode
              ? contact === "developer"
                ? "可以，这样拆我就清楚了。我先把小组成员、主理人和未响应者三种状态做通，再处理截止锁定和换人。群聊、推荐和预订这版都先不接。"
                : "这样我会更愿意回应。本周不想去就让我直接跳过，不要影响其他人；只有计划越过大家事先约好的底线时，我才需要说明否决原因。"
              : config.ackText,
            time: "11:24",
          },
        ],
      },
    ],
  };
}

function buildChatScript(state: ExperienceState, contact: ChatChannel): ChatScript {
  return contact === "mentor" ? buildMentorScript(state) : buildReviewContactScript(state, contact);
}

function buildVisibleChatThread(state: ExperienceState, contact: ChatChannel): ChatMessage[] {
  const script = buildChatScript(state, contact);
  const progress = getChatProgress(state, contact, script);
  const completedTurns = script.turns.slice(0, progress).flatMap((turn, index) => [
    {
      speaker: "你",
      role: "user" as const,
      text: getSentChatInput(state, contact, index, turn.input),
      time: turn.userTime,
    },
    ...turn.replies,
  ]);

  return [...script.intro, ...completedTurns];
}

function getNextChatInput(state: ExperienceState, contact: ChatChannel) {
  const script = buildChatScript(state, contact);
  const progress = getChatProgress(state, contact, script);
  return script.turns[progress]?.input ?? "";
}

function buildExportMarkdown(state: ExperienceState) {
  const prd = state.prdDraft ?? createPrdDraft(state, normalizeText(state.featuresInput, getDefaultFeaturesInput(getProductPath(state)))).prdDraft;
  const soloMode = getProductPath(state) === "solo";
  const testDataLines = soloMode
    ? [
        "- 灰度样本：20 组学生",
        "- 共同边界设置率：81%（目标 75%）",
        "- 主理人发布率：74%（目标 70%）",
        "- 成员按时响应率：46%（目标 80%）",
        "- 计划按时锁定率：38%（目标 60%）",
        `- 调整结果：${state.dataIterationApplied ? "成员响应改成能参加、本周跳过和边界否决；未响应者不默认参加，并补充换主理人与保底计划。" : "待根据数据调整"}`,
      ]
    : [
        "- 灰度样本：20 组学生",
        "- 计划创建完成率：72%",
        "- 约束提交率：68%（目标 70%）",
        "- 可接受方案确认率：42%（目标 60%）",
        "- 达成共识耗时：23 分钟（目标 15 分钟）",
        `- 调整结果：${state.dataIterationApplied ? DATA_ITERATION_DECISION : "待根据数据调整"}`,
      ];
  const lines = [
    "# 产品经理职业体验 Demo 输出",
    "",
    "## PRD Draft",
    "",
    "### 产品方向",
    prd.goal,
    "",
    "### 背景",
    prd.background,
    "",
    "### 目标",
    prd.objective,
    "",
    "### 目标用户",
    prd.users,
    "",
    "### 核心痛点",
    prd.pain,
    "",
    "### 典型场景",
    prd.scenario,
    "",
    "### 成功指标",
    ...prd.successMetrics.map((item) => `- ${item.name}：${item.target}`),
    "",
    "### MVP 范围",
    ...prd.scope.map((item) => `- ${item}`),
    "",
    "### 用户故事",
    ...prd.userStories.map((item) => `- ${item}`),
    "",
    "### 功能需求与验收标准",
    ...prd.requirements.flatMap((item) => [
      `- ${item.title}：${item.description}`,
      ...item.acceptance.map((acceptance) => `  - ${acceptance}`),
    ]),
    "",
    "### 暂不做",
    ...prd.outOfScope.map((item) => `- ${item}`),
    "",
    "### 风险",
    ...prd.risks.map((item) => `- ${item}`),
    "",
    "## 用户流程",
    state.flowNodes.length ? state.flowNodes.join(" -> ") : "待生成",
    "",
    "## 低保真原型",
    ...(state.prototypeScreens.length
      ? state.prototypeScreens.map((screen) => `- ${screen.name}：${screen.purpose}`)
      : ["- 待生成"]),
    "",
    "## 迭代决策",
    ...(state.iterationDecisions.length
      ? state.iterationDecisions.map((item) => `- ${item}`)
      : ["- 待生成"]),
    "",
    "## 测试数据与功能调整",
    ...(state.businessTestReceived ? testDataLines : ["- 待接收业务测试数据"]),
    "",
    "## 职业体验总结",
    ...(state.finalSummary.length ? state.finalSummary.map((item) => `- ${item}`) : ["- 待生成"]),
    "",
  ];

  return lines.join("\n");
}

function getAppNudge(state: ExperienceState): AppNudge | null {
  const mentorProgress = state.chatProgress.mentor ?? 0;
  const reviewSteps = getDocReviewSteps(getProductPath(state));
  const nudge = (appId: AppId, text: string): AppNudge | null =>
    state.activeApp === appId ? null : { appId, text };

  if (state.currentStage === 0) {
    return nudge("chat", "邮件看完了，去 Chat 找 Mentor");
  }

  if (!state.prdDraft) {
    if (mentorProgress < MENTOR_DIRECTION_TURN_COUNT) {
      return nudge("chat", "Mentor 还在等你的回复");
    }

    return nudge("doc", "方向确认好了，去生成 PRD v1");
  }

  if (!hasMentorPrdFeedback(state)) {
    return nudge("chat", "Draft v1 已就绪，发给 Mentor 看看");
  }

  if (state.docReviewProgress < reviewSteps.length) {
    return nudge(
      "doc",
      `Mentor 发来意见，回 Docs 修改 ${state.docReviewProgress}/${reviewSteps.length}`,
    );
  }

  if (state.currentStage < 3) {
    return nudge("flow", "PRD v2 完成，可以开始画流程了");
  }

  if (state.flowNodes.length === 0 && state.prototypeScreens.length === 0) {
    return nudge("flow", "Figma 还在等你生成低保真稿");
  }

  if (!state.prototypeEdited) {
    return nudge("flow", "在 Figma 选择一个 Frame，动手修改图层");
  }

  if (!state.prototypePreviewed) {
    return nudge("flow", "原型已编辑，进入 Present 点击体验一次");
  }

  if (!state.businessTestReceived) {
    return nudge("chat", "业务部门发来一份灰度测试数据");
  }

  if (!state.dataIterationApplied) {
    return nudge(
      "flow",
      getProductPath(state) === "solo"
        ? "测试显示成员不敢响应，去调整跳过、否决与未响应规则"
        : "测试数据显示共识确认卡需要调整，去补充冲突与妥协成本",
    );
  }

  if (state.currentStage < 4) {
    return nudge("final", "数据迭代已完成，查看本次交付");
  }

  return null;
}

function OfficeApp({ onExit }: { onExit?: () => void }) {
  const [state, setState] = useState<ExperienceState>(() => loadState());
  const [copyState, setCopyState] = useState("复制交付物");
  const chatReplyTimers = useRef<Partial<Record<ChatChannel, number>>>({});

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!state.toast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setState((previous) => ({ ...previous, toast: null }));
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [state.toast]);

  useEffect(
    () => () => {
      Object.values(chatReplyTimers.current).forEach((timer) => {
        if (timer !== undefined) {
          window.clearTimeout(timer);
        }
      });
    },
    [],
  );

  function patchState(updater: (previous: ExperienceState) => ExperienceState) {
    setState((previous) => stamp(updater(previous)));
  }

  function setActiveApp(appId: AppId) {
    const target = APPS.find((app) => app.id === appId);
    if (!target) {
      return;
    }

    patchState((previous) => {
      const nudge = getAppNudge(previous);
      const unlocked = target.stageIndex <= previous.currentStage;
      const followsNudge = nudge?.appId === appId;

      if (!unlocked && !followsNudge) {
        return {
          ...previous,
          toast: "这个应用还没有新任务",
        };
      }

      let nextState: ExperienceState = {
        ...previous,
        activeApp: appId,
        toast: `正在打开 ${target.label}`,
      };

      if (appId === "chat" && previous.currentStage < 1) {
        nextState.currentStage = 1;
      }

      if (appId === "doc" && previous.currentStage < 2) {
        const idea = normalizeText(previous.idea, MENTOR_DEFAULT_IDEA);
        const productPath = previous.productPath ?? inferProductPath(idea);
        const direction = createDirectionDraft(idea, productPath);
        nextState = {
          ...nextState,
          idea,
          productPath,
          productDirection: direction.productDirection,
          targetUser: direction.targetUser,
          painPoint: direction.painPoint,
          firstValue: direction.firstValue,
          currentStage: 2,
        };
      }

      if (appId === "flow" && previous.currentStage < 3) {
        const input = normalizeText(previous.featuresInput, getDefaultFeaturesInput(getProductPath(previous)));
        const draft = createPrdDraft(previous, input);
        nextState = {
          ...nextState,
          featuresInput: input,
          coreFeatures: draft.coreFeatures,
          laterFeatures: draft.laterFeatures,
          prdDraft: draft.prdDraft,
          currentStage: 3,
        };
      }

      if (appId === "final" && previous.currentStage < 4) {
        const soloMode = getProductPath(previous) === "solo";
        const iterationInput = normalizeText(
          previous.iterationInput,
          soloMode
            ? SOLO_ITERATION_DEFAULT_REPLY
            : "我想保留轻量参与，但把朋友端改成私下提交硬性限制和可妥协偏好。共识方案重点显示共同点、冲突、妥协成本，并允许接受、提出替代或说明否决原因。",
        );
        const iterationDecisions = uniqueList([
          ...previous.iterationDecisions,
          ...createIterationDecisions(previous, iterationInput),
        ]);
        const finalSummary = createFinalSummary({
          ...previous,
          iterationInput,
          iterationDecisions,
        });
        nextState = {
          ...nextState,
          iterationInput,
          iterationDecisions,
          finalSummary,
          currentStage: 4,
        };
      }

      return nextState;
    });
  }

  function completeChatReply(contact: ChatChannel) {
    patchState((previous) => {
      const pending = previous.chatPending[contact];
      if (!pending) {
        return previous;
      }

      const script = buildChatScript(previous, contact);
      const progress = pending.turnIndex;
      const nextTurn = script.turns[progress];

      if (!nextTurn) {
        const chatPending = { ...previous.chatPending };
        delete chatPending[contact];
        return {
          ...previous,
          chatPending,
        };
      }

      const sentText = pending.input;
      const chatPending = { ...previous.chatPending };
      delete chatPending[contact];

      const baseState: ExperienceState = {
        ...previous,
        chatProgress: {
          ...previous.chatProgress,
          [contact]: Math.max(previous.chatProgress[contact] ?? 0, progress + 1),
        },
        chatPending,
      };

      if (contact === "mentor") {
        const idea = progress === 0 ? sentText : normalizeText(previous.idea, MENTOR_DEFAULT_IDEA);
        const productPath = progress === 0 ? inferProductPath(sentText) : getProductPath(previous);
        const draft = createDirectionDraft(idea, productPath);
        const isPrdReviewTurn = Boolean(previous.prdDraft) && progress >= MENTOR_DIRECTION_TURN_COUNT;

        return {
          ...baseState,
          idea,
          productPath,
          productDirection: draft.productDirection,
          targetUser: draft.targetUser,
          painPoint: draft.painPoint,
          firstValue: draft.firstValue,
          toast: isPrdReviewTurn
            ? "Mentor 已发来详细修改意见"
            : progress + 1 >= script.turns.length
              ? "方向对话已完成"
              : "Mentor 已回复",
        };
      }

      const config = REVIEW_CONTACT_CONFIG[contact];
      const feedback = previous.teamFeedback.length > 0 ? previous.teamFeedback : createRoleFeedback(previous);
      const isDecisionTurn = progress > 0;

      return {
        ...baseState,
        teamFeedback: feedback,
        businessTestReceived: contact === "manager" ? true : previous.businessTestReceived,
        iterationInput: contact === "manager" || isDecisionTurn ? sentText : previous.iterationInput,
        iterationDecisions: isDecisionTurn
          ? uniqueList([...previous.iterationDecisions, ...createIterationDecisions(previous, sentText)])
          : previous.iterationDecisions,
        toast:
          contact === "manager"
            ? "业务测试数据已收到"
            : progress + 1 >= script.turns.length
              ? `${config.speaker} 对话已完成`
              : `${config.speaker} 已回复`,
      };
    });

    delete chatReplyTimers.current[contact];
  }

  function sendChatMessage(contact: ChatChannel, message: string) {
    if (state.chatPending[contact]) {
      return;
    }

    const script = buildChatScript(state, contact);
    const progress = getChatProgress(state, contact, script);
    const nextTurn = script.turns[progress];
    if (!nextTurn) {
      return;
    }

    const sentText = normalizeText(message, nextTurn.input);
    patchState((previous) => {
      if (previous.chatPending[contact]) {
        return previous;
      }

      const contactInputs = [...(previous.chatSentInputs[contact] ?? [])];
      contactInputs[progress] = sentText;

      return {
        ...previous,
        chatSentInputs: {
          ...previous.chatSentInputs,
          [contact]: contactInputs,
        },
        chatPending: {
          ...previous.chatPending,
          [contact]: {
            turnIndex: progress,
            input: sentText,
          },
        },
        toast: null,
      };
    });

    const existingTimer = chatReplyTimers.current[contact];
    if (existingTimer !== undefined) {
      window.clearTimeout(existingTimer);
    }
    const replyDelay = 1100 + Math.floor(Math.random() * 500);
    chatReplyTimers.current[contact] = window.setTimeout(() => completeChatReply(contact), replyDelay);
  }

  function generatePrd(generationInput: string) {
    patchState((previous) => {
      const input = normalizeText(
        previous.featuresInput,
        getDefaultFeaturesInput(getProductPath(previous)),
      );
      const normalizedGenerationInput = normalizeText(generationInput, DEFAULT_DOC_GENERATION_INPUT);
      const draft = createPrdDraft(previous, input);

      return {
        ...previous,
        featuresInput: input,
        docGenerationInput: normalizedGenerationInput,
        coreFeatures: draft.coreFeatures,
        laterFeatures: draft.laterFeatures,
        prdDraft: draft.prdDraft,
        toast: previous.prdDraft ? "PRD 已更新" : "PRD 第一版草稿已生成",
      };
    });
  }

  function applyDocReview(revisionInput: string) {
    patchState((previous) => {
      if (!hasMentorPrdFeedback(previous)) {
        return {
          ...previous,
          toast: "先在 Chat 中把 PRD v1 发给 Mentor",
        };
      }

      const reviewSteps = getDocReviewSteps(getProductPath(previous));
      const progress = clamp(previous.docReviewProgress, 0, reviewSteps.length);
      const step = reviewSteps[progress];

      if (!step) {
        return previous;
      }

      const appliedInput = normalizeText(revisionInput, step.input);
      const docReviewInputs = [...previous.docReviewInputs];
      docReviewInputs[progress] = appliedInput;
      const featuresInput = appendDocRevisionInput(previous.featuresInput, appliedInput);
      const nextReviewProgress = progress + 1;
      const draft = createPrdDraft(
        {
          ...previous,
          docReviewProgress: nextReviewProgress,
        },
        featuresInput,
      );

      return {
        ...previous,
        featuresInput,
        coreFeatures: draft.coreFeatures,
        laterFeatures: draft.laterFeatures,
        prdDraft: draft.prdDraft,
        docReviewProgress: nextReviewProgress,
        docReviewInputs,
        toast:
          nextReviewProgress >= reviewSteps.length
            ? "PRD Copilot 已生成 Draft v2"
            : `PRD Copilot 已生成修改 ${nextReviewProgress}/${reviewSteps.length}`,
      };
    });
  }

  function generateFlowAndPrototype() {
    patchState((previous) => {
      const soloMode = getProductPath(previous) === "solo";
      const input = normalizeText(
        previous.flowInput,
        soloMode
          ? "小组先建立共同边界并轮换主理人；主理人在边界内发布一个计划，成员轻量选择参加、跳过或边界否决，截止后锁定行程。"
          : "用户先创建计划，再邀请成员私下提交硬性限制与可妥协偏好，系统展示共同点和冲突，生成带妥协说明的方案，最后确认共同计划。",
      );
      const draft = createFlowAndPrototype(previous, input);

      return {
        ...previous,
        flowInput: input,
        flowNodes: draft.flowNodes,
        prototypeScreens: linkPrototypeScreens(draft.prototypeScreens),
        prototypeEdited: false,
        prototypePreviewed: false,
        dataIterationApplied: previous.businessTestReceived ? false : previous.dataIterationApplied,
        toast: previous.businessTestReceived ? "原型已重新生成，请重新应用测试数据调整" : "流程与原型已生成",
      };
    });
  }

  function updatePrototypeScreen(index: number, updates: Partial<PrototypeScreen>) {
    patchState((previous) => {
      const oldName = previous.prototypeScreens[index]?.name;
      const nextName = updates.name?.trim() || oldName;

      return {
        ...previous,
        prototypeScreens: previous.prototypeScreens.map((screen, screenIndex) => {
          if (screenIndex === index) {
            return { ...screen, ...updates, name: nextName || screen.name };
          }
          return oldName && nextName && screen.nextScreen === oldName
            ? { ...screen, nextScreen: nextName }
            : screen;
        }),
        prototypeEdited: true,
        toast: "Frame 已更新",
      };
    });
  }

  function markPrototypePreviewed() {
    patchState((previous) => ({
      ...previous,
      prototypePreviewed: true,
      toast: "Prototype Present 已开始",
    }));
  }

  function applyDataIteration() {
    patchState((previous) => {
      if (!previous.businessTestReceived) {
        return {
          ...previous,
          toast: "请先查看业务部门发来的测试数据",
        };
      }

      const soloMode = getProductPath(previous) === "solo";

      if (soloMode) {
        const flowNodes = previous.flowNodes.map((node) =>
          node.includes("成员轻量响应") ? "成员无压力响应" : node,
        );
        const routeIndex = previous.prototypeScreens.findIndex(
          (screen) => screen.name.includes("成员轻量响应") && !screen.name.includes("v2"),
        );
        const routeScreen = previous.prototypeScreens[routeIndex];
        const revisedName = routeScreen ? `${routeScreen.name} / v2` : "成员响应 / v2";
        const revisedScreen: PrototypeScreen = {
          ...(routeScreen ?? {
            name: revisedName,
            purpose: "让成员不承担社交压力也能完成明确响应",
            blocks: [],
            accent: "amber" as Accent,
          }),
          name: revisedName,
          purpose: "根据测试数据重写跳过、否决和未响应规则，提高成员响应率与计划锁定率",
          blocks: ["能参加", "本周跳过（不阻塞）", "仅边界否决", "未响应不算参加", "截止与换人兜底"],
        };
        const hasRevisedScreen = previous.prototypeScreens.some((screen) => screen.name === revisedName);
        const prototypeScreens = hasRevisedScreen
          ? previous.prototypeScreens.map((screen) => (screen.name === revisedName ? revisedScreen : screen))
          : routeIndex >= 0
            ? previous.prototypeScreens.flatMap((screen, index) => {
                const updatedScreen = screen.nextScreen === routeScreen?.name
                  ? { ...screen, nextScreen: revisedName }
                  : screen;
                return index === routeIndex ? [updatedScreen, revisedScreen] : [updatedScreen];
              })
            : [...previous.prototypeScreens, revisedScreen];
        const decision = "根据 20 组灰度测试，把成员响应改成能参加、本周跳过和边界否决；未响应者不默认参加，截止后只为已响应成员锁定，并补上一键换主理人与保底计划。";

        return {
          ...previous,
          flowNodes,
          prototypeScreens,
          prototypeEdited: true,
          dataIterationApplied: true,
          iterationDecisions: uniqueList([...previous.iterationDecisions, decision]),
          toast: "已根据测试数据创建成员响应 v2",
        };
      }

      const flowNodes = previous.flowNodes.map((node) =>
        node.includes("妥协方案") ? "比较透明妥协方案" : node,
      );
      const consensusIndex = previous.prototypeScreens.findIndex(
        (screen) =>
          (screen.name.includes("共识方案") || screen.name.includes("候选路线")) &&
          !screen.name.includes("v2"),
      );
      const consensusScreen = previous.prototypeScreens[consensusIndex];
      const revisedName = consensusScreen ? `${consensusScreen.name} / v2` : "共识方案 / v2";
      const revisedScreen: PrototypeScreen = {
        ...(consensusScreen ?? {
          name: revisedName,
          purpose: "让成员理解冲突并做出有依据的确认",
          blocks: [],
          accent: "amber" as Accent,
        }),
        name: revisedName,
        purpose: "根据测试数据补足共同点、冲突和妥协成本，提高可接受方案确认率",
        blocks: ["共同点", "冲突摘要", "个人妥协成本", "接受 / 替代 / 否决"],
      };
      const hasRevisedScreen = previous.prototypeScreens.some((screen) => screen.name === revisedName);
      const prototypeScreens = hasRevisedScreen
        ? previous.prototypeScreens.map((screen) => (screen.name === revisedName ? revisedScreen : screen))
        : consensusIndex >= 0
          ? previous.prototypeScreens.flatMap((screen, index) => {
              const updatedScreen =
                screen.nextScreen === consensusScreen?.name
                  ? { ...screen, nextScreen: revisedName }
                  : screen;
              return index === consensusIndex ? [updatedScreen, revisedScreen] : [updatedScreen];
            })
          : [...previous.prototypeScreens, revisedScreen];

      return {
        ...previous,
        flowNodes,
        prototypeScreens,
        prototypeEdited: true,
        dataIterationApplied: true,
        iterationDecisions: uniqueList([...previous.iterationDecisions, DATA_ITERATION_DECISION]),
        toast: "已根据测试数据创建共识方案 v2",
      };
    });
  }

  async function copyOutput() {
    const markdown = buildExportMarkdown({
      ...state,
      finalSummary: state.finalSummary.length ? state.finalSummary : createFinalSummary(state),
    });

    try {
      await navigator.clipboard.writeText(markdown);
      setCopyState("已复制");
      window.setTimeout(() => setCopyState("复制交付物"), 1400);
    } catch {
      setCopyState("复制失败");
      window.setTimeout(() => setCopyState("复制交付物"), 1400);
    }
  }

  function downloadOutput() {
    const markdown = buildExportMarkdown({
      ...state,
      finalSummary: state.finalSummary.length ? state.finalSummary : createFinalSummary(state),
    });
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pm-career-experience-output.md";
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetExperience() {
    Object.values(chatReplyTimers.current).forEach((timer) => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    });
    chatReplyTimers.current = {};
    setState(stamp(createDefaultState()));
    setCopyState("复制交付物");
  }

  const activeAppIndex = APPS.findIndex((app) => app.id === state.activeApp);
  const activeApp = activeAppIndex >= 0 ? APPS[activeAppIndex] : APPS[0];
  const appNudge = getAppNudge(state);

  return (
    <div className="office-scene chat-valley-scene">
      <div className="wallpaper" />
      <div className="desk-shadow" aria-hidden="true">
        <span className="desk-face desk-face-top" />
      </div>

      <div className="desk">
        <div className="monitor-shell">
          <div className="monitor-topbar">
            <div className="brand-block">
              {onExit && (
                <button className="career-back-button" type="button" onClick={onExit}>
                  ← 职业大厅
                </button>
              )}
              <span className="brand-pill">
                <span aria-hidden="true">🌾</span>
                Possibility OS
              </span>
              <span className="brand-subtitle">产品工作空间 · 产品经理体验</span>
            </div>

            <div className="status-block" aria-label="系统状态">
              <span>
                <Clock3 size={14} aria-hidden="true" />
                {new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span>
                <span aria-hidden="true">🌱</span>
                春 08 日
              </span>
              <span>
                <span aria-hidden="true">☀️</span>
                晴朗 18°C
              </span>
            </div>
          </div>

          <div className="screen">
            <div className="screen-grid">
              <DesktopColumn
                activeApp={state.activeApp}
                currentStage={state.currentStage}
                nudge={appNudge}
                onOpen={setActiveApp}
              />

              <section className="workspace-pane" aria-label={activeApp.title}>
                <AppWindow accent={activeApp.accent} activeApp={activeApp}>
                  {activeApp.id === "brief" && (
                    <BriefRoom />
                  )}

                  {activeApp.id === "chat" && (
                    <ChatRoom
                      state={state}
                      onSendMessage={sendChatMessage}
                    />
                  )}

                  {activeApp.id === "doc" && (
                    <DocRoom
                      productPath={getProductPath(state)}
                      coreFeatures={state.coreFeatures}
                      laterFeatures={state.laterFeatures}
	                      featuresInput={state.featuresInput}
	                      docGenerationInput={state.docGenerationInput}
	                      prdDraft={state.prdDraft}
	                      mentorFeedbackReady={hasMentorPrdFeedback(state)}
	                      docReviewProgress={state.docReviewProgress}
	                      docReviewInputs={state.docReviewInputs}
	                      onGenerate={generatePrd}
	                      onApplyReview={applyDocReview}
	                    />
                  )}

                  {activeApp.id === "flow" && (
                    <FlowRoom
                      productPath={getProductPath(state)}
                      flowInput={state.flowInput}
                      flowNodes={state.flowNodes}
                      prototypeScreens={state.prototypeScreens}
                      prototypeEdited={state.prototypeEdited}
                      prototypePreviewed={state.prototypePreviewed}
                      businessTestReceived={state.businessTestReceived}
                      dataIterationApplied={state.dataIterationApplied}
                      onChange={(flowInput) => patchState((prev) => ({ ...prev, flowInput }))}
                      onGenerate={generateFlowAndPrototype}
                      onUpdateScreen={updatePrototypeScreen}
                      onPreviewPrototype={markPrototypePreviewed}
                      onApplyDataIteration={applyDataIteration}
                    />
                  )}

                  {activeApp.id === "final" && (
                    <FinalRoom
                      state={state}
                      copyLabel={copyState}
                      onCopy={copyOutput}
                      onDownload={downloadOutput}
                      onRestart={resetExperience}
                    />
                  )}
                </AppWindow>
              </section>

            </div>

            <div className="screen-toast" aria-live="polite">
              {state.toast && <span>{state.toast}</span>}
            </div>
          </div>

          <div className="monitor-stand">
            <div className="monitor-foot" />
          </div>
        </div>

        <div className="desk-objects">
          <div className="keyboard" aria-hidden="true">
            <span className="keyboard-case-face keyboard-case-front" />
            <span className="keyboard-case-face keyboard-case-left" />
            <span className="keyboard-case-face keyboard-case-right" />
            <div className="keyboard-keys">
              {KEYBOARD_ROWS.map((row, rowIndex) => (
                <div className={`keyboard-row keyboard-row-${rowIndex + 1}`} key={rowIndex}>
                  {row.map((label, keyIndex) => (
                    <span
                      className={`keyboard-key ${label === "Space" ? "keyboard-spacebar" : ""} ${
                        ["Tab", "Caps", "Enter", "Ctrl"].includes(label) ? "keyboard-wide-key" : ""
                      }`}
                      key={`${label}-${keyIndex}`}
                    >
                      {label === "Space" ? "" : label}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mouse" />
          <div className="coffee-cup">
            <span />
          </div>
          <div className="sticky-note">
            <Sparkles size={14} aria-hidden="true" />
            <p>PM Lab</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopColumn({
  activeApp,
  currentStage,
  nudge,
  onOpen,
}: {
  activeApp: AppId;
  currentStage: number;
  nudge: AppNudge | null;
  onOpen: (app: AppId) => void;
}) {
  return (
    <aside className="desktop-column" aria-label="桌面软件">
      {APPS.map((app) => {
        const unlocked = app.stageIndex <= currentStage;
        const active = activeApp === app.id;
        const nudged = nudge?.appId === app.id;
        const locked = !unlocked && !nudged;

        return (
          <div className={`desktop-app-slot ${nudged ? "nudged" : ""}`} key={app.id}>
            <button
              className={`desktop-icon ${active ? "active" : ""} ${locked ? "locked" : ""}`}
              onClick={() => onOpen(app.id)}
              aria-pressed={active}
              title={app.subtitle}
              type="button"
            >
              <span className={`desktop-icon-mark ${app.accent}`}>
                {locked ? <Lock size={17} aria-hidden="true" /> : <span aria-hidden="true">{app.glyph}</span>}
              </span>
              <strong>{app.label}</strong>
              <small>{locked ? "未解锁" : app.subtitle}</small>
              {nudged && <span className="icon-badge" />}
            </button>
            {nudged && (
              <div className="desktop-app-nudge" role="status">
                <Sparkles size={13} aria-hidden="true" />
                <span>{nudge.text}</span>
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}

function AppWindow({
  activeApp,
  accent,
  children,
}: {
  activeApp: DesktopApp;
  accent: Accent;
  children: ReactNode;
}) {
  const hasOwnChrome = activeApp.id !== "chat";

  return (
    <section className={`app-window app-${activeApp.id} ${accent} ${hasOwnChrome ? "app-self-chromed" : ""}`}>
      {!hasOwnChrome && (
        <header className="window-topbar">
          <div className="window-controls" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div className="window-title">
            <strong>{activeApp.title}</strong>
            <small>{activeApp.subtitle}</small>
          </div>
        </header>
      )}

      <div className="window-body">{children}</div>
    </section>
  );
}

function BriefRoom() {
  const mails = useMemo(
    () => [
      {
        id: "brief-1",
        sender: "Lynn 项目负责人",
        subject: "周五前把周末群聊决策问题跑通",
        preview: "同一个问题可能有不同根因，先提出假设再选解法。",
        time: "09:12",
        unread: true,
        starred: true,
        folder: "Inbox",
        label: "项目",
        from: "lynn@campus-os.local",
        to: "you@campus-os.local",
        cc: "mentor@campus-os.local",
        body: [
          "早，昨天访谈里几组同学都提到同一个问题：周末想和朋友出去，但群聊里的意见越聊越多，最后常常谁也没有把它变成一个真正能执行的计划。",
          "先别急着定功能。这个问题可能是大家看不清真正的共同点和冲突，也可能是每个人都能提意见、却没人负责收敛。你先找 Mentor，把根因假设和对应解法讲清楚，再选一条跑完整验证。",
          "这周先把核心流程跑通，别一下铺太多功能。周五演示的时候，大家能看明白我们解决什么问题，也能亲手点完一遍就行。",
          "你先找 Mentor 聊十分钟，把用户到底卡在哪说清楚。PRD 出来后发他看一眼，再去 Figma 画页面。中间也找开发和业务过一下，别到最后才发现做不动或者方向不对。",
          "最后把 PRD、原型、测试结果和改动原因放进交付文件夹。周五我主要看这几样。",
        ],
        attachments: ["Friday review brief.pdf", "user-notes.md"],
      },
      {
        id: "brief-2",
        sender: "运营同学",
        subject: "本周演示排期",
        preview: "周五下午留出 20 分钟演示窗口，附带技术说明。",
        time: "08:41",
        unread: false,
        starred: false,
        folder: "Inbox",
        label: "日程",
        from: "ops@campus-os.local",
        to: "you@campus-os.local",
        body: [
          "演示会在周五下午进行，前 10 分钟讲产品方向，后面展示可交付结果。",
          "邮件附件里有时间安排和展示要求。",
        ],
        attachments: ["Schedule.ics", "Demo checklist.pdf"],
      },
      {
        id: "brief-3",
        sender: "设计支持",
        subject: "页面资产已放到共享盘",
        preview: "图标、配色和基础组件都已经整理好。",
        time: "昨天",
        unread: false,
        starred: false,
        folder: "Shared",
        label: "资源",
        from: "design@campus-os.local",
        to: "you@campus-os.local",
        body: [
          "共享盘里已经放好用于 Demo 的基础页面资产，便于你后面快速拼出产品界面。",
          "如果要做视觉微调，可以直接基于这些资产继续。",
        ],
        attachments: ["assets.zip"],
      },
    ],
    [],
  );
  const [selectedId, setSelectedId] = useState(mails[0].id);
  const selectedMail = mails.find((mail) => mail.id === selectedId) ?? mails[0];

  return (
    <div className="room-layout brief-room">
      <section className="mail-app-shell">
        <header className="mail-topbar">
          <div className="mail-brand">
            <button className="mail-icon-button" type="button" aria-label="返回列表">
              <ChevronDown size={16} aria-hidden="true" />
            </button>
            <div className="mail-brand-copy">
              <strong>Mail</strong>
              <small>campus-os.local</small>
            </div>
          </div>

          <label className="mail-searchbar">
            <Search size={16} aria-hidden="true" />
            <input type="text" value="Search mail" readOnly aria-label="Search mail" />
          </label>

          <div className="mail-toolbar">
            <button className="mail-icon-button" type="button" aria-label="Archive">
              <Archive size={16} aria-hidden="true" />
            </button>
            <button className="mail-icon-button" type="button" aria-label="Star">
              <Star size={16} aria-hidden="true" />
            </button>
            <button className="mail-icon-button" type="button" aria-label="More">
              <MoreHorizontal size={16} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="mail-shell">
          <aside className="mail-sidebar">
            <button className="mail-compose-button" type="button">
              <Plus size={16} aria-hidden="true" />
              New message
            </button>

            <div className="mail-folders">
              <span className="active">
                <Inbox size={16} aria-hidden="true" />
                Inbox
                <strong>12</strong>
              </span>
              <span>
                <Star size={16} aria-hidden="true" />
                Starred
                <strong>3</strong>
              </span>
              <span>
                <Reply size={16} aria-hidden="true" />
                Sent
              </span>
              <span>
                <Archive size={16} aria-hidden="true" />
                Archive
              </span>
              <span>
                <FileText size={16} aria-hidden="true" />
                Drafts
              </span>
            </div>
          </aside>

          <section className="mail-list-pane">
            <div className="mail-list-head">
              <p className="eyebrow">Inbox</p>
              <strong>3 conversations</strong>
            </div>
            <div className="mail-list">
              {mails.map((mail) => {
                const active = mail.id === selectedId;

                return (
                  <button
                    className={`mail-item ${active ? "active" : ""}`}
                    key={mail.id}
                    onClick={() => setSelectedId(mail.id)}
                    type="button"
                  >
                    <div className="mail-item-head">
                      <div className={`mail-avatar ${active ? "teal" : "amber"}`}>
                        {mail.sender.slice(0, 1)}
                      </div>
                      <div className="mail-item-meta">
                        <strong>{mail.sender}</strong>
                        <span>{mail.label}</span>
                      </div>
                    </div>
                    <strong className="mail-subject">{mail.subject}</strong>
                    <p>{mail.preview}</p>
                    <div className="mail-item-foot">
                      <span>{mail.time}</span>
                      {mail.starred && <Star size={14} aria-hidden="true" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <main className="mail-reader">
            <div className="mail-reader-head">
              <div>
                <p className="eyebrow">{selectedMail.folder}</p>
                <h2>{selectedMail.subject}</h2>
              </div>

              <div className="mail-reader-actions">
                <button className="mail-icon-button" type="button" aria-label="Reply">
                  <Reply size={16} aria-hidden="true" />
                </button>
                <button className="mail-icon-button" type="button" aria-label="Archive">
                  <Archive size={16} aria-hidden="true" />
                </button>
                <button className="mail-icon-button" type="button" aria-label="More">
                  <MoreHorizontal size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mail-envelope-meta">
              <div>
                <span>From</span>
                <strong>{selectedMail.sender} &lt;{selectedMail.from}&gt;</strong>
              </div>
              <div>
                <span>To</span>
                <strong>{selectedMail.to}</strong>
              </div>
              <div>
                <span>CC</span>
                <strong>{selectedMail.cc || "-"}</strong>
              </div>
              <div>
                <span>Time</span>
                <strong>{selectedMail.time}</strong>
              </div>
            </div>

            <div className="mail-body">
              {selectedMail.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mail-attachment-row">
              {selectedMail.attachments.map((attachment) => (
                <span className="mail-attachment" key={attachment}>
                  <Paperclip size={14} aria-hidden="true" />
                  {attachment}
                </span>
              ))}
            </div>

            <div className="mail-reader-footer">
              <button className="secondary-button" type="button">
                <Archive size={18} aria-hidden="true" />
                Archive
              </button>
            </div>
          </main>
        </div>
      </section>
    </div>
  );
}

function ChatRoom({
  state,
  onSendMessage,
}: {
  state: ExperienceState;
  onSendMessage: (contact: ChatChannel, message: string) => void;
}) {
  const hasFlowContext = state.flowNodes.length > 0 || state.prototypeScreens.length > 0;
  const mentorFeedbackReady = hasMentorPrdFeedback(state);
  const [channel, setChannel] = useState<ChatChannel>("mentor");
  const [composerExpanded, setComposerExpanded] = useState(false);
  const chatThreadRef = useRef<HTMLDivElement>(null);

  const contacts: Array<{
    id: ChatChannel;
    label: string;
    sub: string;
    role: ChatMessage["role"];
    accent: Accent;
    glyph: string;
    hearts: number;
  }> = [
    {
      id: "mentor",
      label: "Mentor",
      sub: state.chatPending.mentor
        ? "正在输入…"
        : mentorFeedbackReady
        ? "PRD 详细反馈已发送"
        : state.prdDraft
          ? "等待评审 PRD v1"
          : (state.chatProgress.mentor ?? 0) > 0
            ? "方向确认中"
            : "PM coach",
      role: "mentor",
      accent: "teal",
      glyph: "🍄",
      hearts: 3,
    },
    {
      id: "developer",
      label: "前端开发",
      sub: state.chatPending.developer
        ? "正在输入…"
        : hasFlowContext ? (state.teamFeedback.length > 0 ? "可交付" : (state.chatProgress.developer ?? 0) > 0 ? "已回复" : "等待发送") : "等待 Figma",
      role: "developer",
      accent: "mint",
      glyph: "🔨",
      hearts: 2,
    },
    {
      id: "manager",
      label: "业务负责人",
      sub: state.chatPending.manager
        ? "正在输入…"
        : hasFlowContext && (!state.prototypeEdited || !state.prototypePreviewed)
          ? "等待 Figma 原型体验"
          : hasFlowContext && !state.businessTestReceived
          ? "新测试数据"
          : state.businessTestReceived
            ? "数据问题已确认"
            : "等待 Figma",
      role: "manager",
      accent: "amber",
      glyph: "🌻",
      hearts: 2,
    },
    {
      id: "participant",
      label: "模拟用户",
      sub: state.chatPending.participant
        ? "正在输入…"
        : hasFlowContext ? (state.teamFeedback.length > 0 ? "可交付" : (state.chatProgress.participant ?? 0) > 0 ? "已回复" : "等待发送") : "等待 Figma",
      role: "participant",
      accent: "coral",
      glyph: "🐥",
      hearts: 1,
    },
  ];
  const activeContact = contacts.find((contact) => contact.id === channel) ?? contacts[0];
  const activePending = state.chatPending[channel];
  const activeScript = useMemo(() => buildChatScript(state, channel), [state, channel]);
  const activeProgress = getChatProgress(state, channel, activeScript);
  const activeThread = useMemo(() => buildVisibleChatThread(state, channel), [state, channel]);
  const nextInput = getNextChatInput(state, channel);
  const [composerDraft, setComposerDraft] = useState(nextInput);
  const isMentor = channel === "mentor";
  const isReviewContact = !isMentor;
  const canSend = !activePending && nextInput.trim().length > 0 && composerDraft.trim().length > 0;
  const composerPlaceholder = nextInput
    ? isMentor
      ? "发送给 Mentor"
      : `发送给${activeContact.label}`
    : isReviewContact && !hasFlowContext
      ? "等待 Product Docs 和 Figma 准备好"
      : isMentor && mentorFeedbackReady
        ? "Mentor 已给出 4 条详细修改意见"
      : "这段对话当前没有新的预填消息";

  useEffect(() => {
    setComposerDraft(nextInput);
    setComposerExpanded(false);
  }, [channel, activeProgress, nextInput]);

  useEffect(() => {
    const thread = chatThreadRef.current;
    if (thread) {
      thread.scrollTop = thread.scrollHeight;
    }
  }, [channel, activeProgress, activePending]);

  return (
    <div className="room-layout chat-room">
      <aside className="chat-sidebar">
        <div className="chat-workspace">
          <p className="eyebrow">产品工作空间</p>
          <strong>橡果信使站</strong>
          <span>把想法送到每一位伙伴手里</span>
        </div>

        <div className="chat-season-card" aria-label="今日天气">
          <span className="chat-season-icon" aria-hidden="true">🌱</span>
          <span>
            <small>春 · 第 8 日</small>
            <strong>晴朗　18°C</strong>
          </span>
        </div>

        <div className="chat-group">
          <p>小镇伙伴</p>
          {contacts.map((contact) => (
            <button
              className={`chat-channel-card ${channel === contact.id ? "active" : ""}`}
              type="button"
              key={contact.id}
              onClick={() => setChannel(contact.id)}
            >
              <span className={`chat-avatar ${contact.accent}`}>
                <span aria-hidden="true">{contact.glyph}</span>
              </span>
              <div>
                <strong>{contact.label}</strong>
                <small>{contact.sub}</small>
              </div>
              <span className="chat-friendship" aria-label={`好感度 ${contact.hearts} 颗心`}>
                {"♥".repeat(contact.hearts)}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <main className="chat-panel">
        <header className="chat-panel-header">
          <div className="chat-channel-title">
            <span className="chat-channel-symbol">
              <span aria-hidden="true">{activeContact.glyph}</span>
            </span>
            <div>
              <strong>{activeContact.label}</strong>
              <small>
                <span className="chat-online-dot" aria-hidden="true" />
                {isMentor ? "在林边小屋里" : activeContact.sub}
              </small>
            </div>
          </div>

          <div className="chat-panel-actions">
            <button className="chat-icon-button" type="button" aria-label="Search">
              <Search size={16} aria-hidden="true" />
            </button>
            <button className="chat-icon-button" type="button" aria-label="More">
              <MoreHorizontal size={16} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="chat-thread" ref={chatThreadRef}>
          <div className="chat-day-divider">
            <span>今日留言</span>
          </div>
          {activeThread.map((message) => (
            <ChatBubble key={`${message.speaker}-${message.time}-${message.text}`} message={message} />
          ))}
          {activePending && (
            <>
              <ChatBubble
                message={{
                  speaker: "你",
                  role: "user",
                  text: activePending.input,
                  time: "刚刚",
                }}
              />
              <ChatTyping speaker={activeContact.label} role={activeContact.role} />
            </>
          )}
        </div>

        <footer
          className={`chat-composer ${composerExpanded ? "expanded" : "collapsed"}`}
          onFocusCapture={() => setComposerExpanded(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setComposerExpanded(false);
            }
          }}
        >
          {isMentor && activeProgress === 0 && !activePending && (
            <div className="chat-path-choices" aria-label="选择产品方向">
              <button
                className={inferProductPath(composerDraft) === "group" ? "active" : ""}
                type="button"
                onClick={() => setComposerDraft(MENTOR_GROUP_IDEA)}
              >
                <span>👥</span>
                <strong>信息不透明</strong>
                <small>看清冲突与妥协成本</small>
              </button>
              <button
                className={inferProductPath(composerDraft) === "solo" ? "active" : ""}
                type="button"
                onClick={() => setComposerDraft(MENTOR_SOLO_IDEA)}
              >
                <span>🗺️</span>
                <strong>没人负责收敛</strong>
                <small>轮值主理人直接发布计划</small>
              </button>
            </div>
          )}
          <div className="chat-format-bar" aria-hidden="true">
            <div className="chat-compose-sign">
              <span>✎</span>
              <strong>写张小纸条</strong>
            </div>
            <button type="button">
              <Bold size={15} />
            </button>
            <button type="button">
              <Italic size={15} />
            </button>
            <button type="button">
              <Paperclip size={15} />
            </button>
            <button type="button">
              <AtSign size={15} />
            </button>
            <button type="button">
              <Smile size={15} />
            </button>
          </div>

          <div className="chat-compose-row">
            <label className="chat-compose-box">
              <span className="sr-only">Compose message</span>
              <textarea
                rows={1}
                value={composerDraft}
                disabled={!nextInput || Boolean(activePending)}
                onChange={(event) => setComposerDraft(event.target.value)}
                placeholder={composerPlaceholder}
              />
            </label>

            <button
              className="primary-button chat-send-button"
              type="button"
              onClick={() => {
                setComposerExpanded(false);
                onSendMessage(channel, composerDraft);
              }}
              disabled={!canSend}
            >
              <SendHorizontal size={18} aria-hidden="true" />
              {activePending ? "等待回复" : "送出"}
            </button>
          </div>

        </footer>
      </main>
    </div>
  );
}

function DocRoom({
  productPath,
  coreFeatures,
  laterFeatures,
  featuresInput,
  docGenerationInput,
  prdDraft,
  mentorFeedbackReady,
  docReviewProgress,
  docReviewInputs,
  onGenerate,
  onApplyReview,
}: {
  productPath: ProductPath;
  coreFeatures: string[];
  laterFeatures: string[];
  featuresInput: string;
  docGenerationInput: string;
  prdDraft: PrdDraft | null;
  mentorFeedbackReady: boolean;
  docReviewProgress: number;
  docReviewInputs: string[];
  onGenerate: (generationInput: string) => void;
  onApplyReview: (revisionInput: string) => void;
}) {
  const title = prdDraft?.goal || (productPath === "solo" ? "周末主理人机制 PRD" : "周末多人共识工具 PRD");
  const visibleScope = coreFeatures.length
    ? coreFeatures
    : productPath === "solo"
      ? ["建立共同边界", "轮换主理人", "发布一个计划", "成员轻量响应", "截止锁定"]
      : ["发起周末计划", "私下提交约束", "查看共同点与冲突", "确认可接受方案"];
  const visibleParkingLot = laterFeatures.length
    ? laterFeatures
    : productPath === "solo"
      ? ["群内聊天", "智能路线推荐", "预订与支付"]
      : ["账号体系", "AA 拆账", "优惠提醒"];
  const reviewSteps = getDocReviewSteps(productPath);
  const reviewProgress = clamp(docReviewProgress, 0, reviewSteps.length);
  const completedReviews = reviewSteps.slice(0, reviewProgress);
  const reviewComplete = mentorFeedbackReady && reviewProgress >= reviewSteps.length;
  const latestCompletedReview = completedReviews[completedReviews.length - 1];
  const [copilotExpanded, setCopilotExpanded] = useState(
    !prdDraft || (mentorFeedbackReady && !reviewComplete),
  );

  useEffect(() => {
    if (!prdDraft || (mentorFeedbackReady && !reviewComplete)) {
      setCopilotExpanded(true);
    }
  }, [prdDraft, mentorFeedbackReady, reviewProgress, reviewComplete]);

  const docStatus = !prdDraft
    ? "Drafting"
    : !mentorFeedbackReady
      ? "Draft v1 · Awaiting Mentor review"
      : reviewComplete
        ? "Draft v2 · Ready for flow"
        : `Copilot revising · ${reviewProgress}/${reviewSteps.length}`;
  return (
    <div className="room-layout doc-room doc-app-shell">
      <header className="doc-app-topbar">
        <div className="doc-file-title">
          <span className="doc-file-icon">
            <FileText size={18} aria-hidden="true" />
          </span>
          <div>
            <strong>PRD Draft.pm-doc</strong>
            <small>{docStatus}</small>
          </div>
        </div>

        <nav className="doc-menu-bar" aria-label="Document menu">
          <button type="button">文件</button>
          <button type="button">编辑</button>
          <button type="button">插入</button>
          <button type="button">评论</button>
          <button type="button">版本记录</button>
        </nav>

        <div className="doc-top-actions">
          <button className="doc-icon-button" type="button" aria-label="Search">
            <Search size={16} aria-hidden="true" />
          </button>
          <button className="doc-share-button" type="button">
            <Users size={16} aria-hidden="true" />
            Share
          </button>
        </div>
      </header>

      <div className="doc-format-toolbar" aria-label="Formatting toolbar">
        <button type="button">
          <RefreshCw size={15} aria-hidden="true" />
        </button>
        <button className="doc-toolbar-select" type="button">
          Normal text
          <ChevronDown size={14} aria-hidden="true" />
        </button>
        <button className="doc-toolbar-select" type="button">
          Inter
          <ChevronDown size={14} aria-hidden="true" />
        </button>
        <button type="button">
          <Bold size={15} aria-hidden="true" />
        </button>
        <button type="button">
          <Italic size={15} aria-hidden="true" />
        </button>
        <button type="button">
          <MessageSquare size={15} aria-hidden="true" />
        </button>
        <span className="doc-toolbar-spacer" />
      </div>

      <div className="doc-workspace">
        <aside className="doc-outline-panel">
          <p className="doc-panel-label">Outline</p>
          <ol className="doc-outline-list">
            <li className="active">Overview</li>
            <li>Target users</li>
            <li>Problem & scenario</li>
            <li>Success metrics</li>
            <li>Requirements</li>
            <li>Out of scope</li>
          </ol>
          <div className="doc-page-meta">
            <span>{reviewComplete ? "Draft v2" : "Draft v1"}</span>
            <span>{visibleScope.length} scope items</span>
            {mentorFeedbackReady && <span>Copilot revisions {reviewProgress}/{reviewSteps.length}</span>}
          </div>
        </aside>

        <main className="doc-page-area">
          <div className="doc-ruler" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>

          <article className="doc-page">
            <p className="doc-label">Product Requirement Document</p>
            <h1>{title}</h1>

            {latestCompletedReview && (
              <aside className="doc-update-banner" key={reviewProgress} aria-live="polite">
                <Sparkles size={17} aria-hidden="true" />
                <div>
                  <strong>Copilot 刚刚更新了文档</strong>
                  <span>{latestCompletedReview.impact}</span>
                  <p>{docReviewInputs[reviewProgress - 1] || latestCompletedReview.input}</p>
                </div>
              </aside>
            )}

            <section className="doc-section-block">
              <h2>1. Overview</h2>
              <p>
                {prdDraft
                  ? prdDraft.goal
                  : "把 Mentor 对话里的产品方向整理成可评审的第一版 PRD。"}
              </p>
              {prdDraft && <p>{prdDraft.background}</p>}
            </section>

            <section className="doc-section-block">
              <h2>2. Target users</h2>
              <p>{prdDraft?.users || "待确认：目标用户、使用场景和触发时机。"}</p>
            </section>

            <section className="doc-section-block">
              <h2>3. Problem & scenario</h2>
              <p>{prdDraft?.pain || "待确认：用户现在为什么会卡住，以及第一版要验证什么。"}</p>
              {prdDraft && <p>{prdDraft.scenario}</p>}
            </section>

            {prdDraft && (
              <>
                <section className="doc-section-block">
                  <h2>4. Objective</h2>
                  <p>{prdDraft.objective}</p>
                </section>

                <section className="doc-section-block">
                  <h2>5. Success metrics</h2>
                  <div className="prd-metric-grid">
                    {prdDraft.successMetrics.map((metric) => (
                      <div key={metric.name}>
                        <strong>{metric.name}</strong>
                        <span>{metric.target}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="doc-section-block">
                  <h2>6. User stories</h2>
                  <ul className="prd-bullet-list">
                    {prdDraft.userStories.map((story) => (
                      <li key={story}>{story}</li>
                    ))}
                  </ul>
                </section>
              </>
            )}

            <section className="doc-section-block">
              <h2>{prdDraft ? "7" : "4"}. Version scope</h2>
              <label className="doc-inline-edit">
                <span>First release notes</span>
                <textarea
                  rows={5}
                  value={featuresInput}
                  readOnly
                  placeholder={productPath === "solo"
                    ? "例如：建立共同边界、轮换主理人、发布一个计划、成员响应、截止锁定。"
                    : "例如：发起计划、私下提交约束、查看冲突、比较妥协方案、确认共同计划。"}
                />
              </label>
            </section>

            {prdDraft && (
              <section className="doc-section-block">
                <h2>8. Functional requirements</h2>
                <div className="prd-requirement-list">
                  {prdDraft.requirements.map((requirement) => (
                    <article key={requirement.title}>
                      <h3>{requirement.title}</h3>
                      <p>{requirement.description}</p>
                      <ul>
                        {requirement.acceptance.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {prdDraft && (
              <section className="doc-section-block">
                <h2>9. Out of scope & risks</h2>
                <div className="prd-two-column">
                  <div>
                    <h3>Out of scope</h3>
                    <ul className="prd-bullet-list">
                      {prdDraft.outOfScope.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3>Risks</h3>
                    <ul className="prd-bullet-list">
                      {prdDraft.risks.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {completedReviews.length > 0 && (
              <section className="doc-section-block doc-revision-log">
                <h2>{prdDraft ? "10" : "5"}. Revision log</h2>
                <ul>
                  {completedReviews.map((step, index) => (
                    <li key={`${step.speaker}-${step.impact}`}>
                      <strong>{index + 1}. {step.impact}</strong>
                      <span>{docReviewInputs[index] || step.input}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>
        </main>

        <aside className="doc-properties-panel">
          <DocCopilot
            prdDraft={prdDraft}
            docGenerationInput={docGenerationInput}
            mentorFeedbackReady={mentorFeedbackReady}
            reviewProgress={reviewProgress}
            reviewSteps={reviewSteps}
            docReviewInputs={docReviewInputs}
            expanded={copilotExpanded}
            onToggleExpanded={() => setCopilotExpanded((current) => !current)}
            onGenerate={onGenerate}
            onApplyReview={onApplyReview}
          />

          <section>
            <div className="doc-panel-head">
              <h3>Properties</h3>
              <MoreHorizontal size={16} aria-hidden="true" />
            </div>
            <dl className="doc-property-list">
              <div>
                <dt>Status</dt>
                <dd>{docStatus}</dd>
              </div>
              <div>
                <dt>Owner</dt>
                <dd>You</dd>
              </div>
              <div>
                <dt>Reviewer</dt>
                <dd>Mentor</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3>Version scope</h3>
            <TagList items={visibleScope} empty="生成后会在这里显示。" />
          </section>

          <section>
            <h3>Parking lot</h3>
            <TagList items={visibleParkingLot} empty="生成后会在这里显示。" muted />
          </section>

        </aside>
      </div>
    </div>
  );
}

function DocCopilot({
  prdDraft,
  docGenerationInput,
  mentorFeedbackReady,
  reviewProgress,
  reviewSteps,
  docReviewInputs,
  expanded,
  onToggleExpanded,
  onGenerate,
  onApplyReview,
}: {
  prdDraft: PrdDraft | null;
  docGenerationInput: string;
  mentorFeedbackReady: boolean;
  reviewProgress: number;
  reviewSteps: DocReviewStep[];
  docReviewInputs: string[];
  expanded: boolean;
  onToggleExpanded: () => void;
  onGenerate: (generationInput: string) => void;
  onApplyReview: (revisionInput: string) => void;
}) {
  const [composerDraft, setComposerDraft] = useState(
    prdDraft ? "" : normalizeText(docGenerationInput, DEFAULT_DOC_GENERATION_INPUT),
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const activeReview = reviewSteps[reviewProgress];
  const completedReviews = reviewSteps.slice(0, reviewProgress);

  useEffect(() => {
    setComposerDraft(
      prdDraft
        ? mentorFeedbackReady
          ? activeReview?.input ?? ""
          : ""
        : normalizeText(docGenerationInput, DEFAULT_DOC_GENERATION_INPUT),
    );
    setIsGenerating(false);
  }, [prdDraft, docGenerationInput, reviewProgress, mentorFeedbackReady, activeReview]);

  function submitCopilotMessage() {
    if (!composerDraft.trim() || isGenerating) {
      return;
    }

    setIsGenerating(true);
    if (!prdDraft) {
      window.setTimeout(() => onGenerate(composerDraft), 650);
      return;
    }

    if (!activeReview) {
      setIsGenerating(false);
      return;
    }

    window.setTimeout(() => onApplyReview(composerDraft), 650);
  }

  return (
    <>
      {expanded && (
        <button
          className="doc-copilot-backdrop"
          type="button"
          aria-label="关闭 Copilot 弹窗"
          onClick={onToggleExpanded}
        />
      )}
      <section className={`doc-copilot-panel ${expanded ? "expanded" : ""}`} aria-label="PRD Copilot">
      <header className="doc-copilot-header">
        <div className="doc-copilot-avatar">
          <Sparkles size={15} aria-hidden="true" />
        </div>
        <div>
          <strong>PRD Copilot</strong>
          <small>{prdDraft ? "把你的话变成下一版 PRD" : "告诉我第一版要怎么写"}</small>
        </div>
        <div className="doc-copilot-header-actions">
          <span className="doc-copilot-status">AI</span>
          <button
            className="doc-copilot-expand"
            type="button"
            onClick={onToggleExpanded}
            aria-label={expanded ? "收起 Copilot" : "放大 Copilot"}
            title={expanded ? "收起" : "放大"}
          >
            {expanded ? "×" : <Monitor size={13} aria-hidden="true" />}
          </button>
        </div>
      </header>

      <div className="doc-copilot-thread">
        <article className="doc-copilot-message assistant">
          <strong>Copilot</strong>
          <p>
            {!prdDraft
              ? "我已经带入你在 Chat 中与 Mentor 确认的方向。直接告诉我第一版想聚焦什么，我会在这里生成 Draft v1。"
              : !mentorFeedbackReady
                ? "Draft v1 已生成。等你在 Chat 把文档发给 Mentor，反馈回来后，我们就在这里继续修改。"
                : "我已经读完 Mentor 的评审意见。你不用填写表格，直接告诉我这一轮想怎么改，我会把修改写回 PRD。"}
          </p>
        </article>

        {prdDraft && (
          <div className="doc-copilot-turn">
            <article className="doc-copilot-message user">
              <strong>你</strong>
              <p>{normalizeText(docGenerationInput, DEFAULT_DOC_GENERATION_INPUT)}</p>
            </article>
            <article className="doc-copilot-message assistant complete">
              <strong>Copilot</strong>
              <p>Draft v1 已生成并写入文档。接下来去 Chat 发给 Mentor，反馈回来后我们继续在这里修改。</p>
            </article>
          </div>
        )}

        {completedReviews.map((step, index) => (
          <div className="doc-copilot-turn" key={`${step.impact}-${index}`}>
            <article className="doc-copilot-message user">
              <strong>你</strong>
              <p>{docReviewInputs[index] || step.input}</p>
            </article>
            <article className="doc-copilot-message assistant">
              <strong>Copilot</strong>
              <p>已根据你的描述更新「{step.impact}」，修改后的内容已经同步到当前 PRD。</p>
            </article>
          </div>
        ))}

        {mentorFeedbackReady && activeReview && (
          <article className="doc-copilot-message assistant active">
            <strong>Copilot · 第 {reviewProgress + 1}/{reviewSteps.length} 轮</strong>
            <p>{activeReview.comment}</p>
            <small>你可以直接说“按这个建议改”，也可以告诉我你想保留或调整什么。</small>
          </article>
        )}

        {mentorFeedbackReady && !activeReview && (
          <article className="doc-copilot-message assistant complete">
            <strong>Copilot</strong>
            <p>4 轮修改已经写回 PRD。现在这份是 Draft v2，可以继续进入 Figma。</p>
          </article>
        )}
      </div>

      {(!prdDraft || (mentorFeedbackReady && activeReview)) && (
        <div className="doc-copilot-composer">
          <textarea
            rows={3}
            value={composerDraft}
            disabled={isGenerating}
            onChange={(event) => setComposerDraft(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                submitCopilotMessage();
              }
            }}
            placeholder={prdDraft ? "告诉 Copilot 这一轮怎么改…" : "告诉 Copilot 第一版要聚焦什么…"}
          />
          <div>
            <small>⌘ / Ctrl + Enter 发送</small>
            <button type="button" onClick={submitCopilotMessage} disabled={!composerDraft.trim() || isGenerating}>
              {isGenerating ? "正在生成…" : prdDraft ? "生成修改稿" : "生成 Draft v1"}
              <SendHorizontal size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
      </section>
    </>
  );
}

function FlowRoom({
  productPath,
  flowInput,
  flowNodes,
  prototypeScreens,
  prototypeEdited,
  prototypePreviewed,
  businessTestReceived,
  dataIterationApplied,
  onChange,
  onGenerate,
  onUpdateScreen,
  onPreviewPrototype,
  onApplyDataIteration,
}: {
  productPath: ProductPath;
  flowInput: string;
  flowNodes: string[];
  prototypeScreens: PrototypeScreen[];
  prototypeEdited: boolean;
  prototypePreviewed: boolean;
  businessTestReceived: boolean;
  dataIterationApplied: boolean;
  onChange: (flowInput: string) => void;
  onGenerate: () => void;
  onUpdateScreen: (index: number, updates: Partial<PrototypeScreen>) => void;
  onPreviewPrototype: () => void;
  onApplyDataIteration: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<"design" | "prototype">("design");
  const [presenting, setPresenting] = useState(false);
  const [presentIndex, setPresentIndex] = useState(0);
  const [zoom, setZoom] = useState(78);
  const businessTestMetrics = getBusinessTestMetrics(productPath);
  const selectedScreen = prototypeScreens[selectedIndex];
  const presentedScreen = prototypeScreens[presentIndex];
  const pageItems =
    prototypeScreens.length > 0
      ? prototypeScreens
      : [{ name: "Untitled frame", purpose: "等待生成页面", blocks: [], accent: "teal" as Accent }];

  useEffect(() => {
    if (prototypeScreens.length === 0) {
      setSelectedIndex(0);
      return;
    }
    setSelectedIndex((current) => clamp(current, 0, prototypeScreens.length - 1));
  }, [prototypeScreens.length]);

  useEffect(() => {
    if (businessTestReceived && !dataIterationApplied) {
      const consensusIndex = prototypeScreens.findIndex(
        (screen) =>
          (productPath === "solo"
            ? screen.name.includes("成员轻量响应")
            : screen.name.includes("共识方案") || screen.name.includes("候选路线")) &&
          !screen.name.includes("v2"),
      );
      if (consensusIndex >= 0) {
        setSelectedIndex(consensusIndex);
      }
    }
  }, [businessTestReceived, dataIterationApplied, productPath, prototypeScreens]);

  function updateBlock(blockIndex: number, value: string) {
    if (!selectedScreen) {
      return;
    }
    const blocks = selectedScreen.blocks.map((block, index) => (index === blockIndex ? value : block));
    onUpdateScreen(selectedIndex, { blocks });
  }

  function removeBlock(blockIndex: number) {
    if (!selectedScreen) {
      return;
    }
    onUpdateScreen(selectedIndex, {
      blocks: selectedScreen.blocks.filter((_, index) => index !== blockIndex),
    });
  }

  function addBlock() {
    if (!selectedScreen) {
      return;
    }
    onUpdateScreen(selectedIndex, {
      blocks: [...selectedScreen.blocks, `新模块 ${selectedScreen.blocks.length + 1}`],
    });
  }

  function startPresentation() {
    if (prototypeScreens.length === 0) {
      return;
    }
    setPresentIndex(clamp(selectedIndex, 0, prototypeScreens.length - 1));
    setPresenting(true);
    onPreviewPrototype();
  }

  function advancePresentation() {
    if (!presentedScreen || prototypeScreens.length === 0) {
      return;
    }
    const linkedIndex = prototypeScreens.findIndex((screen) => screen.name === presentedScreen.nextScreen);
    setPresentIndex(linkedIndex >= 0 ? linkedIndex : (presentIndex + 1) % prototypeScreens.length);
  }

  return (
    <div className="room-layout flow-room flow-board-shell figma-shell">
      <header className="flow-board-topbar figma-topbar">
        <div className="flow-board-title figma-file-title">
          <span>
            <LayoutGrid size={18} aria-hidden="true" />
          </span>
          <div>
            <strong>Weekend Plan · Low-fi</strong>
            <small>{prototypeScreens.length ? `${prototypeScreens.length} frames · Saved` : "Page 1 · Empty file"}</small>
          </div>
        </div>

        <div className="flow-board-tabs">
          <button className={mode === "design" ? "active" : ""} type="button" onClick={() => setMode("design")}>Design</button>
          <button className={mode === "prototype" ? "active" : ""} type="button" onClick={() => setMode("prototype")}>Prototype</button>
          <button type="button" title="评论会在团队评审后出现">Comments</button>
        </div>

        <div className="flow-board-actions">
          <button className="secondary-button" type="button" onClick={onGenerate}>
            <Wand2 size={18} aria-hidden="true" />
            {prototypeScreens.length ? "重新生成" : "生成低保真稿"}
          </button>
          <button className="primary-button" type="button" onClick={startPresentation} disabled={!prototypeScreens.length || !prototypeEdited}>
            <Monitor size={17} aria-hidden="true" />
            Present
          </button>
        </div>
      </header>

      <div className="flow-board-workspace">
        <aside className="flow-tool-rail" aria-label="Board tools">
          <button className="active" type="button" aria-label="Select">
            <Monitor size={17} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Frame">
            <LayoutGrid size={17} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Text">
            <FileText size={17} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Connector">
            <Workflow size={17} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Comment">
            <MessageSquare size={17} aria-hidden="true" />
          </button>
          <button type="button" aria-label="More">
            <MoreHorizontal size={17} aria-hidden="true" />
          </button>
        </aside>

        <aside className="figma-layers-panel">
          <section>
            <div className="figma-panel-heading">
              <strong>Pages</strong>
              <Plus size={14} aria-hidden="true" />
            </div>
            <button className="figma-page-row active" type="button">
              <FileText size={14} aria-hidden="true" />
              Page 1
            </button>
          </section>

          <section className="figma-layer-section">
            <div className="figma-panel-heading">
              <strong>Layers</strong>
              <ChevronDown size={14} aria-hidden="true" />
            </div>
            <div className="figma-layer-list">
              {pageItems.map((screen, index) => (
                <button
                  className={prototypeScreens.length > 0 && selectedIndex === index ? "active" : ""}
                  type="button"
                  key={`${screen.name}-${index}`}
                  onClick={() => prototypeScreens.length > 0 && setSelectedIndex(index)}
                >
                  <LayoutGrid size={13} aria-hidden="true" />
                  <span>{screen.name}</span>
                  <small>{screen.blocks.length}</small>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="flow-canvas-shell">
          {presenting && presentedScreen ? (
            <div className="figma-present-mode">
              <header>
                <div>
                  <strong>Prototype preview</strong>
                  <span>{presentIndex + 1} / {prototypeScreens.length} · {presentedScreen.name}</span>
                </div>
                <button type="button" onClick={() => setPresenting(false)}>退出预览</button>
              </header>

              <div className="figma-present-stage">
                <article className={`phone-frame figma-present-phone ${presentedScreen.accent}`}>
                  <header>
                    <span>{presentedScreen.name}</span>
                    <small>{presentedScreen.purpose}</small>
                  </header>
                  <div className="wire-content">
                    {presentedScreen.blocks.map((block, index) => (
                      <div className="wire-block" key={`${block}-${index}`}>
                        <span>{index + 1}</span>
                        <strong>{block}</strong>
                      </div>
                    ))}
                    <button className="figma-hotspot" type="button" onClick={advancePresentation}>
                      {presentedScreen.nextScreen ? `点击前往 ${presentedScreen.nextScreen}` : "回到第一个页面"}
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              </div>
            </div>
          ) : (
            <div className="flow-canvas-stage figma-canvas-stage" style={{ "--figma-zoom": zoom / 100 } as CSSProperties}>
              {prototypeScreens.length > 0 && (!prototypeEdited || !prototypePreviewed) && (
                <div className="figma-experience-tip">
                  <Sparkles size={15} aria-hidden="true" />
                  <div>
                    <strong>{!prototypeEdited ? "原型设计 1/2：编辑一个 Frame" : "原型设计 2/2：运行 Prototype"}</strong>
                    <span>
                      {!prototypeEdited
                        ? "选择任意页面，在右侧修改页面名称、用途或图层内容。"
                        : "切到 Prototype 检查跳转关系，再点击 Present 亲自走一遍。"}
                    </span>
                  </div>
                </div>
              )}
              <section className="figma-flow-overview">
                <div className="flow-section-title">
                  <div>
                    <p className="doc-label">Prototype flow</p>
                    <h2>{mode === "prototype" ? "检查页面跳转关系" : "Page 1 · Weekend planning"}</h2>
                  </div>
                  <span>{flowNodes.length || 0} steps</span>
                </div>
                <FlowStrip nodes={flowNodes} />
              </section>

              <section className="flow-frame-panel figma-frame-panel">
                <div className="flow-section-title compact">
                  <div>
                    <p className="doc-label">Mobile · 390 × 844</p>
                    <h2>{prototypeScreens.length ? `${prototypeScreens.length} frames` : "Empty canvas"}</h2>
                  </div>
                  <span>{mode === "prototype" ? "蓝色连线表示 On tap" : "点击 Frame 后在右侧编辑"}</span>
                </div>
                <PrototypeGrid
                  screens={prototypeScreens}
                  selectedIndex={selectedIndex}
                  onSelect={setSelectedIndex}
                  showConnections={mode === "prototype"}
                />
              </section>
            </div>
          )}

          {!presenting && <div className="flow-navigation-bar" aria-label="Board navigation">
            <button type="button" onClick={() => setZoom((value) => clamp(value - 10, 40, 120))}>-</button>
            <span>{zoom}%</span>
            <button type="button" onClick={() => setZoom((value) => clamp(value + 10, 40, 120))}>+</button>
            <button type="button">
              <LayoutGrid size={14} aria-hidden="true" />
              Mini map
            </button>
          </div>}
        </main>

        <aside className="flow-inspector-panel figma-inspector-panel">
          <div className="figma-inspector-tabs">
            <button className={mode === "design" ? "active" : ""} type="button" onClick={() => setMode("design")}>Design</button>
            <button className={mode === "prototype" ? "active" : ""} type="button" onClick={() => setMode("prototype")}>Prototype</button>
          </div>

          {businessTestReceived && (
            <section className="business-test-panel">
              <div className="business-test-heading">
                <div>
                  <p className="doc-label">Linked insight · Chat</p>
                  <h3>{productPath === "solo" ? "成员响应与计划锁定率过低" : "可接受方案确认率过低"}</h3>
                </div>
                {dataIterationApplied && <CheckCircle2 size={17} aria-label="已完成数据迭代" />}
              </div>

              <div className="business-test-metrics">
                {businessTestMetrics.map((metric) => (
                  <div className={metric.note.includes("低于") || metric.note.includes("不足") || metric.note.includes("高于") ? "alert" : ""} key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                    <small>{metric.note}</small>
                  </div>
                ))}
              </div>

              <p className="business-test-insight">
                {productPath === "solo"
                  ? "共同边界和主理人发布都已达标，主要流失发生在成员响应。录屏显示成员担心“跳过”会扫兴，也不清楚未响应是否等于默认参加，因此计划无法按时锁定。"
                  : "约束提交率已接近目标，主要流失发生在方案确认。录屏显示成员看不见冲突和妥协成本，讨论会重新回到群聊。"}
              </p>

              <button
                className="data-iteration-button"
                type="button"
                onClick={onApplyDataIteration}
                disabled={dataIterationApplied}
              >
                {dataIterationApplied ? (
                  <>
                    <CheckCircle2 size={15} aria-hidden="true" />
                    已根据数据更新
                  </>
                ) : (
                  <>
                    <RefreshCw size={15} aria-hidden="true" />
                    {productPath === "solo" ? "创建成员响应 / v2" : "创建共识方案 / v2"}
                  </>
                )}
              </button>
            </section>
          )}

          {selectedScreen ? (
            mode === "design" ? (
              <>
                <section className="figma-property-section">
                  <div className="figma-property-title">
                    <h3>Frame</h3>
                    <span>#{selectedIndex + 1}</span>
                  </div>
                  <div className="figma-dimension-grid" aria-label="Frame dimensions">
                    <span>X&nbsp; {48 + selectedIndex * 220}</span>
                    <span>Y&nbsp; 220</span>
                    <span>W&nbsp; 390</span>
                    <span>H&nbsp; 844</span>
                  </div>
                  <label className="figma-field">
                    <span>Name</span>
                    <input
                      value={selectedScreen.name}
                      onChange={(event) => onUpdateScreen(selectedIndex, { name: event.target.value })}
                    />
                  </label>
                  <label className="figma-field">
                    <span>Purpose</span>
                    <textarea
                      rows={3}
                      value={selectedScreen.purpose}
                      onChange={(event) => onUpdateScreen(selectedIndex, { purpose: event.target.value })}
                    />
                  </label>
                </section>

                <section className="figma-property-section">
                  <div className="figma-property-title">
                    <h3>Layers</h3>
                    <button type="button" onClick={addBlock} aria-label="Add layer"><Plus size={14} /></button>
                  </div>
                  <div className="figma-block-editor">
                    {selectedScreen.blocks.map((block, blockIndex) => (
                      <div key={`${blockIndex}-${selectedScreen.name}`}>
                        <LayoutGrid size={12} aria-hidden="true" />
                        <input value={block} onChange={(event) => updateBlock(blockIndex, event.target.value)} />
                        <button type="button" onClick={() => removeBlock(blockIndex)} aria-label={`删除 ${block}`}>×</button>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <section className="figma-property-section figma-prototype-properties">
                <div className="figma-property-title">
                  <h3>Interaction</h3>
                  <Workflow size={14} aria-hidden="true" />
                </div>
                <div className="figma-interaction-card">
                  <strong>On tap</strong>
                  <ArrowRight size={14} aria-hidden="true" />
                  <select
                    value={selectedScreen.nextScreen || ""}
                    onChange={(event) => onUpdateScreen(selectedIndex, { nextScreen: event.target.value })}
                  >
                    <option value="">No destination</option>
                    {prototypeScreens.map((screen, index) => (
                      index !== selectedIndex && <option value={screen.name} key={`${screen.name}-${index}`}>{screen.name}</option>
                    ))}
                  </select>
                </div>
                <dl className="figma-prototype-meta">
                  <div><dt>Action</dt><dd>Navigate to</dd></div>
                  <div><dt>Animation</dt><dd>Smart animate</dd></div>
                  <div><dt>Duration</dt><dd>300ms</dd></div>
                </dl>
                <button className="figma-start-preview" type="button" onClick={startPresentation} disabled={!prototypeEdited}>
                  <Monitor size={15} aria-hidden="true" />
                  从此 Frame 开始体验
                </button>
              </section>
            )
          ) : (
            <section className="figma-empty-inspector">
              <LayoutGrid size={24} aria-hidden="true" />
              <p>生成低保真稿后，可以选择 Frame、编辑图层并连接交互。</p>
            </section>
          )}

          <details className="figma-ai-panel" open={!prototypeScreens.length}>
            <summary>
              <Sparkles size={14} aria-hidden="true" />
              Make designs from PRD
            </summary>
            <label className="flow-prompt-field">
              <span>描述用户如何完成任务</span>
              <textarea
                rows={4}
                value={flowInput}
                onChange={(event) => onChange(event.target.value)}
                placeholder={productPath === "solo"
                  ? "例如：建立共同边界、轮换主理人、发布一个计划、成员轻量响应、截止锁定。"
                  : "例如：创建计划、私下提交约束、查看共同点与冲突、比较妥协方案、确认共同计划。"}
              />
            </label>
          </details>
        </aside>
      </div>
    </div>
  );
}

function FinalRoom({
  state,
  copyLabel,
  onCopy,
  onDownload,
  onRestart,
}: {
  state: ExperienceState;
  copyLabel: string;
  onCopy: () => void;
  onDownload: () => void;
  onRestart: () => void;
}) {
  const finalSummary = state.finalSummary.length > 0 ? state.finalSummary : createFinalSummary(state);
  const prd = state.prdDraft ?? createPrdDraft(state, normalizeText(state.featuresInput, getDefaultFeaturesInput(getProductPath(state)))).prdDraft;
  const feedbackItems = state.teamFeedback.length > 0 ? state.teamFeedback : createRoleFeedback(state);
  const prototypeNames = state.prototypeScreens.length > 0
    ? state.prototypeScreens.map((screen) => screen.name)
    : getProductPath(state) === "solo"
      ? ["小组共同边界", "本周主理人", "发布一个计划", "成员轻量响应", "行程锁定"]
      : ["发起计划", "私人约束", "共识方案", "成员确认", "共同计划"];

  return (
    <div className="room-layout final-room">
      <main className="delivery-sheet delivery-board">
        <header className="delivery-board-header">
          <div>
            <p className="eyebrow">Delivery Folder</p>
            <h2>{derivePreviewTitle(state)}</h2>
            <span>周五评审包已经整理好，核心产物和复盘记录都在这里。</span>
          </div>
          <div className="delivery-file-pills" aria-label="交付物列表">
            <span>Product Preview.app</span>
            <span>PRD Draft.md</span>
            <span>Prototype Flow.png</span>
            <span>Feedback.txt</span>
            <span>Summary.md</span>
          </div>
        </header>

        <section className="deliverable-section prototype-deliverable" aria-label="用户原型界面">
          <header className="deliverable-section-head">
            <div>
              <p className="eyebrow">用户原型界面</p>
              <h3>Product Preview.app</h3>
            </div>
            <span>面向学生用户的可点击产品界面，展示真实使用路径。</span>
          </header>
          <ProductPreview state={state} />
        </section>

        <section className="deliverable-section artifact-deliverable" aria-label="项目交付产物">
          <header className="deliverable-section-head">
            <div>
              <p className="eyebrow">项目交付产物</p>
              <h3>文档、流程、反馈与复盘</h3>
            </div>
            <span>这些是评审和复盘用的项目材料，不属于用户会直接打开的产品界面。</span>
          </header>

          <div className="deliverable-grid" aria-label="交付物详情">
            <article className="deliverable-card wide prd-document-card">
              <p className="doc-label">PRD Draft.md</p>
              <h3>{prd.goal}</h3>
              <div className="prd-doc-meta">
                <span>Owner: You</span>
                <span>Status: Ready for review</span>
                <span>Version: v1 MVP</span>
              </div>

              <section className="prd-doc-section">
                <h4>1. 背景与目标</h4>
                <p>{prd.background}</p>
                <p>{prd.objective}</p>
              </section>

              <section className="prd-doc-section">
                <h4>2. 用户、场景与问题</h4>
                <dl className="deliverable-definition">
                  <div>
                    <dt>目标用户</dt>
                    <dd>{prd.users}</dd>
                  </div>
                  <div>
                    <dt>核心痛点</dt>
                    <dd>{prd.pain}</dd>
                  </div>
                  <div>
                    <dt>典型场景</dt>
                    <dd>{prd.scenario}</dd>
                  </div>
                </dl>
              </section>

              <section className="prd-doc-section">
                <h4>3. 成功指标</h4>
                <div className="prd-metric-grid">
                  {prd.successMetrics.map((metric) => (
                    <div key={metric.name}>
                      <strong>{metric.name}</strong>
                      <span>{metric.target}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="prd-doc-section">
                <h4>4. MVP 范围</h4>
                <TagList items={state.coreFeatures.length ? state.coreFeatures : prd.scope} empty="待生成" />
              </section>

              <section className="prd-doc-section">
                <h4>5. 用户故事</h4>
                <ul className="prd-bullet-list">
                  {prd.userStories.map((story) => (
                    <li key={story}>{story}</li>
                  ))}
                </ul>
              </section>

              <section className="prd-doc-section">
                <h4>6. 功能需求与验收标准</h4>
                <div className="prd-requirement-list">
                  {prd.requirements.map((requirement) => (
                    <article key={requirement.title}>
                      <h3>{requirement.title}</h3>
                      <p>{requirement.description}</p>
                      <ul>
                        {requirement.acceptance.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>

              <section className="prd-doc-section">
                <h4>7. 暂不做与风险</h4>
                <div className="prd-two-column">
                  <div>
                    <h3>Out of scope</h3>
                    <ul className="prd-bullet-list">
                      {prd.outOfScope.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3>Risks</h3>
                    <ul className="prd-bullet-list">
                      {prd.risks.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            </article>

            <article className="deliverable-card">
              <p className="doc-label">Prototype Flow.png</p>
              <h3>用户流程</h3>
              <FlowStrip nodes={state.flowNodes.length
                ? state.flowNodes
                : getProductPath(state) === "solo"
                  ? ["建立共同边界", "轮换本周主理人", "主理人发布一个计划", "成员轻量响应", "截止后锁定行程"]
                  : ["创建计划", "私下提交约束", "汇总共同点与冲突", "比较妥协方案", "确认共同计划"]} />
            </article>

            <article className="deliverable-card">
              <p className="doc-label">Prototype Pages</p>
              <h3>原型页面清单</h3>
              <TagList items={prototypeNames} empty="待生成" muted />
            </article>

            <article className="deliverable-card">
              <p className="doc-label">Colleague Feedback.txt</p>
              <h3>评审反馈</h3>
              <div className="delivery-feedback-list">
                {feedbackItems.map((item) => (
                  <section key={item.role}>
                    <strong>{item.role}</strong>
                    <span>{item.suggestion}</span>
                  </section>
                ))}
              </div>
            </article>

            <article className="deliverable-card">
              <p className="doc-label">Experiment Readout.md</p>
              <h3>测试证据与设计决策</h3>
              <div className="delivery-feedback-list">
                {state.businessTestReceived ? (
                  getBusinessTestMetrics(getProductPath(state)).map((metric) => (
                    <section key={metric.label}>
                      <strong>{metric.label} · {metric.value}</strong>
                      <span>{metric.note}</span>
                    </section>
                  ))
                ) : (
                  <section>
                    <strong>等待灰度数据</strong>
                    <span>完成原型体验后，由业务负责人发来 20 组用户的测试结果。</span>
                  </section>
                )}
              </div>
              {state.dataIterationApplied && (
                <p>{getProductPath(state) === "solo"
                  ? "根据测试数据重写成员跳过、边界否决和未响应规则，并补充换主理人与保底计划。"
                  : DATA_ITERATION_DECISION}</p>
              )}
            </article>

            <article className="deliverable-card wide">
              <p className="doc-label">Experience Summary.md</p>
              <h3>体验总结</h3>
              <Checklist items={finalSummary} />
            </article>
          </div>
        </section>

        <div className="action-row">
          <button className="secondary-button" type="button" onClick={onCopy}>
            <ClipboardCopy size={18} aria-hidden="true" />
            {copyLabel}
          </button>
          <button className="secondary-button" type="button" onClick={onDownload}>
            <Download size={18} aria-hidden="true" />
            下载文件
          </button>
          <button className="primary-button" type="button" onClick={onRestart}>
            <RefreshCw size={18} aria-hidden="true" />
            再开一局
          </button>
        </div>
      </main>
    </div>
  );
}

function derivePreviewTitle(state: ExperienceState) {
  const basis = `${state.productDirection} ${state.firstValue} ${state.painPoint}`;

  if (getProductPath(state) === "solo") {
    return "周末主理人";
  }

  if (hasAny(basis, ["朋友", "一起", "群", "投票"])) {
    return "周末共识";
  }

  if (hasAny(basis, ["预算", "人均", "省钱", "花费"])) {
    return "周末预算计划";
  }

  if (hasAny(basis, ["小众", "探索", "新鲜", "城市"])) {
    return "城市探索卡";
  }

  return "周末出发";
}

function buildPreviewStats(state: ExperienceState) {
  const soloMode = getProductPath(state) === "solo";
  const withReview = state.teamFeedback.length > 0;

  if (soloMode) {
    return [
      { label: "本周主理人", value: "小周" },
      { label: "决策方式", value: "只发布 1 个计划" },
      { label: "验证", value: withReview ? "已完成评审" : "等待评审" },
    ];
  }

  return [
    {
      label: "共识目标",
      value: "15 分钟内确认",
    },
    {
      label: "协作",
      value: "看见妥协成本",
    },
    {
      label: "验证",
      value: withReview ? "已完成评审" : "等待评审",
    },
  ];
}

function buildPreviewRoutes(state: ExperienceState) {
  const friendMode = getProductPath(state) === "group";
  const budgetMode = hasAny(`${state.productDirection} ${state.coreFeatures.join(" ")}`, ["预算", "人均", "花费", "价格"]);

  return [
    {
      title: friendMode ? "轻松半日线" : "河畔书店半日计划",
      badge: friendMode ? "最稳妥" : "主理人已发布",
      budget: friendMode ? (budgetMode ? "人均 88 元" : "预算友好") : "人均 88 元",
      duration: "3.5 小时",
      energy: "轻松",
      returnTime: "18:40 回校",
      fit: friendMode ? "2-4 人" : "3 人可参加",
      note: friendMode
        ? "共同点最多；小周多走 10 分钟，但换来阿宁的拍照需求和更早返校。"
        : "小周依据共同边界发布：人均低于 120 元、19:00 前回校、校外 8 公里内，没有再次发起投票。",
      tradeoff: friendMode ? "小周：多走 10 分钟" : "符合 3 条共同硬性边界",
      accent: "teal" as Accent,
    },
    {
      title: friendMode ? "城市探索线" : "旧城摄影备选计划",
      badge: "更有新鲜感",
      budget: friendMode ? (budgetMode ? "人均 126 元" : "中等投入") : "人均 126 元",
      duration: "5 小时",
      energy: "中等",
      returnTime: "19:20 回校",
      fit: friendMode ? "3-5 人" : "超过共同预算",
      note: friendMode
        ? "满足探索和拍照，但需要全员接受晚 40 分钟回校，是更高成本的妥协。"
        : "这条备选超过了共同预算和最晚返程时间，因此不能由主理人直接发布。",
      tradeoff: friendMode ? "全员：晚 40 分钟返校" : "违反 2 条共同边界",
      accent: "amber" as Accent,
    },
    {
      title: friendMode ? "预算优先线" : "公园咖啡保底计划",
      badge: "更省钱",
      budget: friendMode ? (budgetMode ? "人均 59 元" : "低预算") : "人均 59 元",
      duration: "2.5 小时",
      energy: "很轻",
      returnTime: "17:50 回校",
      fit: friendMode ? "2-3 人" : "无人接棒时启用",
      note: friendMode
        ? "预算最稳，但会放弃小周想探索的街区，适合把预算当硬性限制的成员。"
        : "如果本周主理人临时退出且无人接棒，小组可以直接启用这条已满足共同边界的保底计划。",
      tradeoff: friendMode ? "小周：放弃探索街区" : "保底计划不会进入正常投票",
      accent: "coral" as Accent,
    },
  ];
}

function buildPreviewFriends() {
  return [
    {
      name: "阿宁",
      status: "已提交",
      preference: "必须：少走路 · 人均 100 内；可妥协：早点回校",
      vote: "可接受 · 轻松半日线",
      accent: "teal" as Accent,
    },
    {
      name: "小周",
      status: "已提交",
      preference: "必须：晚上回校；可妥协：多走 10 分钟",
      vote: "可提出替代",
      accent: "amber" as Accent,
    },
    {
      name: "Mia",
      status: "已提交",
      preference: "必须：19:00 前返校；可妥协：预算多 20 元",
      vote: "待确认",
      accent: "coral" as Accent,
    },
  ];
}

function getPreviewPageSlug(page: PreviewPage) {
  const slugs: Record<PreviewPage, string> = {
    home: "overview",
    create: "create",
    friends: "friends",
    options: "options",
    vote: "vote",
    final: "final-plan",
  };

  return slugs[page];
}

function getPreviewProductSlug(state: ExperienceState) {
  const basis = `${state.productDirection} ${state.firstValue} ${state.painPoint}`;

  if (getProductPath(state) === "solo") {
    return "weekend-captain";
  }

  if (hasAny(basis, ["朋友", "一起", "群", "投票"])) {
    return "weekend-consensus";
  }

  if (hasAny(basis, ["预算", "人均", "省钱", "花费"])) {
    return "budget-weekend";
  }

  if (hasAny(basis, ["小众", "探索", "新鲜", "城市"])) {
    return "city-explore";
  }

  return "weekend-plan";
}

function ProductPreview({ state }: { state: ExperienceState }) {
  const [page, setPage] = useState<PreviewPage>("home");
  const phoneCapture = typeof window !== "undefined"
    && new URLSearchParams(window.location.search).get("capture") === "phone";
  const soloMode = getProductPath(state) === "solo";
  const title = derivePreviewTitle(state);
  const productSlug = getPreviewProductSlug(state);
  const stats = buildPreviewStats(state);
  const routes = buildPreviewRoutes(state);
  const friends = buildPreviewFriends();
  const selectedRoute = routes[0];
  const coreActions = state.coreFeatures.length > 0
    ? state.coreFeatures.slice(0, 3)
    : soloMode
      ? ["确认共同边界", "查看本周主理人", "完成轻量响应"]
      : ["创建计划", "私下提交约束", "识别冲突"];
  const pageSlug = getPreviewPageSlug(page);
  const navItems: { id: PreviewPage; label: string; icon: LucideIcon }[] = soloMode
    ? [
        { id: "home", label: "小队", icon: Sparkles },
        { id: "create", label: "边界", icon: Plus },
        { id: "friends", label: "主理人", icon: Users },
        { id: "options", label: "计划", icon: LayoutGrid },
        { id: "vote", label: "响应", icon: CheckCircle2 },
        { id: "final", label: "行程", icon: Trophy },
      ]
    : [
        { id: "home", label: "首页", icon: Sparkles },
        { id: "create", label: "创建", icon: Plus },
        { id: "friends", label: "朋友", icon: Users },
        { id: "options", label: "方案", icon: LayoutGrid },
        { id: "vote", label: "共识", icon: CheckCircle2 },
        { id: "final", label: "行程", icon: Trophy },
      ];

  function renderPhoneScreen() {
    if (page === "home") {
      return (
        <>
          <section className="consumer-hero-screen">
            <p>{soloMode ? "这周谁来做主？" : "Hi，今天想去哪？"}</p>
            <h3>{soloMode ? "不再等所有人继续提意见，由本周主理人把计划发出来" : "周六下午和朋友出去，15 分钟达成共识"}</h3>
            <span>{soloMode ? "共同边界 · 一位主理人 · 一个计划 · 到点锁定" : "先看共同点 · 再谈冲突 · 透明写出谁要妥协"}</span>
            <button type="button" onClick={() => setPage("create")}>{soloMode ? "查看小队边界" : "开始定计划"}</button>
          </section>

          <section className="consumer-plan-card">
            <div>
              <span>当前计划</span>
              <strong>{state.productDirection || (soloMode ? "先定共同底线，再轮一位主理人负责发布和锁定计划" : "帮朋友看见约束和妥协成本，确认一个共同计划")}</strong>
            </div>
            <div className="consumer-pill-row">
              {stats.map((item) => (
                <span key={item.label}>{item.value}</span>
              ))}
            </div>
          </section>

          <section className="consumer-mini-list">
            {coreActions.map((action, index) => (
              <button type="button" onClick={() => setPage(index === 0 ? "create" : index === 1 ? "friends" : "options")} key={action}>
                <span>{index + 1}</span>
                <strong>{action}</strong>
              </button>
            ))}
          </section>
        </>
      );
    }

    if (page === "create") {
      return (
        <>
          <header className="consumer-screen-head">
            <span>{soloMode ? "小队共同边界" : "创建计划"}</span>
            <h3>{soloMode ? "只留下所有人都不能越过的底线" : "这次想怎么出门？"}</h3>
          </header>

          <section className="consumer-form-stack">
            <label>
              <span>{soloMode ? "小队" : "一句话想法"}</span>
              <strong>{soloMode ? "周末出逃小队 · 4 人" : "周六下午和朋友找一个不用做攻略的半日计划"}</strong>
            </label>
            <label>
              <span>时间</span>
              <strong>周六 14:00 - 19:00</strong>
            </label>
            <label>
              <span>预算</span>
              <strong>{soloMode ? "人均不超过 120 元" : "人均 80-120 元"}</strong>
            </label>
            <label>
              <span>边界</span>
              <strong>{soloMode ? "19:00 前回校 · 校外 8 公里内" : "必须：少走路、晚上回校；可妥协：探索程度"}</strong>
            </label>
          </section>

          <button className="consumer-main-action" type="button" onClick={() => setPage("friends")}>{soloMode ? "确认边界并查看本周主理人" : "邀请朋友提交约束"}</button>
        </>
      );
    }

    if (page === "friends") {
      if (soloMode) {
        return (
          <>
            <header className="consumer-screen-head">
              <span>本周轮值</span>
              <h3>小周是本周主理人</h3>
            </header>

            <div className="consumer-progress-card">
              <div>
                <strong>第 3 棒</strong>
                <span>请在 10 分钟内发布一个计划</span>
              </div>
              <div className="consumer-progress-track" aria-hidden="true">
                <span style={{ width: "75%" }} />
              </div>
            </div>

            <section className="consumer-friend-list">
              {["阿宁 · 上周已完成", "Mia · 已完成", "小周 · 本周主理人", "你 · 下周轮值"].map((item, index) => (
                <article className={`consumer-friend-row ${(["teal", "mint", "amber", "coral"] as Accent[])[index]}`} key={item}>
                  <div className="consumer-avatar">{index + 1}</div>
                  <div><strong>{item}</strong><p>{index === 2 ? "已确认接棒，可以发布计划" : "轮值顺序公开可见"}</p></div>
                  <span>{index === 2 ? "进行中" : "已排期"}</span>
                </article>
              ))}
            </section>

            <button className="consumer-main-action" type="button" onClick={() => setPage("options")}>以主理人身份发布计划</button>
          </>
        );
      }

      return (
        <>
          <header className="consumer-screen-head">
            <span>约束汇总</span>
            <h3>3 位成员已提交约束</h3>
          </header>

          <div className="consumer-progress-card">
            <div>
              <strong>3/3</strong>
              <span>共同点与冲突已整理</span>
            </div>
            <div className="consumer-progress-track" aria-hidden="true">
              <span style={{ width: "100%" }} />
            </div>
          </div>

          <section className="consumer-friend-list">
            {friends.map((friend) => (
              <article className={`consumer-friend-row ${friend.accent}`} key={friend.name}>
                <div className="consumer-avatar">{friend.name.slice(0, 1)}</div>
                <div>
                  <strong>{friend.name}</strong>
                  <p>{friend.preference}</p>
                </div>
                <span>{friend.status}</span>
              </article>
            ))}
          </section>

          <button className="consumer-main-action" type="button" onClick={() => setPage("options")}>查看共同点与冲突</button>
        </>
      );
    }

    if (page === "options") {
      return (
        <>
          <header className="consumer-screen-head">
            <span>{soloMode ? "主理人发布" : "可接受方案"}</span>
            <h3>{soloMode ? "这周只发布一个计划" : "选一个大家都能接受的计划"}</h3>
          </header>

          <section className="consumer-comment-card">
            <strong>{soloMode ? "边界检查通过 · 3/3" : "3 项共同点 · 1 个冲突"}</strong>
            <p>{soloMode ? "人均 88 元、18:40 回校、距离学校 6.2 公里。满足共同边界后由小周直接发布，不再发起多选投票。" : "大家都接受人均 120 元内、晚上回校和可以聊天；冲突集中在少走路与探索新街区。"}</p>
          </section>

          <section className="consumer-route-list">
            {(soloMode ? routes.slice(0, 1) : routes).map((route) => (
              <article className={`consumer-route-card ${route.accent}`} key={route.title}>
                <header>
                  <span>{route.badge}</span>
                  <strong>{route.title}</strong>
                </header>
                <p>{route.note}</p>
                <div className="consumer-route-meta">
                  <span>{route.budget}</span>
                  <span>{route.duration}</span>
                  <span>{route.energy}</span>
                  <span>{route.returnTime}</span>
                </div>
                <button type="button" onClick={() => setPage("vote")}>{soloMode ? "发布并等待成员响应" : "查看妥协成本"}</button>
              </article>
            ))}
          </section>
        </>
      );
    }

    if (page === "vote") {
      if (soloMode) {
        return (
          <>
            <header className="consumer-screen-head">
              <span>成员响应 · 20:00 截止</span>
              <h3>这周你能参加吗？</h3>
            </header>

            <section className="consumer-vote-list">
              <article className="consumer-vote-row">
                <div><strong>能参加</strong><span>2 人</span></div>
                <p>加入最终参加名单，截止后自动收到锁定行程。</p>
              </article>
              <article className="consumer-vote-row">
                <div><strong>本周跳过</strong><span>不阻塞</span></div>
                <p>这周不参加，不需要解释，也不会阻止其他人按计划出发。</p>
              </article>
              <article className="consumer-vote-row">
                <div><strong>边界否决</strong><span>仅限越界</span></div>
                <p>只有计划违反人均 120 元、19:00 返校或 8 公里范围时使用。</p>
              </article>
            </section>

            <section className="consumer-comment-card">
              <strong>未响应 ≠ 默认参加</strong>
              <p>截止后只为已选择“能参加”的成员锁定行程，未响应者不会被写进名单。</p>
            </section>

            <button className="consumer-main-action" type="button" onClick={() => setPage("final")}>我能参加</button>
          </>
        );
      }

      return (
        <>
          <header className="consumer-screen-head">
            <span>共识确认</span>
            <h3>{selectedRoute.title} 的妥协说明</h3>
          </header>

          <section className="consumer-vote-list">
            <article className="consumer-vote-row">
              <div>
                <strong>共同点</strong>
                <span>3/3 满足</span>
              </div>
              <p>人均不超过 120 元 · 晚上回校 · 可以坐下来聊天</p>
            </article>
            <article className="consumer-vote-row">
              <div>
                <strong>仍需妥协</strong>
                <span>1 项</span>
              </div>
              <p>{selectedRoute.tradeoff}；没有人的硬性限制被覆盖。</p>
            </article>
          </section>

          <section className="consumer-comment-card">
            <strong>你的选择</strong>
            <p>我可以接受这个妥协；如果不同意，也可以提出替代方案或说明否决原因。</p>
          </section>

          <button className="consumer-main-action" type="button" onClick={() => setPage("final")}>接受这个可接受方案</button>
        </>
      );
    }

    return (
      <>
        <header className="consumer-screen-head">
          <span>{soloMode ? "截止后已锁定" : "最终计划"}</span>
          <h3>{selectedRoute.title}</h3>
        </header>

        <section className="consumer-final-card">
          <div>
            <span>{selectedRoute.budget}</span>
            <span>{selectedRoute.duration}</span>
            <span>{selectedRoute.returnTime}</span>
          </div>
          <p>{selectedRoute.note}</p>
          <p>{soloMode ? "主理人：小周 · 参加：小周、阿宁、你 · Mia 本周跳过且不阻塞计划 · 未响应 0 人。" : "共识依据：3 项共同约束全部满足，1 项妥协已由小周确认。"}</p>
        </section>

        <section className="consumer-itinerary-list">
          {(soloMode
            ? ["14:00 校门口集合", "14:20 公交出发", "14:50 河畔散步与书店", "17:10 咖啡店休息", "18:10 返程 · 预计 18:40 到校"]
            : ["14:00 校门口集合", "14:30 街区闲逛和拍照", "16:10 咖啡店休息聊天", "18:30 回校前确认下次计划"]).map((item, index) => (
            <div className="consumer-itinerary-row" key={item}>
              <span>{index + 1}</span>
              <strong>{item}</strong>
            </div>
          ))}
        </section>

        <button className="consumer-main-action" type="button" onClick={() => setPage("home")}>{soloMode ? "发送给参加成员" : "保存并分享"}</button>
      </>
    );
  }

  function renderCompanionPanel() {
    if (page === "home") {
      return (
        <>
          <p className="eyebrow">当前体验</p>
          <article>
            <strong>{soloMode ? "从责任交接开始" : "从一组真实约束开始"}</strong>
            <span>{soloMode ? "小组不再追求每个人都参与选方案，而是先约好底线，再让一位主理人负责把计划发布出来。" : "成员先私下说清硬性限制和可妥协项，再一起看共同点、冲突和妥协成本。"}</span>
            <div>
              <small>{soloMode ? "边界只设一次" : "3 分钟创建"}</small>
              <small>{soloMode ? "每周轮 1 人" : "约束私下提交"}</small>
              <small>{soloMode ? "只发布 1 个计划" : "15 分钟共识目标"}</small>
            </div>
            <button type="button" onClick={() => setPage("create")}>{soloMode ? "查看共同边界" : "开始定计划"}</button>
          </article>
        </>
      );
    }

    if (page === "create") {
      return (
        <>
          <p className="eyebrow">计划摘要</p>
          <article>
            <strong>{soloMode ? "周末出逃小队的共同底线" : "周六下午半日计划"}</strong>
            <span>{soloMode ? "这三条是全员确认的硬性边界。主理人在边界内可以直接决定，不需要重新满足所有人的临时偏好。" : "发起人先写清计划边界，成员再分别补充自己不能退让和可以让步的条件。"}</span>
            <div>
              <small>14:00 - 19:00</small>
              <small>{soloMode ? "人均 ≤ 120" : "人均 80-120"}</small>
              <small>{soloMode ? "8 公里内" : "少走路"}</small>
            </div>
            <button type="button" onClick={() => setPage("friends")}>{soloMode ? "查看本周轮值" : "邀请朋友提交约束"}</button>
          </article>
        </>
      );
    }

    if (page === "friends") {
      if (soloMode) {
        return (
          <>
            <p className="eyebrow">责任交接</p>
            <article>
              <strong>小周已确认接棒</strong>
              <span>主理人负责在共同边界内发布一个计划，不需要替所有人收集完整偏好，也可以一键换给下一位。</span>
              <div><small>本周第 3 棒</small><small>10 分钟发布目标</small><small>可一键换人</small></div>
              <button type="button" onClick={() => setPage("options")}>发布一个计划</button>
            </article>
          </>
        );
      }

      return (
        <>
          <p className="eyebrow">约束状态</p>
          <article>
            <strong>3/3 已提交约束</strong>
            <span>共同点有 3 项；时间与步行距离存在 1 个冲突，需要比较谁的让步成本更低。</span>
            <div>
              {friends.map((friend) => (
                <small key={friend.name}>{friend.name} · {friend.status}</small>
              ))}
            </div>
            <button type="button" onClick={() => setPage("options")}>查看冲突与方案</button>
          </article>
        </>
      );
    }

    if (page === "options") {
      return (
        <>
          <p className="eyebrow">{soloMode ? "主理人计划" : "妥协方案"}</p>
          <article>
            <strong>{selectedRoute.title} {soloMode ? "已通过边界检查" : "最适合先试"}</strong>
            <span>{selectedRoute.note}</span>
            <div>
              <small>{selectedRoute.budget}</small>
              <small>{selectedRoute.duration}</small>
              <small>{selectedRoute.energy}</small>
              <small>{selectedRoute.returnTime}</small>
            </div>
            <button type="button" onClick={() => setPage("vote")}>{soloMode ? "发布并等待响应" : "查看妥协说明"}</button>
          </article>
        </>
      );
    }

    if (page === "vote") {
      if (soloMode) {
        return (
          <>
            <p className="eyebrow">轻量响应</p>
            <article>
              <strong>不用重新讨论，也不会默认参加</strong>
              <span>能去就加入名单；这周不想去可以直接跳过且不阻塞；只有计划越过共同底线时才需要否决。</span>
              <div><small>能参加 3 人</small><small>本周跳过 1 人</small><small>未响应 0 人</small></div>
              <button type="button" onClick={() => setPage("final")}>我能参加</button>
            </article>
          </>
        );
      }

      return (
        <>
          <p className="eyebrow">共识状态</p>
          <article>
            <strong>{selectedRoute.title} 已满足全部硬性限制</strong>
            <span>阿宁已接受，小周确认可以多走 10 分钟；Mia 仍可接受、提出替代或说明否决原因。</span>
            <div>
              <small>硬性限制 3/3</small>
              <small>2 人已接受</small>
              <small>Mia 待确认</small>
            </div>
            <button type="button" onClick={() => setPage("final")}>接受这个方案</button>
          </article>
        </>
      );
    }

    return (
      <>
        <p className="eyebrow">{soloMode ? "计划已锁定" : "分享结果"}</p>
        <article>
          <strong>{soloMode ? "已为 3 位参加成员锁定" : "最终行程已生成"}</strong>
          <span>{soloMode ? "截止时间到后不再等待新的意见。Mia 本周跳过且不阻塞，其余参加成员收到同一份集合信息。" : "用户可以把确认后的时间、预算、路线和妥协依据一起发回朋友群，避免重新解释。"}</span>
          <div>
            <small>{selectedRoute.budget}</small>
            <small>{selectedRoute.duration}</small>
            <small>{selectedRoute.returnTime}</small>
          </div>
          <button type="button" onClick={() => setPage("home")}>回到首页</button>
        </article>
      </>
    );
  }

  return (
    <section className="product-preview-shell user-prototype-shell browser-preview-shell">
      <header className="preview-browser-chrome">
        <div className="window-controls" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="preview-browser-nav" aria-hidden="true">
          <button type="button">←</button>
          <button type="button">→</button>
          <button type="button">↻</button>
        </div>

        <div className="preview-address-bar">
          <Lock size={14} aria-hidden="true" />
          <span>https://demo.campus-os/{productSlug}/{pageSlug}</span>
        </div>

        <div className="preview-live-badge">
          <Monitor size={14} aria-hidden="true" />
          Live demo
        </div>
      </header>

      <div className="consumer-prototype-stage">
        <div
          className="consumer-phone-frame"
          data-phone-capture={phoneCapture ? "true" : undefined}
          aria-label={`${title} 用户原型`}
        >
          <header className="consumer-status-bar">
            <span>9:41</span>
            <strong>{title}</strong>
            <span>5G</span>
          </header>

          <main className={`consumer-phone-screen screen-${page}`}>
            {renderPhoneScreen()}
          </main>

          <nav className="consumer-bottom-nav" aria-label="产品页面导航">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                className={page === id ? "active" : ""}
                type="button"
                aria-pressed={page === id}
                onClick={() => setPage(id)}
                key={id}
              >
                <Icon size={15} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <aside className="consumer-share-preview" aria-label="当前页面补充信息">
          {renderCompanionPanel()}
        </aside>
      </div>
    </section>
  );
}

function getChatAvatarClass(role: ChatMessage["role"]) {
  return role === "mentor"
      ? "teal"
      : role === "manager"
        ? "amber"
        : role === "developer"
          ? "mint"
          : role === "system"
            ? "coral"
            : "teal";
}

function getChatAvatarGlyph(role: ChatMessage["role"]) {
  return role === "mentor"
    ? "🍄"
    : role === "manager"
      ? "🌻"
      : role === "developer"
        ? "🔨"
        : role === "participant"
          ? "🐥"
          : role === "system"
            ? "📜"
            : "🧢";
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const avatarClass = getChatAvatarClass(message.role);

  return (
    <article className={`chat-message ${message.role}`}>
      <div className={`chat-message-avatar ${avatarClass}`} aria-hidden="true">
        {getChatAvatarGlyph(message.role)}
      </div>
      <div className="chat-message-body">
        <div className="chat-message-head">
          <strong>{message.speaker}</strong>
          <span>{message.time || ""}</span>
        </div>
        <p>{message.text}</p>
      </div>
    </article>
  );
}

function ChatTyping({
  speaker,
  role,
}: {
  speaker: string;
  role: ChatMessage["role"];
}) {
  return (
    <article className={`chat-message chat-message-typing ${role}`} aria-label={`${speaker} 正在输入`}>
      <div className={`chat-message-avatar ${getChatAvatarClass(role)}`} aria-hidden="true">
        {getChatAvatarGlyph(role)}
      </div>
      <div className="chat-message-body">
        <div className="chat-message-head">
          <strong>{speaker}</strong>
          <span>正在输入…</span>
        </div>
        <div className="chat-typing-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </article>
  );
}

function TagList({
  items,
  empty,
  muted = false,
}: {
  items: string[];
  empty: string;
  muted?: boolean;
}) {
  if (items.length === 0) {
    return <p className="muted-text">{empty}</p>;
  }

  return (
    <div className={`tag-list ${muted ? "muted" : ""}`}>
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="check-list">
      {items.map((item) => (
        <li key={item}>
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FlowStrip({ nodes }: { nodes: string[] }) {
  if (nodes.length === 0) {
    return (
      <div className="empty-state">
        <Workflow size={28} aria-hidden="true" />
        <p>生成低保真稿后，这里会出现页面流程。</p>
      </div>
    );
  }

  return (
    <div className="flow-strip" aria-label="用户流程">
      {nodes.map((node, index) => (
        <div className="flow-node" key={node}>
          <span>{index + 1}</span>
          <strong>{node}</strong>
          {index < nodes.length - 1 && <ArrowRight size={16} aria-hidden="true" />}
        </div>
      ))}
    </div>
  );
}

function PrototypeGrid({
  screens,
  selectedIndex,
  onSelect,
  showConnections = false,
}: {
  screens: PrototypeScreen[];
  selectedIndex?: number;
  onSelect?: (index: number) => void;
  showConnections?: boolean;
}) {
  if (screens.length === 0) {
    return (
      <div className="empty-state">
        <LayoutGrid size={28} aria-hidden="true" />
        <p>点击“生成低保真稿”后，这里会出现可编辑的 Frame。</p>
      </div>
    );
  }

  return (
    <div className="prototype-grid">
      {screens.map((screen, index) => (
        <article
          className={`phone-frame ${screen.accent} ${selectedIndex === index ? "selected" : ""} ${showConnections ? "show-connection" : ""}`}
          key={`${screen.name}-${index}`}
          role={onSelect ? "button" : undefined}
          tabIndex={onSelect ? 0 : undefined}
          aria-pressed={onSelect ? selectedIndex === index : undefined}
          onClick={() => onSelect?.(index)}
          onKeyDown={(event) => {
            if (onSelect && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              onSelect(index);
            }
          }}
        >
          <header>
            <span>{screen.name}</span>
            <small>{screen.purpose}</small>
          </header>
          <div className="wire-content">
            {screen.blocks.map((block, index) => (
              <div className="wire-block" key={block}>
                <span>{index + 1}</span>
                <strong>{block}</strong>
              </div>
            ))}
          </div>
          {showConnections && screen.nextScreen && (
            <div className="figma-frame-connection" aria-label={`连接到 ${screen.nextScreen}`}>
              <ArrowRight size={13} aria-hidden="true" />
              <span>{screen.nextScreen}</span>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

export default OfficeApp;
