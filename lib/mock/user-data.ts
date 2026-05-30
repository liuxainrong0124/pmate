export interface UserSegment {
  id: string;
  name: string;
  percentage: number;
  count: number;
  color: string;
  characteristics: string[];
  rfm: { recency: string; frequency: string; monetary: string };
  strategy: string;
}

export interface UserPersona {
  name: string;
  age: string;
  occupation: string;
  tagline: string;
  goals: string[];
  painPoints: string[];
  behaviors: string[];
  quote: string;
  segmentName: string;
}

export interface FeedbackSummary {
  id: string;
  sentiment: "positive" | "neutral" | "negative";
  quote: string;
  category: string;
  date: string;
  source: string;
}

export const mockSegments: UserSegment[] = [
  {
    id: "heavy",
    name: "重度用户",
    percentage: 18,
    count: 2230,
    color: "#6366F1",
    characteristics: ["日均使用 > 60 分钟", "付费转化率 34%", "周活跃 6-7 天", "使用 5+ 个功能模块"],
    rfm: { recency: "1 天内", frequency: "6-7 天/周", monetary: "¥68/月" },
    strategy: "VIP 专属服务、优先体验新功能、深度使用引导",
  },
  {
    id: "regular",
    name: "普通用户",
    percentage: 45,
    count: 5560,
    color: "#10B981",
    characteristics: ["日均使用 10-30 分钟", "付费转化率 12%", "周活跃 3-5 天", "使用 2-3 个功能模块"],
    rfm: { recency: "3 天内", frequency: "3-5 天/周", monetary: "¥15/月" },
    strategy: "关键功能引导、限时优惠刺激、社区互动激活",
  },
  {
    id: "at_risk",
    name: "流失风险",
    percentage: 25,
    count: 3090,
    color: "#F59E0B",
    characteristics: ["日均使用 < 10 分钟", "付费转化率 4%", "周活跃 1-2 天", "最近 7 天未打开"],
    rfm: { recency: "7-14 天", frequency: "1-2 天/周", monetary: "¥5/月" },
    strategy: "召回推送、核心价值重新传达、一键反馈入口",
  },
  {
    id: "churned",
    name: "已流失",
    percentage: 12,
    count: 1490,
    color: "#EF4444",
    characteristics: ["超过 30 天未打开", "已卸载或禁用通知", "曾付费占比 22%"],
    rfm: { recency: "30+ 天", frequency: "已停用", monetary: "¥0/月" },
    strategy: "EDM 召回、大促活动触达、流失原因调研",
  },
];

export const mockPersonas: UserPersona[] = [
  {
    name: "小王",
    age: "25",
    occupation: "互联网运营",
    tagline: "效率至上，好的工具让我事半功倍",
    goals: ["提升工作效率", "掌握最新运营玩法", "在团队中建立专业影响力"],
    painPoints: ["信息过载，不知道哪些功能真正有用", "重复性工作太多", "缺乏系统的运营方法论"],
    behaviors: ["每天早晨第一件事就是查看数据", "喜欢尝试新功能并分享体验", "活跃于各类运营社群"],
    quote: "我每天要在 5 个工具之间切换，如果有一个平台能把所有事情都搞定就好了。",
    segmentName: "重度用户",
  },
  {
    name: "小李",
    age: "28",
    occupation: "产品经理",
    tagline: "希望通过数据驱动做出更好的产品决策",
    goals: ["提升产品留存率", "建立用户反馈闭环", "推动数据驱动文化"],
    painPoints: ["用户反馈散落各处难以汇总", "不懂技术无法快速验证想法", "跨部门协作沟通成本高"],
    behaviors: ["周二周四固定开需求评审", "习惯用 Excel 手动整理数据", "收藏了大量竞品分析文章"],
    quote: "每次做需求评审都要翻十几份文档，如果能把用户反馈和数据分析自动汇总就好了。",
    segmentName: "普通用户",
  },
  {
    name: "小张",
    age: "32",
    occupation: "市场经理",
    tagline: "最近太忙了，好久没打开这个产品了",
    goals: ["完成本月 KPI", "找到更低成本的获客渠道", "减少加班时间"],
    painPoints: ["竞品功能越来越强，我们跟不上", "老板要的数据报表每次都做很久", "学新工具的时间成本太高"],
    behaviors: ["只在需要导出报表时才打开", "主要使用核心功能", "对推送通知已麻木"],
    quote: "其实这个产品挺好的，但最近真的太忙了，等空了再好好研究新功能吧。",
    segmentName: "流失风险",
  },
  {
    name: "老赵",
    age: "40",
    occupation: "创业者",
    tagline: "产品不错，但没时间深入使用，换别的了",
    goals: ["快速验证商业模式", "控制运营成本", "找到产品市场匹配"],
    painPoints: ["定价偏高，小团队预算有限", "功能太复杂，学习成本高", "竞品有更好的免费替代方案"],
    behaviors: ["已经卸载超过 2 个月", "曾付费 3 个月后停止续费", "关注了竞品的公众号"],
    quote: "功能太多了我们用不上，而且价格对小团队不太友好，先试试别的工具。",
    segmentName: "已流失",
  },
];

export const mockFeedbackSummary: FeedbackSummary[] = [];
