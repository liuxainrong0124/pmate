"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FeedbackInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export function FeedbackInput({ onSubmit, isLoading }: FeedbackInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim() && !isLoading) {
      onSubmit(text.trim());
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">
          粘贴用户反馈内容
        </label>
        <Textarea
          placeholder="粘贴App Store评论、用户访谈记录、问卷填写内容...

支持批量粘贴，每条反馈用换行分隔"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="resize-y min-h-[200px]"
          disabled={isLoading}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleSubmit} disabled={!text.trim() || isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "分析中..." : "开始分析"}
        </Button>
        <span className="text-xs text-gray-400">
          已输入 {text.length} 字符
        </span>
      </div>
    </div>
  );
}
