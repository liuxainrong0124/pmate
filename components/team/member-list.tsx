"use client";

import { useState, useCallback } from "react";
import { getMembers, updateMember, removeMember, addLog } from "@/lib/store/local-store";
import type { StoredMember } from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";
import { InviteDialog } from "@/components/team/invite-dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { UserPlus, Trash2, Mail, Calendar, Users } from "lucide-react";

const roleLabels: Record<string, string> = {
  admin: "管理员",
  member: "成员",
  viewer: "观察者",
};

const roleBadgeColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  member: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  viewer: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400",
};

const statusLabels: Record<string, string> = {
  active: "已激活",
  pending: "待加入",
};

const statusBadgeColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
};

function getInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

const avatarColors = [
  "bg-purple-500", "bg-blue-500", "bg-emerald-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

interface Props {
  role: "admin" | "member" | "viewer";
}

export function MemberList({ role }: Props) {
  const [members, setMembers] = useState<StoredMember[]>(getMembers());
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setMembers([...getMembers()]);
  }, []);

  const handleRoleChange = (id: string, newRole: "admin" | "member" | "viewer") => {
    updateMember(id, { role: newRole });
    const member = members.find(m => m.id === id);
    addLog("编辑", member?.name || id, `角色变更为 ${roleLabels[newRole]}`);
    showToast("成员角色已更新", "success");
    refresh();
  };

  const handleRemove = (id: string) => {
    const member = members.find(m => m.id === id);
    removeMember(id);
    addLog("删除", member?.name || id, "移除团队成员");
    showToast("成员已移除", "success");
    setConfirmRemove(null);
    refresh();
  };

  const handleInviteSuccess = () => {
    refresh();
    setInviteOpen(false);
  };

  if (members.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 p-12 text-center">
        <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">暂无团队成员</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mb-4">邀请成员加入团队开始协作</p>
        {role === "admin" && (
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            邀请成员
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Invite button */}
      {role === "admin" && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            邀请成员
          </button>
        </div>
      )}

      {/* Member cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <div
            key={member.id}
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Header: avatar + name + role */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full ${getAvatarColor(member.name)} flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
                {getInitial(member.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {member.name}
                  </span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusBadgeColors[member.status]}`}>
                    {statusLabels[member.status]}
                  </span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>加入于 {member.joinedAt}</span>
              </div>
            </div>

            {/* Role selector + Remove button */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800">
              {role === "admin" ? (
                <Select
                  value={member.role}
                  onValueChange={(val) => {
                    if (val && val !== member.role) {
                      handleRoleChange(member.id, val as "admin" | "member" | "viewer");
                    }
                  }}
                >
                  <SelectTrigger size="sm" className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">管理员</SelectItem>
                    <SelectItem value="member">成员</SelectItem>
                    <SelectItem value="viewer">观察者</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeColors[member.role]}`}>
                  {roleLabels[member.role]}
                </span>
              )}
              {role === "admin" && (
                <div className="relative">
                  <button
                    onClick={() => setConfirmRemove(confirmRemove === member.id ? null : member.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    移除
                  </button>
                  {confirmRemove === member.id && (
                    <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg z-10 whitespace-nowrap">
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">确定移除 {member.name}？</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                          确定
                        </button>
                        <button
                          onClick={() => setConfirmRemove(null)}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add member card (admin only, shown as dashed invite card) */}
        {role === "admin" && (
          <button
            onClick={() => setInviteOpen(true)}
            className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md p-5 flex flex-col items-center justify-center gap-2 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50/50 dark:hover:bg-purple-500/5 transition-all min-h-[200px]"
          >
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">邀请成员</span>
          </button>
        )}
      </div>

      {/* Invite Dialog */}
      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSuccess={handleInviteSuccess}
      />
    </div>
  );
}
