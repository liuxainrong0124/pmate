"use client";

import { useState, useEffect } from "react";
import { Settings, Bell, Palette, Shield, User, Monitor, Globe, Key, ChevronRight, Check, X, AlertTriangle, RefreshCw } from "lucide-react";
import { getSettings, saveSettings, StoredSettings } from "@/lib/store/local-store";
import { getAlertSettings, saveAlertSettings, AlertSettings } from "@/lib/alert";
import { isNotificationSupported, getNotificationPermission, requestNotificationPermission } from "@/lib/notify";
import { showToast } from "@/components/shared/toast";

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoredSettings | null>(null);
  const [alertSettings, setAlertSettings] = useState<AlertSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifyPerm, setNotifyPerm] = useState<NotificationPermission>("default");

  useEffect(() => {
    setSettings(getSettings());
    setAlertSettings(getAlertSettings());
    if (isNotificationSupported()) setNotifyPerm(getNotificationPermission());
  }, []);

  const update = (updates: Partial<StoredSettings>) => {
    const next = { ...settings!, ...updates };
    setSettings(next);
    saveSettings(updates);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleThemeChange = (theme: StoredSettings["theme"]) => {
    update({ theme });
    // Sync to dedicated key for FOUC-prevention inline script
    try { localStorage.setItem("pulse_theme", theme); } catch {}
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  };

  const handleToggle = (key: "pushNotifications" | "emailNotifications") => {
    update({ [key]: !settings![key] });
  };

  if (!settings) return null;

  return (
    <div className="max-w-[720px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-10 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Settings className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">设置</h1>
            <p className="text-sm text-gray-400 mt-0.5">管理你的 Pulse 工作台偏好</p>
          </div>
        </div>
        {saved && (
          <span className="text-xs text-emerald-600 font-medium animate-fade-in">设置已保存</span>
        )}
      </div>

      {/* Profile */}
      <section className="mb-8 animate-fade-in">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">通用设置</h2>
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors border-b border-gray-50"
          >
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-medium text-gray-900">个人资料</p>
              <p className="text-xs text-gray-400 mt-0.5">{settings.userName || "Pulse 用户"}</p>
            </div>
            <span className="text-xs text-gray-400 flex items-center gap-0.5 shrink-0">
              编辑 <ChevronRight className="w-3 h-3" />
            </span>
          </button>

          <div className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors border-b border-gray-50">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <Monitor className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">工作台偏好</p>
              <p className="text-xs text-gray-400 mt-0.5">默认首页为仪表盘</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors border-b border-gray-50">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">语言与区域</p>
              <p className="text-xs text-gray-400 mt-0.5">简体中文 · 北京时间 (UTC+8)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Theme Selector */}
      <section className="mb-8 animate-fade-in">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-sm text-gray-900">主题外观</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: "light" as const, label: "浅色", desc: "明亮清爽" },
              { key: "dark" as const, label: "深色", desc: "护眼舒适" },
              { key: "system" as const, label: "跟随系统", desc: "自动切换" },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => handleThemeChange(t.key)}
                className={`rounded-xl border-2 p-4 text-center transition-all duration-200 ${
                  settings.theme === t.key
                    ? "border-gray-900 bg-gray-50 shadow-sm"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg mx-auto mb-2 ${
                  t.key === "dark" ? "bg-gray-800" : t.key === "system" ? "bg-gradient-to-br from-white to-gray-800 border border-gray-200" : "bg-white border border-gray-200"
                }`} />
                <p className="text-sm font-medium text-gray-900">{t.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{t.desc}</p>
                {settings.theme === t.key && (
                  <Check className="w-4 h-4 text-gray-900 mx-auto mt-2" />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="mb-8 animate-fade-in">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">通知设置</h2>
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 p-4 border-b border-gray-50">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">消息通知</p>
              <p className="text-xs text-gray-400 mt-0.5">异动告警、评审提醒、推送效果通知</p>
            </div>
            <button
              onClick={() => handleToggle("pushNotifications")}
              className={`w-10 h-6 rounded-full shrink-0 relative transition-colors ${
                settings.pushNotifications ? "bg-gray-900" : "bg-gray-200"
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                settings.pushNotifications ? "left-[18px]" : "left-0.5"
              }`} />
            </button>
          </div>
          <div className="flex items-center gap-4 p-4">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">邮件通知</p>
              <p className="text-xs text-gray-400 mt-0.5">每日数据摘要、周报自动发送</p>
            </div>
            <button
              onClick={() => handleToggle("emailNotifications")}
              className={`w-10 h-6 rounded-full shrink-0 relative transition-colors ${
                settings.emailNotifications ? "bg-gray-900" : "bg-gray-200"
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                settings.emailNotifications ? "left-[18px]" : "left-0.5"
              }`} />
            </button>
          </div>
        </div>
      </section>

      {/* Data Alerts */}
      <section className="mb-8 animate-fade-in">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">数据告警</h2>
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {/* Auto refresh toggle */}
          <div className="flex items-center gap-4 p-4 border-b border-gray-50">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">数据自动刷新</p>
              <p className="text-xs text-gray-400 mt-0.5">每 5 分钟自动拉取最新数据</p>
            </div>
            <button
              onClick={() => {
                const next = { autoRefresh: !alertSettings!.autoRefresh };
                setAlertSettings({ ...alertSettings!, ...next });
                saveAlertSettings(next);
                showToast(alertSettings!.autoRefresh ? "已关闭自动刷新" : "已开启自动刷新", "success");
              }}
              className={`w-10 h-6 rounded-full shrink-0 relative transition-colors ${
                alertSettings?.autoRefresh ? "bg-gray-900" : "bg-gray-200"
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                alertSettings?.autoRefresh ? "left-[18px]" : "left-0.5"
              }`} />
            </button>
          </div>

          {/* Browser notification */}
          <div className="flex items-center gap-4 p-4 border-b border-gray-50">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">浏览器通知</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {notifyPerm === "granted" ? "已授权 ✓" : notifyPerm === "denied" ? "已拒绝 ✗" : "需要授权"}
              </p>
            </div>
            {notifyPerm !== "granted" && (
              <button
                onClick={async () => {
                  const result = await requestNotificationPermission();
                  setNotifyPerm(result);
                  if (result === "granted") {
                    showToast("通知已开启", "success");
                  } else {
                    showToast("通知授权被拒绝或被浏览器阻止", "error");
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors"
              >
                授权通知
              </button>
            )}
          </div>

          {/* Alert threshold */}
          <div className="flex items-center gap-4 p-4 border-b border-gray-50">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">异动告警阈值</p>
              <p className="text-xs text-gray-400 mt-0.5">指标变化超过 ±{alertSettings?.threshold || 5}% 时通知</p>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const threshold = Math.max(1, (alertSettings?.threshold || 5) - 1);
                  setAlertSettings({ ...alertSettings!, threshold });
                  saveAlertSettings({ threshold });
                }}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-sm font-medium"
              >−</button>
              <input
                type="range"
                min={1}
                max={20}
                value={alertSettings?.threshold || 5}
                onChange={(e) => {
                  const threshold = Number(e.target.value);
                  setAlertSettings({ ...alertSettings!, threshold });
                  saveAlertSettings({ threshold });
                }}
                className="flex-1 h-2 rounded-full appearance-none bg-gray-200 accent-gray-900 cursor-pointer"
              />
              <span className="text-sm font-semibold text-gray-900 w-10 text-center tabular-nums">±{alertSettings?.threshold || 5}%</span>
              <button
                onClick={() => {
                  const threshold = Math.min(20, (alertSettings?.threshold || 5) + 1);
                  setAlertSettings({ ...alertSettings!, threshold });
                  saveAlertSettings({ threshold });
                }}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-sm font-medium"
              >+</button>
            </div>
          </div>

          {/* Alert enable toggle */}
          <div className="flex items-center gap-4 p-4">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">启用异动告警</p>
              <p className="text-xs text-gray-400 mt-0.5">检测到异常波动时弹窗+通知</p>
            </div>
            <button
              onClick={() => {
                const next = { enabled: !alertSettings!.enabled };
                setAlertSettings({ ...alertSettings!, ...next });
                saveAlertSettings(next);
                showToast(alertSettings!.enabled ? "已关闭异动告警" : "已开启异动告警", "success");
              }}
              className={`w-10 h-6 rounded-full shrink-0 relative transition-colors ${
                alertSettings?.enabled ? "bg-gray-900" : "bg-gray-200"
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                alertSettings?.enabled ? "left-[18px]" : "left-0.5"
              }`} />
            </button>
          </div>
        </div>
      </section>

      {/* API Key */}
      <section className="mb-8 animate-fade-in">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-1">AI 配置</h2>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">DeepSeek API Key</h3>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            在 <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 underline">platform.deepseek.com</a> 免费注册获取。Key 仅保存在浏览器本地，不上传服务器。
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="sk-xxxxxxxxxxxxxxxx"
              value={settings.deepseekApiKey || ""}
              onChange={(e) => update({ deepseekApiKey: e.target.value })}
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm font-mono focus:outline-none focus:border-violet-400 dark:focus:border-violet-600"
            />
            <button
              onClick={() => {
                const input = document.querySelector<HTMLInputElement>('[placeholder="sk-xxxxxxxxxxxxxxxx"]');
                if (input) input.type = input.type === "password" ? "text" : "password";
              }}
              className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl"
            >
              显示
            </button>
          </div>
          {settings.deepseekApiKey && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">Key 已配置</p>
          )}
        </div>
      </section>

      {/* Privacy */}
      <section className="mb-8 animate-fade-in">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-1">安全与隐私</h2>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 p-4">
            <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">数据隐私</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">所有数据仅存储在浏览器本地，不上传至任何第三方服务器</p>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Edit Modal */}
      {profileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setProfileOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-fade-in border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">编辑个人资料</h3>
              <button onClick={() => setProfileOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">用户名</label>
                <input
                  type="text"
                  value={settings.userName}
                  onChange={(e) => update({ userName: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:border-violet-400 dark:focus:border-violet-600"
                  placeholder="输入你的名字"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">邮箱</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => update({ email: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:border-violet-400 dark:focus:border-violet-600"
                  placeholder="your@email.com"
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">个人信息仅本地保存，不会上传至服务器</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center animate-fade-in">
        <p className="text-xs text-gray-400">Pulse v0.2.0 · AI产品与运营工作台</p>
        <p className="text-xs text-gray-300 mt-1">Built with Next.js · DeepSeek / Claude API</p>
      </div>
    </div>
  );
}
