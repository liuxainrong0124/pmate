import Link from "next/link";

const modules = [
  {
    title: "用户反馈分析",
    description:
      "粘贴用户反馈，AI自动分类、提取关键洞察并按优先级给出行动建议。支持批量分析，结构化报告一目了然。",
    href: "/feedback",
  },
  {
    title: "PRD智能助手",
    description:
      "输入需求要点，AI按照标准PRD框架自动补全背景分析、用户故事、功能详述、埋点建议和验收标准。",
    href: "/prd",
  },
  {
    title: "竞品动态追踪",
    description: "（即将上线）设定关注竞品，AI定期抓取更新动态并生成简报，第一时间发现值得关注的变化。",
    href: "#",
    comingSoon: true,
  },
];

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">PMate</h1>
        <p className="text-lg text-gray-500">
          面向产品经理的AI工作伴侣，把重复认知劳动AI化
        </p>
        <p className="text-sm text-gray-400 mt-2">
          让PM专注于思考和决策，而非整理反馈和写文档
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {modules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className={`block p-6 rounded-xl border transition-all ${
              mod.comingSoon
                ? "border-dashed border-gray-200 bg-gray-50/50 pointer-events-none"
                : "border-gray-200 bg-white hover:shadow-md hover:border-blue-200"
            }`}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {mod.title}
              {mod.comingSoon && (
                <span className="ml-2 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                  即将上线
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {mod.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
