import { useState } from "react";
import OfficeApp from "./OfficeApp";
import HrApp from "./HrApp";

type CareerId = "pm" | "hr";

const CAREERS = [
  {
    id: "pm" as const,
    icon: "🧭",
    label: "产品经理",
    subtitle: "把模糊问题推进成可验证方案",
    description: "分析同一个群体决策问题，选择根因假设，完成 PRD、原型、测试和数据迭代。",
    tags: ["问题定义", "方案取舍", "跨团队推进"],
    route: ["读任务", "找根因", "做验证", "交复盘"],
    tone: "teal",
  },
  {
    id: "hr" as const,
    icon: "🤝",
    label: "HRBP / 员工关系",
    subtitle: "从信息差走到员工确认的改变",
    description: "跟随一项员工关系案例，联系 mentor 与同事采集信息，设计并演示面谈，再推动行动与回访形成闭环。",
    tags: ["多方沟通", "自由面谈", "行动回访"],
    route: ["听信号", "多方核对", "员工面谈", "行动回访"],
    tone: "amber",
  },
];

function CareerHall({ onSelect }: { onSelect: (career: CareerId) => void }) {
  return (
    <main className="career-hall">
      <div className="career-hall-sky" aria-hidden="true">
        <span>☁️</span>
        <span>☀️</span>
        <span>🌳</span>
      </div>

      <header className="career-hall-header">
        <div className="career-hall-intro">
          <p>Possibility OS · Career Stories</p>
          <h1>今天想体验哪一种工作？</h1>
          <span>不是职业测试，而是通过可互动案例，看见一项真实工作如何被拆解、推进与复盘。</span>
        </div>
        <aside className="career-hall-note" aria-label="体验设计说明">
          <small>关于这份体验</small>
          <strong>你操作的不是标准答案，而是一段工作推进过程。</strong>
          <span>每个案例都从模糊信号开始，经过取舍、协作与复盘，最后回到真实的人。</span>
        </aside>
      </header>

      <section className="career-card-grid" aria-label="职业体验列表">
        {CAREERS.map((career) => (
          <article className={`career-card ${career.tone}`} key={career.id}>
            <div className="career-card-icon" aria-hidden="true">{career.icon}</div>
            <div className="career-card-copy">
              <p>Career Demo</p>
              <h2>{career.label}</h2>
              <strong>{career.subtitle}</strong>
              <span>{career.description}</span>
            </div>
            <div className="career-card-tags">
              {career.tags.map((tag) => <small key={tag}>{tag}</small>)}
            </div>
            <div className="career-card-route" aria-label={`${career.label}体验路径`}>
              <span>体验路径</span>
              <ol>
                {career.route.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </div>
            <button type="button" onClick={() => onSelect(career.id)}>
              进入体验 <span aria-hidden="true">→</span>
            </button>
          </article>
        ))}
      </section>

      <footer className="career-hall-footer">
        <span>🌱 每段体验会单独保存进度</span>
        <span>当前开放 2 个职业故事</span>
      </footer>
    </main>
  );
}

export default function CareerApp() {
  const [career, setCareer] = useState<CareerId | null>(null);

  if (career === "pm") {
    return <OfficeApp onExit={() => setCareer(null)} />;
  }

  if (career === "hr") {
    return <HrApp onExit={() => setCareer(null)} />;
  }

  return <CareerHall onSelect={setCareer} />;
}
