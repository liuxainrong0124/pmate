"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { addMember, getMembers, addLog } from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";
import { Copy, Link, Mail, UserPlus, Check, Clock } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InviteDialog({ open, onOpenChange, onSuccess }: Props) {
  const [mode, setMode] = useState<"link" | "email">("link");
  const [email, setEmail] = useState("");
  const [emailRole, setEmailRole] = useState<"admin" | "member" | "viewer">("member");
  const [copied, setCopied] = useState(false);

  const inviteLink = useMemo(() => {
    const inviteCode = `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    return `https://pulse.app/join?code=${inviteCode}`;
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      showToast("邀请链接已复制", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("复制失败，请手动复制", "error");
    }
  };

  const handleEmailInvite = () => {
    if (!email.trim()) {
      showToast("请输入邮箱地址", "error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showToast("请输入有效的邮箱地址", "error");
      return;
    }
    const existing = getMembers().find(m => m.email === email.trim());
    if (existing) {
      showToast("该邮箱已被邀请或已是团队成员", "error");
      return;
    }
    addMember({
      name: email.split("@")[0],
      role: emailRole,
      email: email.trim(),
      status: "pending",
    });
    const roleLabel = emailRole === "admin" ? "管理员" : emailRole === "member" ? "成员" : "观察者";
    addLog("创建", email.split("@")[0], `通过邮箱邀请，角色：${roleLabel}`);
    showToast("邀请已发送", "success");
    setEmail("");
    onSuccess();
  };

  const pendingMembers = getMembers().filter(m => m.status === "pending");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>邀请团队成员</DialogTitle>
          <DialogDescription>通过链接或邮箱邀请新成员加入团队</DialogDescription>
        </DialogHeader>

        {/* Mode tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
          <button
            onClick={() => setMode("link")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
              mode === "link"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Link className="w-4 h-4" />
            邀请链接
          </button>
          <button
            onClick={() => setMode("email")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
              mode === "email"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Mail className="w-4 h-4" />
            邮箱邀请
          </button>
        </div>

        {mode === "link" ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">分享此链接给团队成员，点击即可加入</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs text-gray-600 dark:text-gray-300 font-mono truncate">
                {inviteLink}
              </div>
              <button
                onClick={handleCopyLink}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  copied
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "已复制" : "复制"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">邮箱地址</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 dark:focus:border-purple-600 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">角色</label>
              <Select value={emailRole} onValueChange={(val) => setEmailRole((val || "member") as "admin" | "member" | "viewer")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">成员</SelectItem>
                  <SelectItem value="viewer">观察者</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button
              onClick={handleEmailInvite}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              发送邀请
            </button>
          </div>
        )}

        {/* Pending members list */}
        {pendingMembers.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              待加入成员 ({pendingMembers.length})
            </p>
            <div className="space-y-2">
              {pendingMembers.map(m => (
                <div key={m.id} className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center text-yellow-700 dark:text-yellow-400 text-xs font-semibold shrink-0">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 truncate">{m.email}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 shrink-0">
                    待加入
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
