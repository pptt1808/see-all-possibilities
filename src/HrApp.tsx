import {
  Archive,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Database,
  Eye,
  FileText,
  HeartHandshake,
  Inbox,
  ListChecks,
  Mail,
  MessageCircleMore,
  MoreHorizontal,
  Paperclip,
  Plus,
  RefreshCw,
  Reply,
  Search,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  UserRoundSearch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type HrAppId = "mail" | "chat" | "attendance" | "talent" | "docs" | "meet" | "tasks" | "drive";

type InfoContactId = "mentor" | "manager" | "scheduler" | "talent";
type FollowupPhase = "manager" | "talent" | "employee" | "closed";

type HrChatMessage = {
  id: number;
  role: "scene" | "employee" | "hr";
  text: string;
  cue?: string;
};

type ContactMessage = { id: number; role: "contact" | "hr"; text: string };
type FollowupMessage = { id: number; role: "scene" | "contact" | "hr"; text: string };

type HrState = {
  prepDraftVersion: number;
  recordDraftVersion: number;
  activeApp: HrAppId;
  currentStage: number;
  mailRead: boolean;
  attendanceReviewed: boolean;
  talentReviewed: boolean;
  infoContact: InfoContactId;
  infoMessages: Record<InfoContactId, ContactMessage[]>;
  infoAsked: Record<InfoContactId, number>;
  prepGoal: string;
  prepOpening: string;
  prepQuestions: string[];
  prepBoundary: string;
  prepFollowup: string;
  mentorReviewComplete: boolean;
  interviewMessages: HrChatMessage[];
  interviewTopics: string[];
  interviewComplete: boolean;
  recordFacts: string;
  recordConcerns: string;
  recordQuote: string;
  recordBoundary: string;
  boardNotes: string;
  actionPlanReady: boolean;
  followupPhase: FollowupPhase;
  followupMessages: Record<Exclude<FollowupPhase, "closed">, FollowupMessage[]>;
  followupTurns: Record<Exclude<FollowupPhase, "closed">, number>;
  followupComplete: boolean;
  toast: string | null;
};

type HrDesktopApp = {
  id: HrAppId;
  label: string;
  subtitle: string;
  glyph: string;
  icon: LucideIcon;
};

type HrTimeTransition = {
  from: string;
  to: string;
  title: string;
  detail: string;
};

type HrBoardSignal = {
  id: string;
  source: string;
  title: string;
  detail: string;
  note: string;
};

const HR_STORAGE_KEY = "career-experience-hrbp-v7";
const PREP_DRAFT_VERSION = 1;
const RECORD_DRAFT_VERSION = 1;

const HR_KEYBOARD_ROWS = [
  ["Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "⌫"],
  ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Del"],
  ["Caps", "A", "S", "D", "F", "G", "H", "J", "K", "L", "Enter"],
  ["Fn", "Ctrl", "Alt", "Space", "Alt", "←", "↓", "→"],
] as const;

const HR_APPS: HrDesktopApp[] = [
  { id: "mail", label: "Mail", subtitle: "邮件与通知", glyph: "📮", icon: Mail },
  { id: "chat", label: "People Chat", subtitle: "同事与 Mentor", glyph: "💬", icon: MessageCircleMore },
  { id: "attendance", label: "WorkTime", subtitle: "考勤与排班", glyph: "🗓️", icon: Clock3 },
  { id: "talent", label: "Talent", subtitle: "人才发展系统", glyph: "🪪", icon: Database },
  { id: "docs", label: "Docs", subtitle: "方案与纪要", glyph: "📜", icon: FileText },
  { id: "meet", label: "Meet", subtitle: "面谈与回访", glyph: "🫖", icon: CalendarDays },
  { id: "tasks", label: "Tasks", subtitle: "行动跟踪", glyph: "✅", icon: ListChecks },
  { id: "drive", label: "Drive", subtitle: "案例交付包", glyph: "📦", icon: Sparkles },
];

const INFO_CONTACTS: Record<InfoContactId, {
  name: string;
  role: string;
  avatar: string;
  intro: string;
  prompts: string[];
  replies: string[];
  findings: string[];
}> = {
  mentor: {
    name: "Alex", role: "你的 HR mentor", avatar: "A",
    intro: "我在。别急着约员工，先告诉我你现在缺什么信息。",
    prompts: ["这类面谈最容易犯什么错？", "我该怎样从零搭建面谈，而不是照脚本问？"],
    replies: [
      "最大的问题，是把主管的判断当成事实，再拿面谈去证明它。先把已知、未知和信息边界分开。",
      "别写逐字脚本。先定目标与边界，再准备一个基于事实的开场、几类可自由追问的问题，以及明确的回访承诺。对话会自己长出来。",
    ],
    findings: ["主管评价只能作为假设，不能当作结论", "面谈设计需要目标、事实开场、开放问题、信息边界与回访承诺"],
  },
  manager: {
    name: "周店长", role: "小林的直属主管", avatar: "周",
    intro: "你看到我发的消息了吧？我确实有点担心小林。你想先核实哪一部分？",
    prompts: ["你说的“状态不对”，具体发生过什么？", "最近的管理安排有没有变化？"],
    replies: [
      "销售完成率从 105% 掉到 86%，近四周迟到两次。除此之外更多是我的感觉，他不像以前那么主动接临时班。",
      "最近缺人，我一共找他临时调了 6 次，通常当天或前一晚通知。我以为老员工能理解，但我们确实没有统一的提前沟通规则。",
    ],
    findings: ["业绩与出勤变化可核实；“主动性下降”仍是主管判断", "近四周临时调班 6 次，门店没有统一的提前沟通规则"],
  },
  scheduler: {
    name: "婷婷", role: "同班资深顾问", avatar: "婷",
    intro: "我和小林经常一个班。你放心，我只说我亲眼看到的。",
    prompts: ["最近调班实际是怎么发生的？", "这是小林个人的问题，还是大家都有类似感受？"],
    replies: [
      "我翻了排班群，6 次里有 5 次提前不到 24 小时。上周五那次是晚上十点才说第二天要提前四小时到。",
      "不只小林，大家都觉得通知太临时，只是他最近家里有安排，受影响更明显。我们一般不敢拒绝，怕被说不配合。",
    ],
    findings: ["6 次调班中 5 次提前不足 24 小时；最近一次在 22:00 通知", "调班可预期性是团队层面的机制问题，不宜归因于个人态度"],
  },
  talent: {
    name: "陈姐", role: "区域人才发展伙伴", avatar: "陈",
    intro: "我能查到去年的储备店长项目。你想看流程记录还是当时的评价？",
    prompts: ["去年面谈之后，系统里留下了什么？", "为什么员工一直没有收到反馈？"],
    replies: [
      "记录显示小林业务能力达标，建议补强带教与冲突处理。结论不是淘汰，而是进入下一轮培养观察。",
      "反馈任务当时没有指定负责人，区域和门店都以为对方会跟进，所以一直挂起。这是流程缺口，不是小林表现差。",
    ],
    findings: ["小林业务能力达标，发展项是带教与冲突处理", "储备项目反馈任务因责任人缺失而中断"],
  },
};

const FOLLOWUP_PHASES: Array<{ id: Exclude<FollowupPhase, "closed">; day: string; label: string; peer: string }> = [
  { id: "manager", day: "DAY 1", label: "对齐管理动作", peer: "周店长" },
  { id: "talent", day: "DAY 4", label: "推进发展反馈", peer: "陈姐" },
  { id: "employee", day: "DAY 14", label: "回访员工体验", peer: "小林" },
];

const FOLLOWUP_MIN_TURNS: Record<Exclude<FollowupPhase, "closed">, number> = { manager: 2, talent: 2, employee: 3 };

const FOLLOWUP_DEMO_INPUTS: Record<Exclude<FollowupPhase, "closed">, string[]> = {
  manager: [
    "我会只同步需要解决的工作议题，不转述员工私人细节。",
    "请你明确排班规则、负责人和完成期限。",
  ],
  talent: [
    "这次反馈要让员工知道优势、差距和下一步，而不只是通知结果。",
    "请确认反馈的负责人、时间和系统留痕。",
  ],
  employee: [
    "过去两周，排班通知实际有什么变化？",
    "你收到的发展反馈是否清楚、对你有帮助？",
    "还有什么没有解决，或需要继续观察？",
  ],
};

const DEFAULT_PREP_DRAFT = {
  goal: "理解小林近期工作变化背后的真实经历，确认他的核心诉求、可同步范围与后续安排。",
  opening: "我注意到最近的工作数据、考勤和调班安排有一些变化。今天不是来判断你的态度，我想先听听，这段时间对你来说发生了什么？",
  questions: [
    "最近一次临时调班是怎么发生的？当时怎样通知你，又带来了什么具体影响？",
    "关于去年的储备店长面谈，你后来收到过哪些反馈？现在最希望了解什么？",
    "除了排班和发展反馈，还有没有我们没有看到、但正在影响你工作状态的事情？",
  ],
  boundary: "只向责任人同步解决排班和发展反馈所必需的信息；不逐字转述家庭细节，不承诺晋升结果，也不承诺绝对保密。",
  followup: "面谈后 1 个工作日内确认责任人和行动安排，并在两周后回访，验证排班规则与发展反馈是否真实发生变化。",
};

const DEFAULT_RECORD_DRAFT = {
  facts: "近四周发生 6 次临时调班，其中 5 次通知不足 24 小时；最近一次在前一晚 22:00 通知次日提前 4 小时到店。小林近四周迟到 2 次，此前半年无迟到。去年的储备店长面谈已完成评审，但员工反馈环节因未指定负责人而中断。",
  concerns: "小林希望非紧急调班至少提前两天沟通，并保留说明实际困难的空间；他也希望明确知道储备店长评审中的优势、发展差距和下一次机会，而不是长期等待和猜测。",
  quote: "“我可以接受没选上，但至少想知道差在哪里。”",
  boundary: "可向主管和人才发展伙伴同步排班提前量、反馈流程缺口及员工希望获得明确安排的诉求；不逐字转述家庭细节。仍需验证新排班规则是否持续执行、正式发展反馈是否按期完成。",
};

const LIVE_INTERVIEW_NOTES = [
  {
    time: "14:02",
    title: "入场与初始状态",
    note: "小林表示此次会谈由主管安排；入场后回应简短，视线主要停留在桌面。",
    quote: "“主管让我来的。”",
    comment: "先建立安全感，不把谨慎或沉默解释为不配合。",
  },
  {
    time: "14:06",
    title: "排班变化与迟到",
    note: "多次临时调班在前一晚才通知。小林认为近期两次迟到与班次临时变化有关。",
    quote: "“不是我不愿意配合。”",
    comment: "目前只是员工解释，关联不等于因果；继续追问具体事件和时间。",
  },
  {
    time: "14:12",
    title: "最近一次具体事件",
    note: "上周五 22:00 收到通知，次日需提前 4 小时到店；原有个人安排被迫取消，本月有 3 次类似经历。",
    quote: "“很多调班都到前一天晚上才告诉我。”",
    comment: "私人安排的细节不是解决工作问题所必需，只记录通知方式与工作影响。",
  },
  {
    time: "14:19",
    title: "发展反馈缺口",
    note: "去年参加储备店长面谈后一直没有收到结果或发展反馈；频繁被临时叫回顶班进一步影响公平感。",
    quote: "“公司只在需要我的时候想到我。”",
    comment: "排班与发展反馈看似两件事，实际共同影响员工对尊重和公平的判断。",
  },
  {
    time: "14:27",
    title: "员工提出的具体诉求",
    note: "非紧急调班尽量提前两天沟通；发展项目应明确说明差距和下一次机会。",
    quote: "“不要让我一直猜。”",
    comment: "诉求已足够具体，可以转化为责任人、期限和验证标准。",
  },
  {
    time: "14:34",
    title: "信息同步边界",
    note: "同意同步排班规则和发展反馈问题；不同意转述家庭细节，希望 HR 在同步前说明范围。",
    quote: "“只同步工作问题，不讲我的家庭细节。”",
    comment: "按最小必要原则记录和同步，不承诺绝对保密。",
  },
  {
    time: "14:41",
    title: "下一步与回访约定",
    note: "先推动排班通知方式和一次正式发展反馈；两周后由 HR 回访员工，验证是否真实发生变化。",
    quote: "“到时我会直接告诉你有没有改善。”",
    comment: "行动完成不等于问题解决，闭环最终由员工体验验证。",
  },
] as const;

function createInfoMessages(): Record<InfoContactId, ContactMessage[]> {
  return Object.fromEntries(Object.entries(INFO_CONTACTS).map(([id, contact]) => [id, [{ id: 1, role: "contact", text: contact.intro }]])) as Record<InfoContactId, ContactMessage[]>;
}

function createFollowupMessages(): Record<Exclude<FollowupPhase, "closed">, FollowupMessage[]> {
  return {
    manager: [{ id: 1, role: "scene", text: "面谈后第 1 天 · 你约周店长进行 20 分钟管理对齐。" }, { id: 2, role: "contact", text: "你聊完了？哪些是我需要知道和负责的？" }],
    talent: [{ id: 1, role: "scene", text: "面谈后第 4 天 · 你联系区域人才发展伙伴，推进中断的反馈。" }, { id: 2, role: "contact", text: "我已经把去年的评估记录调出来了。你希望我们怎样补上这次反馈？" }],
    employee: [{ id: 1, role: "scene", text: "面谈后第 14 天 · 约定的回访时间到了。闭环需要由员工体验来验证。" }, { id: 2, role: "contact", text: "谢谢你还记得回来问。最近确实有一些变化，你想先从哪里听？" }],
  };
}

function createDefaultHrState(): HrState {
  return {
    prepDraftVersion: PREP_DRAFT_VERSION,
    recordDraftVersion: RECORD_DRAFT_VERSION,
    activeApp: "mail",
    currentStage: 0,
    mailRead: false,
    attendanceReviewed: false,
    talentReviewed: false,
    infoContact: "mentor",
    infoMessages: createInfoMessages(),
    infoAsked: { mentor: 0, manager: 0, scheduler: 0, talent: 0 },
    prepGoal: DEFAULT_PREP_DRAFT.goal,
    prepOpening: DEFAULT_PREP_DRAFT.opening,
    prepQuestions: [...DEFAULT_PREP_DRAFT.questions],
    prepBoundary: DEFAULT_PREP_DRAFT.boundary,
    prepFollowup: DEFAULT_PREP_DRAFT.followup,
    mentorReviewComplete: false,
    interviewMessages: [],
    interviewTopics: [],
    interviewComplete: false,
    recordFacts: DEFAULT_RECORD_DRAFT.facts,
    recordConcerns: DEFAULT_RECORD_DRAFT.concerns,
    recordQuote: DEFAULT_RECORD_DRAFT.quote,
    recordBoundary: DEFAULT_RECORD_DRAFT.boundary,
    boardNotes: "",
    actionPlanReady: false,
    followupPhase: "manager",
    followupMessages: createFollowupMessages(),
    followupTurns: { manager: 0, talent: 0, employee: 0 },
    followupComplete: false,
    toast: null,
  };
}

function loadHrState(): HrState {
  try {
    const raw = window.localStorage.getItem(HR_STORAGE_KEY);
    if (!raw) return createDefaultHrState();
    const defaults = createDefaultHrState();
    const stored = JSON.parse(raw) as Partial<HrState>;
    const shouldMigratePrepDraft = stored.prepDraftVersion !== PREP_DRAFT_VERSION;
    const shouldMigrateRecordDraft = stored.recordDraftVersion !== RECORD_DRAFT_VERSION;
    return {
      ...defaults,
      ...stored,
      prepDraftVersion: PREP_DRAFT_VERSION,
      prepGoal: shouldMigratePrepDraft ? defaults.prepGoal : stored.prepGoal ?? defaults.prepGoal,
      prepOpening: shouldMigratePrepDraft ? defaults.prepOpening : stored.prepOpening ?? defaults.prepOpening,
      prepQuestions: shouldMigratePrepDraft ? defaults.prepQuestions : stored.prepQuestions ?? defaults.prepQuestions,
      prepBoundary: shouldMigratePrepDraft ? defaults.prepBoundary : stored.prepBoundary ?? defaults.prepBoundary,
      prepFollowup: shouldMigratePrepDraft ? defaults.prepFollowup : stored.prepFollowup ?? defaults.prepFollowup,
      mentorReviewComplete: shouldMigratePrepDraft ? false : stored.mentorReviewComplete ?? defaults.mentorReviewComplete,
      recordDraftVersion: RECORD_DRAFT_VERSION,
      recordFacts: shouldMigrateRecordDraft ? defaults.recordFacts : stored.recordFacts ?? defaults.recordFacts,
      recordConcerns: shouldMigrateRecordDraft ? defaults.recordConcerns : stored.recordConcerns ?? defaults.recordConcerns,
      recordQuote: shouldMigrateRecordDraft ? defaults.recordQuote : stored.recordQuote ?? defaults.recordQuote,
      recordBoundary: shouldMigrateRecordDraft ? defaults.recordBoundary : stored.recordBoundary ?? defaults.recordBoundary,
      infoMessages: { ...defaults.infoMessages, ...stored.infoMessages },
      infoAsked: { ...defaults.infoAsked, ...stored.infoAsked },
      followupMessages: { ...defaults.followupMessages, ...stored.followupMessages },
      followupTurns: { ...defaults.followupTurns, ...stored.followupTurns },
      toast: null,
    };
  } catch {
    return createDefaultHrState();
  }
}

function nextMessageId(messages: ReadonlyArray<{ id: number }>) {
  return (messages[messages.length - 1]?.id ?? 0) + 1;
}

export default function HrApp({ onExit }: { onExit: () => void }) {
  const [state, setState] = useState<HrState>(() => loadHrState());
  const [selectedMailId, setSelectedMailId] = useState("manager-signal");
  const [typing, setTyping] = useState(false);
  const [timeTransition, setTimeTransition] = useState<HrTimeTransition | null>(null);
  const [notesBoardOpen, setNotesBoardOpen] = useState(false);
  const [notesBoardPickingUp, setNotesBoardPickingUp] = useState(false);
  const [notesBoardPuttingDown, setNotesBoardPuttingDown] = useState(false);
  const [infoInput, setInfoInput] = useState("");
  const [questionDraft, setQuestionDraft] = useState("");
  const [interviewInput, setInterviewInput] = useState("");
  const [followupInput, setFollowupInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.localStorage.setItem(HR_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (state.activeApp !== "mail" || selectedMailId !== "manager-signal" || state.mailRead) return;
    setState((previous) => ({
      ...previous,
      mailRead: true,
      currentStage: Math.max(previous.currentStage, 1),
    }));
  }, [selectedMailId, state.activeApp, state.mailRead]);

  useEffect(() => {
    const node = chatScrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [state.interviewMessages.length, state.infoContact, state.infoAsked, state.followupPhase, state.followupTurns, typing, state.activeApp]);

  useEffect(() => {
    const windowBody = document.querySelector<HTMLElement>(".hr-window-body");
    if (windowBody) windowBody.scrollTop = 0;
  }, [state.activeApp]);

  useEffect(() => {
    if (!state.toast) return;
    const timer = window.setTimeout(() => setState((previous) => ({ ...previous, toast: null })), 1700);
    return () => window.clearTimeout(timer);
  }, [state.toast]);

  useEffect(() => {
    if (!notesBoardOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setNotesBoardOpen(false);
      setNotesBoardPuttingDown(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [notesBoardOpen]);

  const activeApp = HR_APPS.find((app) => app.id === state.activeApp) ?? HR_APPS[0];
  const isInterviewMode = state.activeApp === "meet" && state.interviewMessages.length > 0 && !state.interviewComplete;
  const latestEmployeeMessage = [...state.interviewMessages].reverse().find((message) => message.role === "employee");
  const interviewHrTurns = state.interviewMessages.filter((message) => message.role === "hr").length;
  const interviewEmployeeTurns = Math.max(0, state.interviewMessages.filter((message) => message.role === "employee").length - 1);
  const interviewExpressionSequence = [
    { asset: "guarded", label: "保持谨慎" },
    { asset: "hesitant", label: "犹豫说明" },
    { asset: "anxious", label: "回忆具体影响" },
    { asset: "thinking", label: "认真回想" },
    { asset: "explaining", label: "主动说明" },
    { asset: "understood", label: "感到被理解" },
    { asset: "trusting", label: "愿意继续表达" },
  ];
  const interviewEmotion = interviewExpressionSequence[Math.min(interviewEmployeeTurns, interviewExpressionSequence.length - 1)];
  const interviewMoodClass = interviewEmployeeTurns >= 5 ? "trusting" : interviewEmployeeTurns >= 3 ? "relaxed" : "cautious";
  const interviewCharacterAsset = `/assets/hr/xiaolin-v4-${interviewEmotion.asset}.png`;

  const contactedCount = Object.values(state.infoAsked).filter((count) => count > 0).length;
  const infoReady = state.mailRead
    && state.attendanceReviewed
    && state.talentReviewed
    && state.infoAsked.mentor > 0
    && contactedCount >= 3;
  const prepReady = Boolean(
    state.prepGoal.trim().length >= 8
    && state.prepOpening.trim().length >= 18
    && state.prepQuestions.length >= 2
    && state.prepBoundary.trim().length >= 12
    && state.prepFollowup.trim().length >= 8,
  );
  const recordReady = state.recordFacts.trim().length >= 15
    && state.recordConcerns.trim().length >= 12
    && state.recordQuote.trim().length >= 6
    && state.recordBoundary.trim().length >= 12;
  const activeContactScript = INFO_CONTACTS[state.infoContact].prompts[state.infoAsked[state.infoContact]] ?? "";
  const interviewDemoInputs = [
    state.prepOpening || "我注意到最近工作数据和调班有些变化，想听听这段时间对你来说发生了什么。",
    state.prepQuestions[0] || "能具体说说最近一次临时调班是什么时候，又造成了什么影响吗？",
    state.prepQuestions[1] || "去年储备店长面谈后的发展反馈，对你有什么影响？",
    "听起来这些经历让你很失望。你现在最希望公司为你解决什么？",
    "关于今天的信息，你希望我可以向主管同步哪些范围？",
    state.prepFollowup || "我们约两周后回访，届时一起确认排班和反馈是否真的变化，可以吗？",
  ];
  const nextInterviewDemoInput = interviewDemoInputs[interviewHrTurns] ?? "";
  const nextFollowupDemoInput = state.followupPhase === "closed"
    ? ""
    : FOLLOWUP_DEMO_INPUTS[state.followupPhase][state.followupTurns[state.followupPhase]] ?? "";

  useEffect(() => {
    if (state.activeApp === "chat" && !state.actionPlanReady && !typing) setInfoInput(activeContactScript);
  }, [activeContactScript, state.activeApp, state.actionPlanReady, typing]);

  useEffect(() => {
    if (isInterviewMode && !typing) setInterviewInput(nextInterviewDemoInput);
  }, [isInterviewMode, nextInterviewDemoInput, typing]);

  useEffect(() => {
    if (!state.actionPlanReady || state.followupPhase === "closed" || typing) return;
    const isVisibleConversation = state.followupPhase === "employee" ? state.activeApp === "meet" : state.activeApp === "chat";
    if (isVisibleConversation) setFollowupInput(nextFollowupDemoInput);
  }, [nextFollowupDemoInput, state.actionPlanReady, state.activeApp, state.followupPhase, typing]);

  function getAppNudge(): { appId: HrAppId; text: string } | null {
    if (!state.mailRead) return { appId: "mail", text: "Inbox 有一封主管新邮件" };
    if (!state.infoAsked.mentor) return { appId: "chat", text: "先在 People Chat 找 Mentor 校准思路" };
    if (!state.attendanceReviewed) return { appId: "attendance", text: "去 WorkTime 核对考勤与调班记录" };
    if (!state.talentReviewed) return { appId: "talent", text: "Talent 中有一条中断的发展流程" };
    if (contactedCount < 3) return { appId: "chat", text: "再联系知情同事，补齐现场信息" };
    if (!state.mentorReviewComplete) return { appId: "docs", text: prepReady ? "Docs 已预填草案，发给 Mentor 反馈" : "回 Docs 补全面谈草案" };
    if (!state.interviewMessages.length) return { appId: "meet", text: "面谈方案通过，Meet 已生成会议" };
    if (!state.interviewComplete) return { appId: "meet", text: "员工面谈仍在进行" };
    if (!recordReady) return { appId: "docs", text: "回 Docs 整理事实、诉求与同步边界" };
    if (!state.actionPlanReady) return { appId: "tasks", text: "根据纪要创建责任人与期限" };
    if (state.followupPhase === "manager" || state.followupPhase === "talent") return { appId: "chat", text: "行动卡已生成，去联系责任人" };
    if (state.followupPhase === "employee") return { appId: "meet", text: "DAY 14 员工回访已经到期" };
    if (state.followupComplete) return { appId: "drive", text: "闭环文件已可以归档" };
    return null;
  }

  function resolveContactReply(contactId: InfoContactId, turn: number) {
    const contact = INFO_CONTACTS[contactId];
    return contact.replies[Math.min(turn, contact.replies.length - 1)];
  }

  function askContact(question: string) {
    const trimmed = question.trim();
    if (!trimmed || typing) return;
    const contactId = state.infoContact;
    const turn = state.infoAsked[contactId];
    setInfoInput("");
    setState((previous) => ({
      ...previous,
      infoMessages: {
        ...previous.infoMessages,
        [contactId]: [...previous.infoMessages[contactId], { id: nextMessageId(previous.infoMessages[contactId]), role: "hr", text: trimmed }],
      },
    }));
    setTyping(true);
    window.setTimeout(() => {
      setState((previous) => ({
        ...previous,
        infoAsked: { ...previous.infoAsked, [contactId]: previous.infoAsked[contactId] + 1 },
        infoMessages: {
          ...previous.infoMessages,
          [contactId]: [...previous.infoMessages[contactId], { id: nextMessageId(previous.infoMessages[contactId]), role: "contact", text: resolveContactReply(contactId, turn) }],
        },
      }));
      setTyping(false);
    }, 520);
  }

  function updatePrep(patch: Partial<Pick<HrState, "prepGoal" | "prepOpening" | "prepQuestions" | "prepBoundary" | "prepFollowup">>) {
    setState((previous) => ({ ...previous, ...patch, mentorReviewComplete: false }));
  }

  function detectInterviewTopics(input: string) {
    const topics: string[] = [];
    if (/调班|排班|通知|出勤|迟到/.test(input)) topics.push("排班经历");
    if (/发展|晋升|储备|店长|反馈|成长/.test(input)) topics.push("发展反馈");
    if (/影响|具体|例子|一次|什么时候|家人|医院/.test(input)) topics.push("具体影响");
    if (/感受|失望|怎么看|为什么|心情|在意/.test(input)) topics.push("真实感受");
    if (/希望|需要|想要|解决|期待/.test(input)) topics.push("员工诉求");
    if (/保密|同步|告诉|转达|范围|隐私/.test(input)) topics.push("同步边界");
    if (/下一步|回访|之后|什么时候|跟进/.test(input)) topics.push("后续约定");
    return topics;
  }

  function employeeResponse(turn: number) {
    const responses = [
      "最近确实有点乱。不是我不愿意配合，是很多调班都到前一天晚上才告诉我。我有两次迟到也和临时改班之后没调整过来有关。",
      "上周五晚上十点，我才收到第二天提前四小时到店的消息。我已经答应陪家人去医院，最后只能临时取消。类似的事这个月已经三次了。",
      "去年我参加储备店长面谈后就没有下文了。我可以接受没选上，但至少想知道差在哪里。后来缺人又总先找我顶班，我会觉得公司只在需要我的时候想到我。",
      "我不是要求特殊照顾。我希望非紧急调班能尽量提前两天说；发展项目也请明确告诉我差距和下一次机会，不要让我一直猜。",
      "我最担心的是这些话被原样转给主管。如果只同步排班规则和发展反馈，不讲我的家庭细节，我可以接受。你也会在同步前告诉我，对吗？",
      "可以。我希望先看到调班通知真的有变化，也想收到一次正式的发展反馈。我们两周后再聊一次，到时我会直接告诉你有没有改善。",
    ];
    return responses[Math.min(turn, responses.length - 1)];
  }

  function startInterview() {
    setNotesBoardOpen(false);
    setNotesBoardPickingUp(false);
    setNotesBoardPuttingDown(false);
    if (state.interviewMessages.length > 0) {
      setState((previous) => ({ ...previous, activeApp: "meet", currentStage: Math.max(previous.currentStage, 3) }));
      return;
    }
    setState((previous) => {
      const messages: HrChatMessage[] = [
        { id: 1, role: "scene", text: "Meeting Room 2 · 这段 Demo 用 6 个固定沟通节点完整呈现一次真实面谈。点击发送预置话术，观察事实、影响、诉求与边界如何逐步浮现。" },
        { id: 2, role: "employee", text: "（把水杯放在桌边，双手交握）……主管让我来的。", cue: "他只在进门时看了你一眼，随后一直盯着桌面。" },
      ];
      return {
        ...previous,
        activeApp: "meet",
        currentStage: Math.max(previous.currentStage, 3),
        interviewMessages: messages,
        toast: "线下面谈已开始",
      };
    });
  }

  function sendInterviewTurn(message?: string) {
    const trimmed = (message ?? interviewInput).trim();
    if (!trimmed || typing || state.interviewComplete || state.activeApp !== "meet") return;
    const turn = interviewHrTurns;
    const topics = detectInterviewTopics(trimmed);
    setInterviewInput("");
    setState((previous) => ({
      ...previous,
      interviewTopics: [...new Set([...previous.interviewTopics, ...topics])],
      interviewMessages: [...previous.interviewMessages, { id: nextMessageId(previous.interviewMessages), role: "hr", text: trimmed }],
    }));
    setTyping(true);
    window.setTimeout(() => {
      setState((previous) => {
        const response = employeeResponse(turn);
        const cue = turn >= 4 ? "他开始与你确认可以落地的下一步。" : turn >= 2 ? "他停顿了一会儿，继续补充细节。" : "他观察了一下你的反应，语速仍然很慢。";
        const messages: HrChatMessage[] = [
          ...previous.interviewMessages,
          { id: nextMessageId(previous.interviewMessages), role: "employee", text: response, cue },
        ];
        return { ...previous, interviewMessages: messages };
      });
      setTyping(false);
    }, 620);
  }

  function playTimeTransition(transition: HrTimeTransition, onComplete: () => void) {
    if (timeTransition) return;
    setTimeTransition(transition);
    window.setTimeout(onComplete, 720);
    window.setTimeout(() => setTimeTransition(null), 1420);
  }

  function followupResponse(phase: Exclude<FollowupPhase, "closed">, turn: number) {
    if (phase === "manager") {
      return turn === 0
        ? "我明白了。你没有转述他的家庭细节，这个边界我接受。临时调班确实是管理安排的问题，不该简单理解成不配合。你希望我先做什么？"
        : "好。本周五前我会在排班群明确：非紧急调班至少提前 48 小时征询本人，紧急情况说明原因且允许拒绝。我会把执行截图发给你。";
    }
    if (phase === "talent") {
      return turn === 0
        ? "同意。这次不能只告诉他‘没选上’，要把业务优势、带教和冲突处理的发展项说清楚，也要给到下一次观察机会。"
        : "我来做反馈材料 owner，周店长参与业务案例说明。我们约在本周四 15:00，共同给小林反馈，结束后由我更新人才系统。";
    }
    const employeeReplies = [
      "排班这两周确实不一样了。只有一次紧急顶班，店长提前解释了原因，也先问我能不能来。至少我现在可以安排自己的时间。",
      "发展反馈也补上了。陈姐讲了我业务能力的优势，也说带教和处理冲突还需要案例。我最在意的是终于知道下一步该做什么。",
      "我希望这不是只持续两周。可以一个月后再看一次排班规则，也希望实践任务结束时有人主动反馈。除此之外，我愿意继续投入。",
    ];
    return employeeReplies[Math.min(turn, employeeReplies.length - 1)];
  }

  function sendFollowupTurn(message?: string) {
    if (state.followupPhase === "closed" || typing) return;
    const phase = state.followupPhase;
    const trimmed = (message ?? followupInput).trim();
    if (!trimmed) return;
    const turn = state.followupTurns[phase];
    setFollowupInput("");
    setState((previous) => ({
      ...previous,
      followupMessages: {
        ...previous.followupMessages,
        [phase]: [...previous.followupMessages[phase], { id: nextMessageId(previous.followupMessages[phase]), role: "hr", text: trimmed }],
      },
    }));
    setTyping(true);
    window.setTimeout(() => {
      setState((previous) => ({
        ...previous,
        followupTurns: { ...previous.followupTurns, [phase]: previous.followupTurns[phase] + 1 },
        followupMessages: {
          ...previous.followupMessages,
          [phase]: [...previous.followupMessages[phase], { id: nextMessageId(previous.followupMessages[phase]), role: "contact", text: followupResponse(phase, turn) }],
        },
      }));
      setTyping(false);
    }, 560);
  }

  function completeFollowupPhase() {
    if (state.followupPhase === "closed") return;
    const currentIndex = FOLLOWUP_PHASES.findIndex((phase) => phase.id === state.followupPhase);
    const current = FOLLOWUP_PHASES[currentIndex];
    const next = FOLLOWUP_PHASES[currentIndex + 1];
    if (next) {
      playTimeTransition({
        from: current.day,
        to: next.day,
        title: `${next.day} · ${next.label}`,
        detail: current.id === "manager"
          ? "排班规则已经对齐，等待几天观察执行，再推进中断的发展反馈。"
          : "发展反馈责任人已经确认，给组织留出落实时间，再回到员工验证体验。",
      }, () => {
        setState((previous) => ({ ...previous, followupPhase: next.id, activeApp: "tasks", toast: `${next.day} · ${next.label}` }));
        setFollowupInput("");
      });
      return;
    }
    playTimeTransition({
      from: "DAY 14",
      to: "DAY 30",
      title: "回访完成 · 进入持续验证",
      detail: "员工确认了当前变化，案例进入归档；一个月后仍需复查规则是否稳定执行。",
    }, () => setState((previous) => ({ ...previous, followupPhase: "closed", followupComplete: true, activeApp: "tasks", toast: "员工回访完成，工作闭环已形成" })));
  }

  function moveTo(app: HrAppId, stage: number, toast?: string) {
    setState((previous) => ({
      ...previous,
      activeApp: app,
      currentStage: Math.max(previous.currentStage, stage),
      toast: toast ?? null,
    }));
  }

  function openApp(app: HrDesktopApp) {
    setState((previous) => ({ ...previous, activeApp: app.id, toast: `正在打开 ${app.label}` }));
  }

  function getBoardSignals(): HrBoardSignal[] {
    const signals: HrBoardSignal[] = [];
    if (state.mailRead) {
      signals.push({
        id: "mail-signal",
        source: "Mail",
        title: "主管邮件：这是线索，不是结论",
        detail: "业绩和出勤变化、主动性下降是主管的观察，需要继续核实原因。",
        note: "[Mail] 主管提出业绩与出勤变化，并判断主动性下降；先保留为待验证假设，不把标签当事实。",
      });
    }
    if (state.attendanceReviewed) {
      signals.push({
        id: "worktime-signal",
        source: "WorkTime",
        title: "近四周排班与考勤",
        detail: "6 次排班变更，5 次通知不足 24 小时；迟到 2 次，销售完成率 105% → 86%。",
        note: "[WorkTime] 近四周排班变更 6 次，其中 5 次通知不足 24 小时；迟到 2 次，完成率从 105% 降到 86%。",
      });
    }
    if (state.talentReviewed) {
      signals.push({
        id: "talent-signal",
        source: "Talent",
        title: "储备店长发展流程停滞",
        detail: "评审结论为业务能力达标，发展项是带教与冲突处理；反馈任务停滞 248 天，未指定负责人。",
        note: "[Talent] 小林业务能力达标，发展项为带教与冲突处理；反馈因未指定负责人停滞 248 天。",
      });
    }
    (Object.keys(INFO_CONTACTS) as InfoContactId[]).forEach((id) => {
      INFO_CONTACTS[id].findings.slice(0, Math.min(state.infoAsked[id], INFO_CONTACTS[id].findings.length)).forEach((finding, index) => {
        signals.push({
          id: `chat-${id}-${index}`,
          source: "People Chat",
          title: `${INFO_CONTACTS[id].name} · ${index === 0 ? "现场信息" : "补充判断"}`,
          detail: finding,
          note: `[People Chat · ${INFO_CONTACTS[id].name}] ${finding}`,
        });
      });
    });
    return signals;
  }

  function getPendingBoardSignals() {
    return getBoardSignals().filter((signal) => !state.boardNotes.includes(signal.note));
  }

  function appendBoardNote(note: string) {
    setState((previous) => {
      if (previous.boardNotes.includes(note)) return { ...previous, toast: "这条线索已经在记录板上" };
      const nextNotes = previous.boardNotes.trim() ? `${previous.boardNotes.trim()}\n\n${note}` : note;
      return { ...previous, boardNotes: nextNotes, toast: "线索已摘录到纸面" };
    });
  }

  function pickUpNotesBoard() {
    if (notesBoardOpen || notesBoardPickingUp || notesBoardPuttingDown || isInterviewMode) return;
    setNotesBoardPickingUp(true);
  }

  function putDownNotesBoard() {
    if (!notesBoardOpen || notesBoardPuttingDown) return;
    setNotesBoardOpen(false);
    setNotesBoardPuttingDown(true);
  }

  function renderNotesBoard() {
    const allSignals = getBoardSignals();
    const signals = getPendingBoardSignals();
    const excerptedCount = allSignals.length - signals.length;
    return (
      <aside className="hr-notes-board-window" aria-label="HR 前期调查记录板">
        <header>
          <div><span className="hr-notes-board-doc-icon"><FileText size={17} /></span><div><strong>调查记录板</strong><small>CASE 07 · 随调查持续更新</small></div></div>
        </header>
        <div className="hr-notes-board-body">
          <section className="hr-board-sync-section">
            <div className="hr-board-section-title"><div><span>待摘录素材</span><small>{signals.length} 条待摘录 · {excerptedCount} 条已写入纸面</small></div><span className="hr-board-live-dot">待整理</span></div>
            {allSignals.length === 0
              ? <p className="hr-board-empty">打开 Mail、WorkTime、Talent，并在 People Chat 联系知情人后，相关线索会出现在这里。</p>
              : signals.length === 0
                ? <p className="hr-board-empty done">当前收集的素材已全部摘录到右侧纸面。继续调查后，新素材会再次出现在这里。</p>
              : signals.map((signal) => <article className="hr-board-signal-card" key={signal.id}><div><small>{signal.source}</small><strong>{signal.title}</strong><p>{signal.detail}</p></div><button type="button" onClick={() => appendBoardNote(signal.note)}>摘录到纸面</button></article>)}
          </section>
          <section className="hr-board-writing-section">
            <div className="hr-board-section-title"><div><span>我的判断与心得</span><small>边调查边记录，不要求一次写完</small></div><FileText size={15} /></div>
            <textarea value={state.boardNotes} onChange={(event) => setState((previous) => ({ ...previous, boardNotes: event.target.value }))} placeholder="记录你的假设、矛盾点、待核实问题或面谈灵感……" />
            <small className="hr-board-autosave">自动保存到本案例 · 你可以随时修改</small>
          </section>
        </div>
        <footer><span>记录板不是结论库</span><p>把事实、员工体验和你的假设分开，面谈方案会更可靠。</p></footer>
      </aside>
    );
  }

  function renderBrief() {
    const mails = [
      {
        id: "manager-signal", sender: "周店长", label: "员工关系", subject: "请协助看看小林最近的状态", preview: "最近一个月业绩和出勤都有变化，我担心还有管理上没看到的问题。", time: "09:08", unread: !state.mailRead, starred: true,
        from: "zhou.manager@possibility.local", to: "you.hrbp@possibility.local", cc: "", attachments: ["门店月度经营摘要.xlsx"],
        body: [
          "最近一个月，小林的业绩和出勤都有些变化。我感觉他主动性下降了，也不像以前那么愿意配合临时调班。",
          "他去年参加过储备店长面谈。最近问他情况，他只说没什么。我担心他已经在看别的机会。",
          "你能不能先看一下，再找他聊聊？我想知道是能力、态度，还是管理上有什么没看到的问题。",
        ],
      },
      {
        id: "welcome", sender: "People Ops", label: "系统", subject: "欢迎使用 HR 工作空间", preview: "Mail、People Chat、WorkTime、Talent 与 Docs 已为你开通。", time: "08:30", unread: false, starred: false,
        from: "ops@possibility.local", to: "you.hrbp@possibility.local", cc: "", attachments: [],
        body: ["你的 HRBP 办公软件已经开通。工作线索会出现在不同软件中，请根据邮件、系统记录与同事沟通形成判断。", "左侧图标都是办公软件，不代表固定流程；你可以随时打开和来回核对。"],
      },
      {
        id: "policy", sender: "员工关系 COE", label: "知识库", subject: "员工沟通的信息使用边界", preview: "只同步解决工作问题所必需的信息，不承诺绝对保密。", time: "昨天", unread: false, starred: true,
        from: "er.coe@possibility.local", to: "all-hrbp@possibility.local", cc: "", attachments: ["员工沟通边界指引.pdf"],
        body: ["员工沟通中，不完整转发员工逐字表达，只向责任人同步解决工作问题所必需的信息。", "涉及安全、合规或必须升级处理的情况，应提前向员工说明信息如何使用。"],
      },
    ];
    const selectedMail = mails.find((mail) => mail.id === selectedMailId) ?? mails[0];

    return (
      <div className="room-layout brief-room hr-mail-room">
        <section className="mail-app-shell">
          <header className="mail-topbar">
            <div className="mail-brand"><button className="mail-icon-button" type="button" aria-label="返回列表"><Inbox size={16} /></button><div className="mail-brand-copy"><strong>Mail</strong><small>possibility.local</small></div></div>
            <label className="mail-searchbar"><Search size={16} /><input type="text" value="Search mail" readOnly aria-label="Search mail" /></label>
            <div className="mail-toolbar"><button className="mail-icon-button" type="button" aria-label="Archive"><Archive size={16} /></button><button className="mail-icon-button" type="button" aria-label="More"><MoreHorizontal size={16} /></button></div>
          </header>
          <div className="mail-shell">
            <aside className="mail-sidebar">
              <button className="mail-compose-button" type="button"><Plus size={16} /> New message</button>
              <div className="mail-folders"><span className="active"><Inbox size={16} /> Inbox <strong>{state.mailRead ? 0 : 1}</strong></span><span><Reply size={16} /> Sent</span><span><Archive size={16} /> Archive</span><span><FileText size={16} /> Drafts</span></div>
            </aside>
            <section className="mail-list-pane">
              <div className="mail-list-head"><p className="eyebrow">Inbox</p><strong>3 conversations</strong></div>
              <div className="mail-list">{mails.map((mailItem) => <button className={`mail-item ${selectedMail.id === mailItem.id ? "active" : ""} ${mailItem.unread ? "unread" : ""}`} type="button" key={mailItem.id} onClick={() => { setSelectedMailId(mailItem.id); if (mailItem.id === "manager-signal") setState((previous) => ({ ...previous, mailRead: true, currentStage: Math.max(previous.currentStage, 1), toast: "主管邮件已读 · 需要继续核实" })); }}><div className="mail-item-head"><div className={`mail-avatar ${mailItem.unread ? "amber" : "teal"}`}>{mailItem.sender.slice(0, 1)}</div><div className="mail-item-meta"><strong>{mailItem.sender}</strong><span>{mailItem.label}</span></div></div><strong className="mail-subject">{mailItem.subject}</strong><p>{mailItem.preview}</p><div className="mail-item-foot"><span>{mailItem.time}</span>{mailItem.starred && <Sparkles size={13} />}</div></button>)}</div>
            </section>
            <main className="mail-reader">
              <div className="mail-reader-head"><div><p className="eyebrow">Inbox</p><h2>{selectedMail.subject}</h2></div><div className="mail-reader-actions"><button className="mail-icon-button" type="button" aria-label="Reply"><Reply size={16} /></button><button className="mail-icon-button" type="button" aria-label="Archive"><Archive size={16} /></button></div></div>
              <div className="mail-envelope-meta"><div><span>From</span><strong>{selectedMail.sender} &lt;{selectedMail.from}&gt;</strong></div><div><span>To</span><strong>{selectedMail.to}</strong></div><div><span>CC</span><strong>{selectedMail.cc || "-"}</strong></div><div><span>Time</span><strong>{selectedMail.time}</strong></div></div>
              <div className="mail-body">{selectedMail.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
              <div className="mail-attachment-row">{selectedMail.attachments.map((attachment) => <span className="mail-attachment" key={attachment}><Paperclip size={14} />{attachment}</span>)}</div>
              {selectedMail.id === "manager-signal" && <div className="hr-mail-reader-note"><strong>原始邮件只提供了信号，不是结论</strong><span>接下来可以去 People Chat 找人沟通，也可以去 WorkTime / Talent 核对正式记录。</span><button type="button" onClick={() => moveTo("chat", 1, "正在打开 People Chat")}>打开 People Chat <ArrowRight size={14} /></button></div>}
            </main>
          </div>
        </section>
      </div>
    );
  }

  function renderProfile() {
    if (state.actionPlanReady && (state.followupPhase === "manager" || state.followupPhase === "talent")) return renderFollowup();

    const contact = INFO_CONTACTS[state.infoContact];
    const messages = state.infoMessages[state.infoContact];
    const boardSignals = getBoardSignals();

    return (
      <div className="hr-workbench-page hr-research-page hr-people-chat-room">
        <header className="hr-chat-workspace-head"><div><p>HR 工作空间</p><h2>People Chat</h2><span>和 Mentor、主管及同事沟通；聊天信息仍需与正式系统记录相互核对。</span></div><div><Search size={15} /><MoreHorizontal size={15} /></div></header>

        <div className="hr-research-layout">
          <aside className="hr-contact-list" aria-label="可联系同事">
            <span className="hr-work-label">工作通讯录 · {contactedCount}/4 已联系</span>
            {(Object.keys(INFO_CONTACTS) as InfoContactId[]).map((id) => {
              const item = INFO_CONTACTS[id];
              return (
                <button className={state.infoContact === id ? "active" : ""} type="button" onClick={() => { setState((previous) => ({ ...previous, infoContact: id })); setInfoInput(INFO_CONTACTS[id].prompts[state.infoAsked[id]] ?? ""); }} key={id}>
                  <span>{item.avatar}</span><div><strong>{item.name}</strong><small>{item.role}</small></div>
                  {state.infoAsked[id] > 0 && <CheckCircle2 size={15} />}
                </button>
              );
            })}
            <div className="hr-system-baseline"><small>系统基线</small><p>完成率 105% → 86%<br />近四周迟到 2 次</p></div>
          </aside>

          <section className="hr-contact-chat">
            <header><span>{contact.avatar}</span><div><strong>{contact.name}</strong><small>{contact.role} · 在线</small></div></header>
            <div className="hr-contact-thread" ref={chatScrollRef}>
              {messages.map((message) => (
                <div className={`hr-contact-message ${message.role}`} key={message.id}>
                  <small>{message.role === "hr" ? "你 · HRBP" : contact.name}</small><p>{message.text}</p>
                </div>
              ))}
              {typing && <div className="hr-contact-message contact"><small>{contact.name}</small><div className="hr-chat-typing"><span /><span /><span /></div></div>}
            </div>
            <div className="hr-prefilled-composer-note"><Sparkles size={13} /><span>{activeContactScript ? "下一句已按当前沟通进度固定预填，点击发送继续" : "这段演示对话已完成，可以切换其他联系人"}</span></div>
            <div className="hr-chat-inputrow">
              <textarea value={infoInput} readOnly placeholder={activeContactScript ? `发送给${contact.name}` : "当前联系人暂无新的演示消息"} rows={2} />
              <button type="button" disabled={!infoInput.trim() || typing} onClick={() => askContact(infoInput)} aria-label="发送消息"><SendHorizontal size={17} /></button>
            </div>
          </section>

          <aside className="hr-field-notes hr-board-teaser">
            <span className="hr-board-teaser-icon"><ClipboardList size={24} /></span>
            <div><span className="hr-work-label">调查记录已移至桌面记录板</span><strong>{boardSignals.length ? `已收集 ${boardSignals.length} 条调查素材` : "等待第一条调查线索"}</strong><p>拿起键盘旁的纸质记录板，可以把 Mail、WorkTime、Talent 和同事沟通中的关键信息摘录下来，也可以直接写判断与心得。</p></div>
            <button type="button" onClick={pickUpNotesBoard}>拿起桌面记录板 <ArrowRight size={14} /></button>
          </aside>
        </div>

        <div className="hr-workbench-footer"><small>{infoReady ? "邮件、正式记录与多方沟通已能互相印证，可以去 Docs 写面谈方案。" : "保持沟通，同时记得去 WorkTime 与 Talent 核对正式记录。"}</small><button className="hr-primary-action" type="button" onClick={() => moveTo(!state.attendanceReviewed ? "attendance" : !state.talentReviewed ? "talent" : infoReady ? "docs" : "chat", 2, "切换工作软件")}>{!state.attendanceReviewed ? "打开 WorkTime" : !state.talentReviewed ? "打开 Talent" : infoReady ? "去 Docs 写面谈方案" : "继续联系知情人"} <ArrowRight size={16} /></button></div>
      </div>
    );
  }

  function renderAttendance() {
    const rows = [
      { date: "06/03 周一", plan: "09:00-18:00", actual: "09:03-18:12", change: "无", status: "正常" },
      { date: "06/07 周五", plan: "13:00-22:00", actual: "13:00-22:06", change: "22:00 通知次日提前", status: "临时调班" },
      { date: "06/08 周六", plan: "09:00-18:00", actual: "09:14-18:09", change: "提前 4 小时到店", status: "迟到 14 分" },
      { date: "06/13 周四", plan: "13:00-22:00", actual: "13:00-22:02", change: "提前 9 小时通知", status: "临时调班" },
      { date: "06/17 周一", plan: "09:00-18:00", actual: "09:11-18:20", change: "前晚通知改班", status: "迟到 11 分" },
      { date: "06/24 周一", plan: "13:00-22:00", actual: "13:00-22:08", change: "无", status: "正常" },
    ];
    return (
      <div className="hr-system-app hr-worktime-app">
        <header className="hr-system-toolbar"><div><span className="hr-system-logo"><Clock3 size={18} /></span><div><strong>WorkTime</strong><small>考勤与排班管理</small></div></div><label><Search size={14} /><input readOnly value="员工：小林 · 近四周" /></label><button type="button"><CalendarDays size={14} /> 06/01-06/28</button></header>
        <section className="hr-system-summary"><article><small>排班变更</small><strong>6</strong><span>近四周</span></article><article><small>不足 24h 通知</small><strong>5</strong><span>其中 1 次 22:00</span></article><article><small>迟到</small><strong>2</strong><span>此前半年 0 次</span></article><article><small>销售完成率</small><strong>86%</strong><span>上月 105%</span></article></section>
        <section className="hr-system-table"><header><span>日期</span><span>原排班</span><span>实际打卡</span><span>排班变更记录</span><span>状态</span></header>{rows.map((row) => <article key={row.date}><strong>{row.date}</strong><span>{row.plan}</span><span>{row.actual}</span><p>{row.change}</p><em className={row.status === "正常" ? "normal" : "alert"}>{row.status}</em></article>)}</section>
        <aside className="hr-system-insight"><ShieldCheck size={18} /><div><strong>记录能证明发生了什么，不能自动解释为什么</strong><p>调班频率、通知提前量与迟到时间存在关联；是否构成团队机制问题，还需要结合主管和同事信息。</p></div><button type="button" className={state.attendanceReviewed ? "done" : ""} onClick={() => setState((previous) => ({ ...previous, attendanceReviewed: true, currentStage: Math.max(previous.currentStage, 2), toast: "WorkTime 记录已加入调查素材" }))}>{state.attendanceReviewed ? "✓ 已核对记录" : "标记为已核对"}</button></aside>
      </div>
    );
  }

  function renderTalent() {
    return (
      <div className="hr-system-app hr-talent-app">
        <header className="hr-system-toolbar"><div><span className="hr-system-logo"><UserRoundSearch size={18} /></span><div><strong>Talent Hub</strong><small>人才档案与发展流程</small></div></div><label><Search size={14} /><input readOnly value="搜索：林亦辰 / 储备店长" /></label><button type="button"><MoreHorizontal size={15} /> 更多</button></header>
        <div className="hr-talent-layout">
          <aside className="hr-talent-profile"><span>林</span><h3>林亦辰（小林）</h3><p>资深门店顾问 · 在职 3 年 7 个月</p><dl><div><dt>当前绩效</dt><dd>稳定贡献者</dd></div><div><dt>发展意向</dt><dd>门店管理</dd></div><div><dt>最近项目</dt><dd>储备店长 2025</dd></div></dl></aside>
          <main className="hr-talent-process"><header><div><p>DEVELOPMENT PROCESS</p><h2>储备店长项目 · 2025 秋季批次</h2></div><span className="stalled">流程停滞 248 天</span></header><div className="hr-talent-steps"><article className="done"><b>✓</b><div><strong>报名与资格审核</strong><small>2025/10/18 · 已完成</small></div></article><article className="done"><b>✓</b><div><strong>能力面谈</strong><small>2025/11/06 · 已完成</small></div></article><article className="done"><b>✓</b><div><strong>评审结论</strong><small>业务能力达标；发展项：带教、冲突处理</small></div></article><article className="blocked"><b>!</b><div><strong>员工反馈</strong><small>未指定负责人 · 未发送 · 已逾期</small></div></article><article><b>5</b><div><strong>培养观察</strong><small>等待反馈完成后启动</small></div></article></div><aside className="hr-process-warning"><strong>流程并非“未通过”</strong><p>区域与门店都以为对方会负责反馈，任务没有 owner，导致员工始终不知道评审结果和下一步。</p></aside></main>
        </div>
        <div className="hr-system-footer"><small>系统记录揭示的是流程责任缺口。建议联系区域人才伙伴确认反馈安排。</small><button className={state.talentReviewed ? "done" : ""} type="button" onClick={() => setState((previous) => ({ ...previous, talentReviewed: true, currentStage: Math.max(previous.currentStage, 2), toast: "Talent 流程记录已加入调查素材" }))}>{state.talentReviewed ? "✓ 已核对流程" : "标记为已核对"}</button></div>
      </div>
    );
  }

  function renderDocs() {
    function addQuestion() {
      const question = questionDraft.trim();
      if (!question) return;
      updatePrep({ prepQuestions: [...state.prepQuestions, question] });
      setQuestionDraft("");
    }

    if (state.interviewComplete) return renderRecord();

    return (
      <div className="hr-prep-page hr-workbench-page hr-conversation-plan">
        <header className="hr-section-header"><div><p>CO-DESIGN WITH MENTOR · 面谈共创</p><h2>面谈草案已预输入，可以直接审阅和发送</h2><span>系统已根据当前案例生成可编辑草案；你可以按演示流程直接使用，也可以修改措辞后再让 mentor 检查。</span></div><ShieldCheck size={34} /></header>

        <div className="hr-prep-builder">
          <section className="hr-plan-canvas">
            <label><span><b>01</b>这次面谈要完成什么？</span><small>写目标，不写你预设的结论</small><textarea rows={2} value={state.prepGoal} onChange={(event) => updatePrep({ prepGoal: event.target.value })} placeholder="例如：我希望理解……并确认……" /></label>
            <label><span><b>02</b>你准备怎样开场？</span><small>只引用可核实的事实，并把解释权交给员工</small><textarea rows={3} value={state.prepOpening} onChange={(event) => updatePrep({ prepOpening: event.target.value })} placeholder="请完整写出你会说的开场白……" /></label>

            <div className="hr-question-builder">
              <header><span><b>03</b>你想带进会谈的开放问题</span><small>它们是备用路标，不是固定轮次</small></header>
              <div className="hr-question-add"><input value={questionDraft} onChange={(event) => setQuestionDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addQuestion(); } }} placeholder="写一个能让员工讲述经历的问题…" /><button type="button" onClick={addQuestion}><Plus size={14} /> 添加</button></div>
              {state.prepQuestions.length > 0 && <div className="hr-created-questions">{state.prepQuestions.map((question, index) => <div key={`${question}-${index}`}><b>{index + 1}</b><span>{question}</span><button type="button" onClick={() => updatePrep({ prepQuestions: state.prepQuestions.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`删除问题：${question}`}>×</button></div>)}</div>}
            </div>

            <div className="hr-prep-two-fields">
              <label><span><b>04</b>信息边界</span><small>哪些可以同步？哪些不做承诺？</small><textarea rows={3} value={state.prepBoundary} onChange={(event) => updatePrep({ prepBoundary: event.target.value })} placeholder="写下你会向员工说明的边界……" /></label>
              <label><span><b>05</b>回访承诺</span><small>何时回来、验证什么？</small><textarea rows={3} value={state.prepFollowup} onChange={(event) => updatePrep({ prepFollowup: event.target.value })} placeholder="写下清晰的回访时间与目的……" /></label>
            </div>
          </section>

          <aside className="hr-mentor-review">
            <header><span>A</span><div><strong>Alex · mentor</strong><small>检查草案逻辑、开放性与信息边界</small></div></header>
            {!state.mentorReviewComplete ? (
              <div className="hr-mentor-empty"><p>{prepReady && infoReady ? "草案已经成形，相关信息也已核实。发给我，我会从目标、开场、开放性和边界四个角度反馈。" : prepReady ? "草案已预填完整，可以直接发送演示。Mail、WorkTime、Talent 或多方沟通中尚未核实的内容会继续提醒，但不再锁定发送。" : "草案有必填内容被删减了。补全目标、开场、至少两个问题、信息边界和回访承诺后即可发送。"}</p><button type="button" disabled={!prepReady} onClick={() => setState((previous) => ({ ...previous, mentorReviewComplete: true, toast: "Alex 已返回方案反馈" }))}>发送草案，请 mentor 反馈</button></div>
            ) : (
              <div className="hr-mentor-feedback"><span><CheckCircle2 size={16} /> 草案可进入真实会谈</span><p>你的方案已经有目标和边界。记住：<strong>问题不是顺序表</strong>。现场要跟随员工刚刚说出的词，追问具体事件、影响和诉求。</p><p>如果员工带出新主题，允许路线改变；结束前再确认同步范围与回访时间。</p></div>
            )}
            <div className="hr-mentor-principles"><small>MENTOR CHECK</small><span>✓ 从事实而非标签开场</span><span>✓ 提问允许员工改变方向</span><span>✓ 不承诺你无权决定的结果</span><span>✓ 把会谈连接到后续行动</span></div>
          </aside>
        </div>

        <div className="hr-workbench-footer"><small>进入后将通过关键沟通节点展示面谈如何展开；你的草案仍是随时可看的备忘。</small><button className="hr-primary-action" type="button" disabled={!state.mentorReviewComplete} onClick={startInterview}>带着自己的方案进入面谈 <ArrowRight size={16} /></button></div>
      </div>
    );
  }

  function renderInterview() {
    const mood = interviewEmotion.label;
    const canFinish = interviewHrTurns >= 6 && state.interviewTopics.length >= 4 && !typing;
    const employeeResponseCount = Math.max(0, state.interviewMessages.filter((message) => message.role === "employee").length - 1);
    const revealedLiveNotes = LIVE_INTERVIEW_NOTES.slice(0, Math.min(employeeResponseCount + 1, LIVE_INTERVIEW_NOTES.length));

    function finishInterview() {
      playTimeTransition({
        from: "14:45 · 面谈结束",
        to: "会后 · 同日",
        title: "把谈话带回工作台",
        detail: "面谈现场结束，进入会后研判。先整理事实与诉求，再决定组织动作。",
      }, () => setState((previous) => ({
        ...previous,
        activeApp: "docs",
        currentStage: Math.max(previous.currentStage, 4),
        interviewComplete: true,
        toast: "面谈结束，请审阅会后研判",
      })));
    }

    return (
      <div className="hr-live-notes-page">
        <header className="hr-chat-topbar hr-live-notes-topbar">
          <div className="hr-chat-peer">
            <span className="hr-chat-peer-avatar">林</span>
            <div><strong>小林 · 员工面谈实时纪要</strong><small>Meeting Room 2 · 仅 HR 可见 · 14:00-14:45</small></div>
          </div>
          <span className="hr-live-save-state"><span /> 自动保存</span>
          <span className="hr-chat-mood hr-interview-emotion" title="随谈话中获得的信息更新" aria-label={`小林当前状态：${mood}`}>
            {mood}
          </span>
        </header>

        <div className="hr-live-notes-body">
          <section className="hr-live-note-document" ref={chatScrollRef} aria-label="会谈实时记录">
            <header><div><ClipboardList size={18} /><span><strong>会谈速记</strong><small>系统模拟整理 · 内容可在会后 Docs 中修订</small></span></div><em>记录中</em></header>
            <div className="hr-live-note-meta"><span>对象：林亦辰（小林）</span><span>记录人：你 · HRBP</span><span>地点：Meeting Room 2</span></div>
            <div className="hr-live-note-list">
              {revealedLiveNotes.map((entry, index) => (
                <article key={entry.time} className={index === revealedLiveNotes.length - 1 ? "latest" : ""}>
                  <time>{entry.time}</time>
                  <div><strong>{entry.title}</strong><p>{entry.note}</p><blockquote>{entry.quote}</blockquote></div>
                </article>
              ))}
              {typing && <div className="hr-live-note-typing"><span /><span /><span /><small>正在从刚刚的回应中整理关键信息…</small></div>}
            </div>
          </section>

          <aside className="hr-live-comments" aria-label="HR 观察评论">
            <header><Eye size={15} /><div><strong>HR 观察评论</strong><small>事实、假设与边界随谈话更新</small></div></header>
            <div>
              {revealedLiveNotes.map((entry, index) => ({ entry, index })).reverse().map(({ entry, index: noteIndex }) => {
                return <article key={entry.comment} className={noteIndex === revealedLiveNotes.length - 1 ? "latest" : ""}><b>{String(noteIndex + 1).padStart(2, "0")}</b><p>{entry.comment}</p></article>;
              })}
            </div>
            <section className="hr-live-note-boundary"><ShieldCheck size={14} /><p><strong>记录边界</strong><span>只记解决工作问题所需内容；家庭细节不进入对外纪要。</span></p></section>
          </aside>
        </div>

        <footer className="hr-chat-composer hr-live-note-composer">
          <div className="hr-conversation-memory"><span>目前听到</span>{state.interviewTopics.length ? state.interviewTopics.map((topic) => <small key={topic}>✓ {topic}</small>) : <small>还没有形成可记录主题</small>}</div>
          <div className="hr-interview-tools">
            <span><Sparkles size={13} /> 记录板只呈现要点与观察；下一句演示话术已固定预填，点击发送继续</span>
            <button className="hr-finish-talk" type="button" disabled={!canFinish} onClick={finishInterview}>结束面谈并研判 <ArrowRight size={14} /></button>
          </div>
          <div className="hr-chat-inputrow">
            <textarea value={interviewInput} readOnly disabled={typing} placeholder={nextInterviewDemoInput ? "下一句演示话术" : "面谈信息已经充分，可以结束面谈"} rows={2} />
            <button type="button" disabled={!interviewInput.trim() || typing} onClick={() => sendInterviewTurn()} aria-label="发送面谈回应"><SendHorizontal size={17} /></button>
          </div>
          {!canFinish && <small className="hr-chat-composer-hint">为完整展示面谈结构，请按顺序推进 6 次固定沟通，覆盖事实、影响、诉求与同步边界。</small>}
        </footer>
      </div>
    );
  }

  function renderRecord() {
    const recordReady = state.recordFacts.trim().length >= 15
      && state.recordConcerns.trim().length >= 12
      && state.recordQuote.trim().length >= 6
      && state.recordBoundary.trim().length >= 12;
    return (
      <div className="hr-record-page hr-paper hr-workbench-page hr-analysis-page">
        <header className="hr-section-header"><div><p>POST-CONVERSATION ANALYSIS · 会后研判</p><h2>会谈纪要预设稿已生成，请审阅后形成工作判断</h2><span>系统已把实时速记整理成可编辑预设稿；你可以直接按演示流程保存，也可以修订事实、诉求、关键原话和同步边界。</span></div><FileText size={32} /></header>
        <section className="hr-analysis-lead"><span>会谈覆盖</span><p>{state.interviewTopics.length ? state.interviewTopics.join(" · ") : "请根据完整对话整理记录"}</p></section>
        <div className="hr-record-grid">
          <label><span>已确认事实</span><small>写具体事件、时间、频率或可核实记录，不写人格判断</small><textarea rows={5} value={state.recordFacts} onChange={(event) => setState((previous) => ({ ...previous, recordFacts: event.target.value }))} placeholder="例如：近四周……；上周五……" /></label>
          <label><span>员工关注与真实诉求</span><small>他在意的是什么？希望发生什么变化？</small><textarea rows={5} value={state.recordConcerns} onChange={(event) => setState((previous) => ({ ...previous, recordConcerns: event.target.value }))} placeholder="写下员工体验和希望解决的问题……" /></label>
          <label><span>一句关键原话</span><small>保留能够帮助组织理解问题、又不过度暴露隐私的表达</small><textarea rows={4} value={state.recordQuote} onChange={(event) => setState((previous) => ({ ...previous, recordQuote: event.target.value }))} placeholder="“……”" /></label>
          <label><span>可同步范围与待验证问题</span><small>只带走解决工作问题所必需的信息</small><textarea rows={4} value={state.recordBoundary} onChange={(event) => setState((previous) => ({ ...previous, recordBoundary: event.target.value }))} placeholder="可以同步……；不逐字转述……；仍需验证……" /></label>
        </div>
        <div className="hr-workbench-footer"><small>{recordReady ? "预设稿已经完整，可以直接保存；其中的判断仍要在行动和回访中被验证。" : "纪要有必填内容被删减了，补全四部分后即可保存。"}</small><button className="hr-primary-action" type="button" disabled={!recordReady} onClick={() => moveTo("tasks", 5, "Tasks 收到新的行动项")}>保存纪要，打开行动跟踪 <ArrowRight size={16} /></button></div>
      </div>
    );
  }

  function renderFollowup() {
    const activePhase = state.followupPhase === "closed" ? null : FOLLOWUP_PHASES.find((phase) => phase.id === state.followupPhase) ?? FOLLOWUP_PHASES[0];
    const phasesDone = FOLLOWUP_PHASES.filter((phase) => state.followupTurns[phase.id] >= FOLLOWUP_MIN_TURNS[phase.id]).length;
    const isEmployeeCallback = activePhase?.id === "employee";

    return (
      <div className={`hr-paper hr-workbench-page hr-action-page ${isEmployeeCallback ? "hr-callback-meet" : "hr-action-chat"}`}>
        {isEmployeeCallback
          ? <header className="hr-section-header"><div><p>PEOPLE MEET · DAY 14</p><h2>回到员工身边，验证行动有没有带来真实变化</h2><span>行动完成不等于问题解决；员工体验是闭环中不可替代的验证。</span></div><HeartHandshake size={34} /></header>
          : <header className="hr-chat-workspace-head"><div><p>HR 工作空间</p><h2>People Chat · 行动对齐</h2><span>不转述员工逐字表达，只与责任人确认工作问题、动作、期限与验证标准。</span></div><div><Search size={15} /><MoreHorizontal size={15} /></div></header>}

        <nav className="hr-followup-timeline" aria-label="后续沟通时间线">
          {FOLLOWUP_PHASES.map((phase, index) => {
            const done = state.followupTurns[phase.id] >= FOLLOWUP_MIN_TURNS[phase.id] || state.followupPhase === "closed";
            const active = phase.id === state.followupPhase;
            return <div className={`${done ? "done" : ""} ${active ? "active" : ""}`} key={phase.id}><b>{done ? "✓" : index + 1}</b><span><small>{phase.day}</small><strong>{phase.label}</strong><em>{phase.peer}</em></span></div>;
          })}
        </nav>

        {activePhase ? (
          <section className="hr-followup-conversation">
            <header><span>{activePhase.peer.slice(0, 1)}</span><div><small>{activePhase.day} · {activePhase.label}</small><strong>{activePhase.peer}</strong></div><em>{state.followupTurns[activePhase.id]}/{FOLLOWUP_MIN_TURNS[activePhase.id]} 个关键沟通已完成</em></header>
            <div className="hr-followup-thread" ref={chatScrollRef}>
              {state.followupMessages[activePhase.id].map((message) => {
                if (message.role === "scene") return <div className="hr-chat-scene" key={message.id}><span>{message.text}</span></div>;
                return <div className={`hr-contact-message ${message.role === "hr" ? "hr" : "contact"}`} key={message.id}><small>{message.role === "hr" ? "你 · HRBP" : activePhase.peer}</small><p>{message.text}</p></div>;
              })}
              {typing && <div className="hr-contact-message contact"><small>{activePhase.peer}</small><div className="hr-chat-typing"><span /><span /><span /></div></div>}
            </div>
            <div className="hr-prefilled-composer-note"><Sparkles size={13} /><span>{nextFollowupDemoInput ? "下一句跟进内容已固定预填，点击发送继续" : "本次关键沟通已完成，请确认责任与期限"}</span></div>
            <div className="hr-chat-inputrow"><textarea rows={2} value={followupInput} readOnly placeholder={`与${activePhase.peer}继续沟通……`} /><button type="button" disabled={!followupInput.trim() || typing} onClick={() => sendFollowupTurn()} aria-label="发送跟进消息"><SendHorizontal size={17} /></button></div>
            <button className="hr-phase-complete" type="button" disabled={state.followupTurns[activePhase.id] < FOLLOWUP_MIN_TURNS[activePhase.id] || typing} onClick={completeFollowupPhase}>{activePhase.id === "employee" ? "确认回访结果，形成闭环" : "确认本次责任与期限，进入下一节点"} <ArrowRight size={14} /></button>
          </section>
        ) : (
          <section className="hr-loop-complete"><CheckCircle2 size={32} /><div><strong>闭环成立：行动发生了，员工也确认了变化</strong><p>排班通知变得可预期；发展反馈补齐并给出下一步；仍需在一个月后继续验证规则是否稳定。</p></div></section>
        )}

        <div className="hr-workbench-footer"><small>{state.followupComplete ? "闭环不是‘问题永远消失’，而是责任、变化与下一次验证都清楚可见。" : `已完成 ${phasesDone}/3 个后续节点。每一场都需要由你亲自沟通。`}</small><button className="hr-primary-action" type="button" disabled={!state.followupComplete} onClick={() => setState((previous) => ({ ...previous, activeApp: "drive", currentStage: 6, toast: "Drive 已生成 HRBP 闭环文件夹" }))}>归档到 Drive <ArrowRight size={16} /></button></div>
      </div>
    );
  }

  function renderTasks() {
    const items = [
      { id: "schedule", title: "发布非紧急调班提前沟通规则", owner: "周店长", due: "本周五", proof: "排班群公告 + 两周执行记录", done: state.followupTurns.manager >= 2 },
      { id: "feedback", title: "补齐储备店长正式发展反馈", owner: "陈姐 + 周店长", due: "本周四 15:00", proof: "反馈会议 + Talent 留痕", done: state.followupTurns.talent >= 2 },
      { id: "callback", title: "回访员工，验证实际体验是否改变", owner: "你 · HRBP", due: "DAY 14", proof: "员工回访记录", done: state.followupTurns.employee >= 3 },
      { id: "monitor", title: "一个月后复查规则是否稳定执行", owner: "你 · HRBP", due: "DAY 30", proof: "WorkTime 抽查", done: false },
    ];
    return (
      <div className="hr-tasks-app">
        <header className="hr-tasks-head"><div><p>CASE 07 · ACTION BOARD</p><h2>员工关系行动看板</h2><span>把会谈纪要变成责任人、期限和可验证完成标准。</span></div><button type="button"><Plus size={15} /> 新建任务</button></header>
        <section className="hr-task-columns">
          <div><header><span>待确认</span><b>{state.actionPlanReady ? 0 : 3}</b></header>{!state.actionPlanReady && items.slice(0, 3).map((item) => <article key={item.id}><small>{item.due}</small><strong>{item.title}</strong><p>Owner · {item.owner}</p><span>{item.proof}</span></article>)}</div>
          <div><header><span>进行中</span><b>{items.filter((item) => state.actionPlanReady && !item.done).length}</b></header>{state.actionPlanReady && items.filter((item) => !item.done).map((item) => <article key={item.id}><small>{item.due}</small><strong>{item.title}</strong><p>Owner · {item.owner}</p><span>{item.proof}</span></article>)}</div>
          <div><header><span>已验证</span><b>{items.filter((item) => item.done).length}</b></header>{items.filter((item) => item.done).map((item) => <article className="done" key={item.id}><small>✓ 已验证</small><strong>{item.title}</strong><p>Owner · {item.owner}</p><span>{item.proof}</span></article>)}</div>
        </section>
        {!state.actionPlanReady ? <aside className="hr-task-sync"><div><strong>准备创建 3 项首轮行动</strong><p>{recordReady ? "信息同步遵循面谈中确认的边界：只带走排班机制与发展反馈，不转发家庭细节和员工逐字表达。" : "请先在 Docs 完成员工面谈纪要，再创建正式行动卡。"}</p></div><button type="button" disabled={!recordReady} onClick={() => setState((previous) => ({ ...previous, actionPlanReady: true, currentStage: Math.max(previous.currentStage, 5), toast: "行动卡已创建 · 去 People Chat 对齐责任人" }))}>确认责任人与期限 <ArrowRight size={14} /></button></aside> : <aside className="hr-task-sync"><div><strong>{state.followupComplete ? "员工已经确认变化，首轮闭环完成" : "行动卡已经进入跟进"}</strong><p>{state.followupPhase === "employee" ? "DAY 14 已到：请在 Meet 中完成员工回访。" : state.followupComplete ? "仍保留 DAY 30 复查任务，验证机制稳定性。" : "请到 People Chat 与当前责任人完成沟通，完成后回来看板。"}</p></div><button type="button" onClick={() => openApp(HR_APPS.find((app) => app.id === (state.followupPhase === "employee" ? "meet" : state.followupComplete ? "drive" : "chat"))!)}>{state.followupPhase === "employee" ? "打开 Meet 回访" : state.followupComplete ? "打开 Drive" : "打开 People Chat"} <ArrowRight size={14} /></button></aside>}
      </div>
    );
  }

  function renderMeet() {
    if (state.interviewMessages.length > 0 && !state.interviewComplete) return renderInterview();
    if (state.interviewComplete && state.actionPlanReady && state.followupPhase === "employee") return renderFollowup();

    const initialMeetingDone = state.interviewComplete;
    return (
      <div className="hr-meet-app">
        <header className="hr-meet-toolbar"><div><span><CalendarDays size={18} /></span><div><strong>People Meet</strong><small>我的会议与员工沟通</small></div></div><button type="button"><Plus size={14} /> 新建会议</button></header>
        <div className="hr-meet-layout">
          <aside className="hr-mini-calendar"><header><button type="button">‹</button><strong>2026 年 7 月</strong><button type="button">›</button></header><div className="hr-calendar-grid">{["一","二","三","四","五","六","日"].map((day) => <small key={day}>{day}</small>)}{Array.from({ length: 35 }, (_, index) => { const day = index - 1; return <span className={day === 30 ? "today" : day === 14 ? "event" : ""} key={index}>{day > 0 && day <= 31 ? day : ""}</span>; })}</div><div className="hr-meet-rooms"><small>会议室</small><span>● Meeting Room 2</span><span>● HR Focus Room</span></div></aside>
          <main className="hr-meeting-agenda"><header><div><p>THURSDAY · JUL 30</p><h2>今天的沟通安排</h2></div><span>Asia/Shanghai</span></header>
            <article className={state.mentorReviewComplete && !initialMeetingDone ? "ready" : initialMeetingDone ? "done" : "waiting"}>
              <time>14:00<small>45 min</small></time><div><span>{initialMeetingDone ? "已完成" : state.mentorReviewComplete ? "即将开始" : "等待 Docs 方案"}</span><h3>与小林进行员工沟通</h3><p>Meeting Room 2 · 你、小林</p><small>议题不会写入邀请；面谈方案仅供 HR 自己参考。</small></div>{!initialMeetingDone && <button type="button" disabled={!state.mentorReviewComplete} onClick={startInterview}>{state.mentorReviewComplete ? "进入面谈" : "等待方案完成"} <ArrowRight size={14} /></button>}{initialMeetingDone && <CheckCircle2 size={22} />}
            </article>
            <article className={state.followupPhase === "employee" ? "ready" : state.followupComplete ? "done" : "waiting"}><time>DAY 14<small>20 min</small></time><div><span>{state.followupComplete ? "已完成" : state.followupPhase === "employee" ? "到期" : "等待行动落地"}</span><h3>员工体验回访</h3><p>People Meet · 你、小林</p><small>验证排班规则和发展反馈是否真的改变员工体验。</small></div>{state.followupPhase === "employee" && <button type="button" onClick={() => setState((previous) => ({ ...previous, activeApp: "meet" }))}>开始回访 <ArrowRight size={14} /></button>}{state.followupComplete && <CheckCircle2 size={22} />}</article>
          </main>
        </div>
      </div>
    );
  }

  function renderDrive() {
    if (state.followupComplete) return renderFinal();
    const files = [
      { name: "01_信息采集手记", type: "Docs", ready: infoReady },
      { name: "02_面谈方案与 Mentor 反馈", type: "Docs", ready: state.mentorReviewComplete },
      { name: "03_员工面谈纪要", type: "Docs", ready: recordReady },
      { name: "04_行动跟踪表", type: "Tasks", ready: state.actionPlanReady },
      { name: "05_员工回访记录", type: "Meet", ready: state.followupComplete },
    ];
    return (
      <div className="hr-drive-app">
        <header><div><span><Archive size={18} /></span><div><strong>People Drive</strong><small>HRBP / Employee Relations / CASE 07</small></div></div><label><Search size={14} /><input readOnly value="Search in Drive" /></label><button type="button"><Plus size={14} /> New</button></header>
        <nav><span>我的文件</span><b>›</b><span>Employee Relations</span><b>›</b><strong>CASE 07 · 小林</strong></nav>
        <section className="hr-drive-grid">{files.map((file) => <article className={file.ready ? "ready" : "pending"} key={file.name}><div>{file.ready ? "📄" : "···"}</div><strong>{file.name}</strong><span>{file.type}</span><small>{file.ready ? "已同步最新版本" : "等待相关工作完成"}</small></article>)}</section>
        <aside><Sparkles size={20} /><div><strong>交付文件夹仍在自动汇总</strong><p>员工回访确认实际变化后，系统才会生成最终闭环摘要。当前文件可以随时打开，但不能替代未完成的工作。</p></div></aside>
      </div>
    );
  }

  function renderFinal() {
    return (
      <div className="hr-final-page hr-workbench-page hr-delivery-page">
        <header className="hr-final-hero"><div><p>HRBP CLOSED LOOP · CASE 07</p><h2>你没有只完成一次面谈，而是推动了一次完整改变</h2><span>从主动找人采集信息、共创面谈、自由对话，到责任人行动与员工回访，工作终于闭环。</span></div><span className="hr-final-seal">LOOP<br />✓</span></header>

        <section className="hr-impact-strip">
          <div><span>进入时</span><p>“小林主动性下降，可能想离职。”</p></div><b>→</b><div><span>回访后</span><p>排班规则真实执行，发展反馈完成，员工知道下一步且愿意继续投入。</p></div>
        </section>

        <section className="hr-deliverable-grid">
          <article><header><span>01</span><div><small>CONVERSATION NOTE</small><strong>面谈纪要</strong></div></header><ul><li>记录具体事件，不写人格标签</li><li>保留员工关注与关键原话</li><li>明确可同步范围</li></ul><footer>使用者：HRBP</footer></article>
          <article><header><span>02</span><div><small>MANAGER BRIEF</small><strong>主管沟通摘要</strong></div></header><ul><li>排班提前量需要形成规则</li><li>发展反馈流程需要补齐</li><li>不包含员工私人细节和逐字稿</li></ul><footer>使用者：周店长 + 区域 HR</footer></article>
          <article><header><span>03</span><div><small>ACTION TRACKER</small><strong>行动跟踪表</strong></div></header><ul><li>每项行动有责任人和期限</li><li>两周后验证过程与员工体验</li><li>根据新证据修正工作假设</li></ul><footer>使用者：HRBP + 行动责任人</footer></article>
          <article><header><span>04</span><div><small>CHECK-BACK NOTE</small><strong>员工回访记录</strong></div></header><ul><li>员工确认排班安排更可预期</li><li>发展反馈清晰且有下一步</li><li>一个月后继续验证机制稳定性</li></ul><footer>验证者：小林 · DAY 14</footer></article>
        </section>

        <section className="hr-profession-map"><h3>这次闭环由你亲手推动</h3><div><span>联系知情人</span><b>→</b><span>从零设计</span><b>→</b><span>自由面谈</span><b>→</b><span>专业研判</span><b>→</b><span>对齐责任人</span><b>→</b><span>回到员工验证</span></div><p>HRBP 的专业价值，在于连接员工体验、管理责任和组织机制，并让信息在边界内真正影响决策。</p></section>

        <div className="hr-final-actions">
          <button type="button" onClick={() => setState(createDefaultHrState())}><RefreshCw size={16} />重新体验</button>
          <button type="button" onClick={onExit}>返回职业大厅</button>
        </div>
      </div>
    );
  }

  let content;
  switch (state.activeApp) {
    case "chat": content = renderProfile(); break;
    case "attendance": content = renderAttendance(); break;
    case "talent": content = renderTalent(); break;
    case "docs": content = renderDocs(); break;
    case "meet": content = renderMeet(); break;
    case "tasks": content = renderTasks(); break;
    case "drive": content = renderDrive(); break;
    default: content = renderBrief();
  }

  const appNudge = getAppNudge();
  const boardSignalCount = getPendingBoardSignals().length;

  return (
    <div className={`office-scene chat-valley-scene hr-career-scene ${isInterviewMode ? "hr-interview-mode" : ""}`}>
      <div className="wallpaper" />
      {timeTransition && (
        <section className="hr-time-transition" role="status" aria-live="polite">
          <div className="hr-time-transition-card">
            <div className="hr-time-transition-kicker"><span /><strong>TIME SHIFT · CASE 07</strong><span /></div>
            <div className="hr-time-transition-route"><span>{timeTransition.from}</span><b>→</b><span>{timeTransition.to}</span></div>
            <h2>{timeTransition.title}</h2>
            <p>{timeTransition.detail}</p>
            <div className="hr-time-transition-progress"><i /></div>
            <small>正在更新行动时间线…</small>
          </div>
        </section>
      )}
      {isInterviewMode && (
        <section className={`hr-face-stage ${interviewMoodClass}`} aria-label="与小林面对面交流">
          <div className="hr-room-window" aria-hidden="true"><span /><span /><span /></div>
          <div className="hr-room-board" aria-hidden="true"><strong>Meeting Room 2</strong><span>Listen · Clarify · Align</span></div>
          <div className="hr-room-plant" aria-hidden="true"><span /><i /><i /><i /></div>

          <div className="hr-face-scene-meta">
            <span>线下面谈</span>
            <small className="hr-interview-emotion">{interviewEmotion.label}</small>
          </div>

          <div className="hr-face-dialogue" aria-hidden="true">
            <div><strong>小林</strong><small>资深门店顾问</small></div>
            <p>{typing ? "……" : latestEmployeeMessage?.text ?? "主管让我来的。"}</p>
            <span>{typing ? "他正在组织语言" : latestEmployeeMessage?.cue ?? "他仍在观察这次谈话是否安全。"}</span>
          </div>

          <img className="hr-seated-character hr-asset-character" src={interviewCharacterAsset} alt={`小林当前状态：${interviewEmotion.label}`} />

          <div className="hr-meeting-table" aria-hidden="true">
            <img className="hr-meeting-table-art" src="/assets/hr/meeting-table-v4.png" alt="" />
          </div>
        </section>
      )}
      <div className="desk-shadow" aria-hidden="true"><span className="desk-face desk-face-top" /></div>
      <div className="desk">
        {isInterviewMode ? (
          <section className="hr-interview-clipboard" aria-label="员工面谈 A4 实时记录板">
            <span className="hr-interview-board-clip" aria-hidden="true" />
            <div className="hr-interview-board-paper">{content}</div>
          </section>
        ) : (
          <>
            <div className="monitor-shell">
              <div className="monitor-topbar">
                <div className="brand-block">
                  <button className="career-back-button" type="button" onClick={onExit}>← 职业大厅</button>
                  <span className="brand-pill"><span aria-hidden="true">✨</span> Possibility OS</span>
                  <span className="brand-subtitle">HR 工作空间 · 员工关系体验</span>
                </div>
                <div className="status-block"><span><Clock3 size={13} /> {new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span><span>CASE 07 · 员工关系</span><span>🔒 最小必要同步</span></div>
              </div>

              <div className="screen">
                <div className="screen-grid hr-screen-grid">
                  <aside className="desktop-column hr-desktop-column" aria-label="HR 工作应用">
                    {HR_APPS.map((app) => {
                      const active = app.id === state.activeApp;
                      const nudged = app.id === appNudge?.appId;
                      const Icon = app.icon;
                      return (
                        <div className={`desktop-app-slot ${nudged ? "nudged" : ""}`} key={app.id}>
                          <button className={`desktop-icon ${active ? "active" : ""}`} type="button" aria-pressed={active} onClick={() => openApp(app)}>
                            <span className="desktop-icon-mark amber"><span>{app.glyph}</span></span>
                            <strong>{app.label}</strong><small>{app.subtitle}</small>
                            {active && <Icon className="hr-active-app-icon" size={13} />}
                            {nudged && <span className="icon-badge" />}
                          </button>
                          {nudged && <div className="desktop-app-nudge" role="status"><Sparkles size={13} /><span>{appNudge.text}</span></div>}
                        </div>
                      );
                    })}
                  </aside>

                  <section className="workspace-pane">
                    <section className="app-window app-hr amber app-self-chromed" aria-label={`${activeApp.label}：${activeApp.subtitle}`}>
                      <div className="window-body hr-window-body">{content}</div>
                    </section>
                  </section>
                </div>
                {state.toast && <div className="screen-toast"><span>{state.toast}</span></div>}
              </div>
            </div>
            <img className="hr-monitor-workstation-art" src="/assets/hr/monitor-shell-front-v5.png" alt="" aria-hidden="true" />
            <div className="monitor-stand" aria-hidden="true"><div className="monitor-foot" /></div>
          </>
        )}
        <div className="desk-objects">
          <div className="keyboard" aria-hidden="true">
            <span className="keyboard-case-face keyboard-case-front" />
            <span className="keyboard-case-face keyboard-case-left" />
            <span className="keyboard-case-face keyboard-case-right" />
            <div className="keyboard-keys">
              {HR_KEYBOARD_ROWS.map((row, rowIndex) => (
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
          {!isInterviewMode && (
            <button
              className={`hr-physical-notes-board ${notesBoardPickingUp ? "is-picking-up" : ""} ${notesBoardOpen ? "is-away" : ""}`}
              type="button"
              onClick={pickUpNotesBoard}
              onAnimationEnd={(event) => {
                if (event.target !== event.currentTarget || !notesBoardPickingUp) return;
                setNotesBoardOpen(true);
                setNotesBoardPickingUp(false);
              }}
              aria-label={`拿起桌面上的调查记录板，当前有 ${boardSignalCount} 条待摘录线索`}
              aria-busy={notesBoardPickingUp}
              aria-hidden={notesBoardOpen || notesBoardPuttingDown}
              tabIndex={notesBoardOpen || notesBoardPuttingDown ? -1 : 0}
            >
              <span className="hr-board-clip" aria-hidden="true" />
              <span className="hr-physical-board-paper" aria-hidden="true">
                <small>CASE 07</small>
                <strong><ClipboardList size={15} /> 调查记录</strong>
                <span className="hr-physical-board-lines"><i /><i /><i /></span>
                <em>{boardSignalCount} 条待摘录</em>
              </span>
              {boardSignalCount > 0 && <b>{boardSignalCount}</b>}
            </button>
          )}
        </div>
      </div>
      {(notesBoardOpen || notesBoardPuttingDown) && !isInterviewMode && (
        <div
          className={`hr-held-board-layer ${notesBoardPuttingDown ? "is-putting-down" : ""}`}
          onAnimationEnd={(event) => {
            if (event.target !== event.currentTarget || !notesBoardPuttingDown) return;
            setNotesBoardPuttingDown(false);
          }}
        >
          <button className="hr-held-board-dismiss" type="button" aria-label="点击记录板外区域放回桌面" onClick={putDownNotesBoard} />
          {renderNotesBoard()}
        </div>
      )}
    </div>
  );
}
