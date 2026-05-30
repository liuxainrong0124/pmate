"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, ChevronDown, ChevronUp, Wifi, Shield, Database, GitBranch, Smartphone, Zap, AlertTriangle } from "lucide-react";
import { getUserApiKey } from "@/lib/store/local-store";

interface AnomalyScenario {
  category: string;
  title: string;
  description: string;
  trigger: string;
  severity: "critical" | "high" | "medium" | "low";
  suggestion: string;
}

const categoryMeta: Record<string, { icon: typeof Wifi; color: string; label: string }> = {
  "网络异常": { icon: Wifi, color: "bg-orange-50 text-orange-600", label: "网络异常" },
  "权限异常": { icon: Shield, color: "bg-red-50 text-red-600", label: "权限异常" },
  "数据为空": { icon: Database, color: "bg-gray-50 text-gray-600", label: "数据为空" },
  "并发冲突": { icon: GitBranch, color: "bg-purple-50 text-purple-600", label: "并发冲突" },
  "版本兼容": { icon: Smartphone, color: "bg-blue-50 text-blue-600", label: "版本兼容" },
  "边界条件": { icon: Zap, color: "bg-amber-50 text-amber-600", label: "边界条件" },
};

const severityBadge = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

// Generate mock scenarios based on feature name
function generateMockScenarios(featureName: string): AnomalyScenario[] {
  return [
    {
      category: "网络异常",
      title: "弱网环境下请求超时",
      description: `用户在 2G/3G 网络下使用${featureName}功能时，接口响应超过 10 秒，导致页面白屏或无响应。`,
      trigger: `在 Chrome DevTools 中模拟 Slow 3G 网络，打开${featureName}页面，等待数据加载。`,
      severity: "high",
      suggestion: "添加请求超时重试机制（最多 3 次），超时后展示友好提示并支持手动重试。同时展示骨架屏占位。",
    },
    {
      category: "数据为空",
      title: "首次用户空状态处理",
      description: `新用户首次进入${featureName}，没有任何历史数据时，页面展示空白区域，用户不清楚该做什么。`,
      trigger: `使用全新账号登录，进入${featureName}页面。`,
      severity: "medium",
      suggestion: "设计空状态引导页，用插画+文案说明功能价值，提供「开始使用」CTA 按钮引导用户完成首次操作。",
    },
    {
      category: "权限异常",
      title: "未登录或 Token 过期",
      description: `用户长时间未操作后 Token 过期，在${featureName}中提交操作时提示「401 未授权」，已填写的内容可能丢失。`,
      trigger: `手动清除 Cookie/Storage 中的 auth_token，然后在${featureName}中执行提交操作。`,
      severity: "critical",
      suggestion: "请求拦截器中捕获 401，自动跳转登录页并保存当前操作上下文，登录后恢复。使用 beforeunload 事件提醒用户。",
    },
    {
      category: "并发冲突",
      title: "多人同时编辑数据覆盖",
      description: `两个管理员同时编辑${featureName}的同一配置项，后保存的覆盖先保存的，导致数据丢失。`,
      trigger: `在两个浏览器 Tab 中打开${featureName}编辑页，分别修改同一字段后先后保存。`,
      severity: "high",
      suggestion: "引入乐观锁（版本号机制），保存时比较版本号，冲突时提示用户并展示差异对比，由用户选择保留哪个版本。",
    },
    {
      category: "边界条件",
      title: "输入超长文本导致布局崩溃",
      description: `用户在${featureName}中输入超过 10000 字符的文本，或粘贴包含特殊格式的内容，导致页面布局错乱或卡死。`,
      trigger: `准备一段 20000+ 字符的文本（含 emoji、特殊 Unicode），粘贴到${featureName}的输入框中。`,
      severity: "medium",
      suggestion: "前端限制输入长度（maxLength），后端同样校验。对特殊字符做转义处理，使用 CSS word-break: break-word 防止溢出。",
    },
    {
      category: "版本兼容",
      title: "iOS 低版本 Safari 兼容问题",
      description: `iOS 14 以下版本的 Safari 不支持某些 CSS/JS API，导致${featureName}页面部分功能不可用。`,
      trigger: `在 Xcode Simulator 中启动 iOS 13 设备，用 Safari 打开${featureName}页面。`,
      severity: "low",
      suggestion: "使用 @supports 做 CSS 降级，JS 使用 try-catch + polyfill 方案。在构建时通过 browserslist 控制兼容范围。",
    },
  ];
}

export function AnomalyGenerator() {
  const [featureName, setFeatureName] = useState("");
  const [description, setDescription] = useState("");
  const [scenarios, setScenarios] = useState<AnomalyScenario[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!featureName.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/anomaly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: getUserApiKey() || '', featureName: featureName.trim(), description: description.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.scenarios?.length) {
          setScenarios(data.scenarios);
        } else {
          setScenarios(generateMockScenarios(featureName.trim()));
        }
      } else {
        setScenarios(generateMockScenarios(featureName.trim()));
      }
    } catch {
      setScenarios(generateMockScenarios(featureName.trim()));
    }
    setIsGenerating(false);
    setExpandedIndex(null);
  };

  return (
    <div className="animate-fade-in">
      {/* Input Card */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm mb-6 max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="font-semibold text-sm text-gray-900">异常场景生成器</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          输入功能名称和描述，AI 自动生成覆盖网络、权限、数据、并发、兼容、边界六大类的异常场景与处理方案。
        </p>
        <div className="space-y-3">
          <Input
            placeholder="功能名称，如：用户个人主页改版"
            value={featureName}
            onChange={(e) => setFeatureName(e.target.value)}
            className="rounded-xl border-gray-200"
          />
          <Textarea
            placeholder="功能描述（选填），如：用户可以编辑个人资料、上传头像、查看动态..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded-xl border-gray-200"
          />
          <Button
            onClick={handleGenerate}
            disabled={!featureName.trim() || isGenerating}
            className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm rounded-xl"
          >
            {isGenerating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />分析中...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />生成异常场景</>
            )}
          </Button>
        </div>
      </div>

      {/* Results */}
      {scenarios.length > 0 && (
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm text-gray-900">生成结果</h3>
            <span className="text-xs text-gray-400">{scenarios.length} 个场景</span>
          </div>
          {scenarios.map((scenario, i) => {
            const meta = categoryMeta[scenario.category] || categoryMeta["边界条件"];
            const Icon = meta.icon;
            const isExpanded = expandedIndex === i;
            return (
              <div
                key={i}
                className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : i)}
                  className="w-full p-4 flex items-start gap-3 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-gray-400">{meta.label}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${severityBadge[scenario.severity]}`}>
                        {scenario.severity === "critical" ? "严重" : scenario.severity === "high" ? "高" : scenario.severity === "medium" ? "中" : "低"}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900">{scenario.title}</h4>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3 ml-12">
                    <div>
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">场景描述</span>
                      <p className="text-sm text-gray-700 mt-1">{scenario.description}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">复现步骤</span>
                      <p className="text-sm text-gray-700 mt-1 font-mono text-xs bg-gray-50 p-2 rounded-lg">{scenario.trigger}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">处理建议</span>
                      <p className="text-sm text-gray-700 mt-1">{scenario.suggestion}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {scenarios.length === 0 && !isGenerating && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white/50 p-10 text-center max-w-2xl">
          <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-2">输入功能名称，生成异常场景分析</p>
          <p className="text-gray-400 text-xs">覆盖网络异常、权限异常、数据为空、并发冲突、版本兼容、边界条件</p>
        </div>
      )}
    </div>
  );
}
