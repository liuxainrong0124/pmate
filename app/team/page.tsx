"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MemberList } from "@/components/team/member-list";
import { OperationLogs } from "@/components/team/operation-logs";
import { getCurrentUserRole } from "@/lib/store/local-store";
import { Users, Shield } from "lucide-react";

const roleLabels: Record<string, string> = {
  admin: "管理员",
  member: "成员",
  viewer: "观察者",
};

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  member: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  viewer: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400",
};

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState("members");
  const role = getCurrentUserRole();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 relative">
      {/* Module tint bar */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-purple-200/60 dark:from-purple-500/15 to-transparent pointer-events-none" />

      <div className="mb-10 relative">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">团队协作</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">管理团队成员与查看操作记录</p>
          </div>
        </div>

        {/* Current role badge */}
        <div className="flex items-center gap-2 mt-4">
          <Shield className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400">当前角色：</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[role]}`}>
            {roleLabels[role]}
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line" className="mb-6">
          <TabsTrigger value="members">成员管理</TabsTrigger>
          <TabsTrigger value="logs">操作日志</TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          <MemberList role={role} />
        </TabsContent>
        <TabsContent value="logs">
          <OperationLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
