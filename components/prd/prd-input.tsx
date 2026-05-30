"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText } from "lucide-react";
import { PrdInput as PrdInputType, PrdTemplateType } from "@/types";

interface PrdInputProps {
  onSubmit: (input: PrdInputType) => void;
  isLoading: boolean;
  initialFeatureName?: string;
  initialDescription?: string;
  initialContext?: string;
}

export function PrdInput({ onSubmit, isLoading, initialFeatureName = "", initialDescription = "", initialContext = "" }: PrdInputProps) {
  const [featureName, setFeatureName] = useState(initialFeatureName);
  const [description, setDescription] = useState(initialDescription);
  const [template, setTemplate] = useState<PrdTemplateType>("new_feature");
  const [targetUsers, setTargetUsers] = useState("");
  const [context, setContext] = useState(initialContext);

  const handleSubmit = () => {
    if (featureName.trim() && description.trim() && !isLoading) {
      onSubmit({ featureName:featureName.trim(), description:description.trim(), template, targetUsers:targetUsers.trim()||undefined, context:context.trim()||undefined });
    }
  };
  const isValid = featureName.trim() && description.trim();
  const ic = "rounded-xl border-gray-200 dark:border-gray-700 focus:border-violet-300 dark:focus:border-violet-600 focus:ring-violet-50 dark:focus:ring-violet-500/10";

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">PRD模板类型</label>
        <Select value={template} onValueChange={(v)=>setTemplate(v as PrdTemplateType)} disabled={isLoading}>
          <SelectTrigger className={`w-full ${ic}`}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new_feature">新功能</SelectItem>
            <SelectItem value="optimization">功能优化</SelectItem>
            <SelectItem value="campaign">运营活动</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">功能名称 *</label>
        <Input placeholder="例如：用户个人主页改版" value={featureName} onChange={(e)=>setFeatureName(e.target.value)} disabled={isLoading} className={ic} />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">需求描述 *</label>
        <Textarea placeholder="描述这个需求要解决什么问题、核心场景是什么..." value={description} onChange={(e)=>setDescription(e.target.value)} rows={5} disabled={isLoading} className={ic} />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">目标用户（选填）</label>
        <Input placeholder="例如：18-25岁在校大学生" value={targetUsers} onChange={(e)=>setTargetUsers(e.target.value)} disabled={isLoading} className={ic} />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">背景补充（选填）</label>
        <Textarea placeholder="补充业务背景、竞品参考、技术限制等..." value={context} onChange={(e)=>setContext(e.target.value)} rows={3} disabled={isLoading} className={ic} />
      </div>
      <Button onClick={handleSubmit} disabled={!isValid||isLoading}
        className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm rounded-xl transition-all duration-200">
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />生成中...</>
          : <><FileText className="mr-2 h-4 w-4" />生成PRD</>}
      </Button>
    </div>
  );
}
