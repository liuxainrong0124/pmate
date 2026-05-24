"use client";

import { FeedbackReport as FeedbackReportType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FeedbackReportProps {
  report: FeedbackReportType;
}

const severityColors: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

const categoryLabels: Record<string, string> = {
  bug: "Bug",
  feature_request: "功能需求",
  ux: "体验问题",
  support: "咨询",
  other: "其他",
};

export function FeedbackReportDisplay({ report }: FeedbackReportProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">分析摘要</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{report.summary}</p>
          <div className="flex gap-2 mt-3">
            {report.categories.map((cat) => (
              <Badge key={cat} variant="secondary">
                {categoryLabels[cat] || cat}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            关键洞察 ({report.insights.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.insights
              .sort((a, b) => {
                const order = { high: 3, medium: 2, low: 1 };
                return order[b.severity] - order[a.severity];
              })
              .map((insight, i) => (
                <div key={i} className="border-b pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{insight.title}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${severityColors[insight.severity]}`}
                    >
                      {insight.severity === "high"
                        ? "高优"
                        : insight.severity === "medium"
                        ? "中优"
                        : "低优"}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {categoryLabels[insight.category]}
                    </Badge>
                    <span className="text-xs text-gray-400 ml-auto">
                      提及 {insight.count} 次
                    </span>
                  </div>
                  {insight.quotes.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {insight.quotes.map((q, j) => (
                        <blockquote
                          key={j}
                          className="border-l-2 border-gray-200 pl-3 text-sm text-gray-500 italic"
                        >
                          &ldquo;{q}&rdquo;
                        </blockquote>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            行动建议 ({report.actionItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.actionItems.map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full mt-0.5 ${
                    item.effort === "low"
                      ? "bg-green-100 text-green-800"
                      : item.effort === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {item.effort === "low" ? "低成本" : item.effort === "medium" ? "中成本" : "高成本"}
                </span>
                <div>
                  <p className="font-medium text-sm">{item.what}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.why}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
