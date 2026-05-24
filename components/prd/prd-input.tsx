"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { PrdInput as PrdInputType, PrdTemplateType } from "@/types";

interface PrdInputProps {
  onSubmit: (input: PrdInputType) => void;
  isLoading: boolean;
}

const templateLabels: Record<PrdTemplateType, string> = {
  new_feature: "新功能",
  optimization: "功能优化",
  campaign: "运营活动",
};

export function PrdInput({ onSubmit, isLoading }: PrdInputProps) {
  const [featureName, setFeatureName] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState<PrdTemplateType>("new_feature");
  const [targetUsers, setTargetUsers] = useState("");
  const [context, setContext] = useState("");

  const handleSubmit = () => {
    if (featureName.trim() && description.trim() && !isLoading) {
      onSubmit({
        featureName: featureName.trim(),
        description: description.trim(),
        template,
        targetUsers: targetUsers.trim() || undefined,
        context: context.trim() || undefined,
      });
    }
  };

  const isValid = featureName.trim() && description.trim();

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">PRD模板类型</label>
        <Select
          value={template}
          onValueChange={(v) => setTemplate(v as PrdTemplateType)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new_feature">新功能</SelectItem>
            <SelectItem value="optimization">功能优化</SelectItem>
            <SelectItem value="campaign">运营活动</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">功能名称 *</label>
        <Input
          placeholder="例如：用户个人主页改版"
          value={featureName}
          onChange={(e) => setFeatureName(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">需求描述 *</label>
        <Textarea
          placeholder="描述这个需求要解决什么问题、核心场景是什么..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">目标用户（选填）</label>
        <Input
          placeholder="例如：18-25岁在校大学生"
          value={targetUsers}
          onChange={(e) => setTargetUsers(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">背景补充（选填）</label>
        <Textarea
          placeholder="补充业务背景、竞品参考、技术限制等..."
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={3}
          disabled={isLoading}
        />
      </div>

      <Button onClick={handleSubmit} disabled={!isValid || isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? "生成中..." : "生成PRD"}
      </Button>
    </div>
  );
}
