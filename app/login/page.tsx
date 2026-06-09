"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { getSettings, saveSettings } from "@/lib/store/local-store";
import { Zap, Mail, Lock, User, ArrowRight, Loader2, ShieldCheck, Eye, EyeOff, Key, Sparkles, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiKeySkipped, setApiKeySkipped] = useState(false);

  // Load existing API key from settings
  useEffect(() => {
    const settings = getSettings();
    if (settings.deepseekApiKey) {
      setApiKey(settings.deepseekApiKey);
    }
  }, []);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const emailValid = useMemo(() => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  const passwordValid = useMemo(() => {
    if (!password) return true;
    return password.length >= 6 && /[a-zA-Z]/.test(password) && /\d/.test(password);
  }, [password]);

  const confirmValid = confirmPassword === password;

  const canLogin = useMemo(() => {
    return email.trim() && password.length >= 6;
  }, [email, password]);

  const canRegister = useMemo(() => {
    return emailValid && passwordValid && confirmValid && password.length >= 6 && name.trim();
  }, [emailValid, passwordValid, confirmValid, password, name]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const errs: Record<string, string> = {};
    if (!emailValid) errs.email = "邮箱格式不正确";
    if (mode === "register") {
      if (!passwordValid) errs.password = "密码需至少6位，包含字母和数字";
      if (!confirmValid) errs.confirm = "两次密码不一致";
      if (!name.trim()) errs.name = "请输入姓名";
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    // Save API key before auth
    if (apiKey.trim()) {
      saveSettings({ deepseekApiKey: apiKey.trim() });
    }

    setSubmitting(true);
    if (mode === "login") {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err);
        setSubmitting(false);
      }
      // On success, useEffect will redirect
    } else {
      const { error: err } = await signUp(email, password, name);
      if (err) {
        setError(err);
        setSubmitting(false);
      } else {
        setError("注册成功! 请检查邮箱确认链接。");
        setSubmitting(false);
      }
    }
  };

  const handleLocalEnter = () => {
    if (!apiKey.trim()) {
      setError("请输入 DeepSeek API Key 以使用 AI 功能");
      setApiKeySkipped(true);
      return;
    }
    saveSettings({ deepseekApiKey: apiKey.trim() });
    if (!getSettings().userName || getSettings().userName === "Pulse 用户") {
      saveSettings({ userName: name.trim() || "Pulse 用户" });
    }
    router.push("/dashboard");
  };

  // Already authenticated — redirecting
  if (!loading && user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-gray-950 px-4 py-8">
      <div className="w-full max-w-[880px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center">
              <Zap className="w-5 h-5 text-white dark:text-gray-900" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pulse</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            AI 产品与运营工作台 · 配置完成后进入
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Left: Auth Card */}
          <div className="md:col-span-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <LogIn className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">账号登录</h3>
              <span className="text-[10px] text-gray-400 ml-auto">可选</span>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100/60 dark:bg-gray-800/60 p-1 rounded-xl mb-5">
              <button
                onClick={() => { setMode("login"); setError(""); setFieldErrors({}); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === "login"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                登录
              </button>
              <button
                onClick={() => { setMode("register"); setError(""); setFieldErrors({}); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === "register"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                注册
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {mode === "register" && (
                <div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="姓名"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full h-10 pl-10 pr-3 rounded-xl border bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 transition-all ${
                        fieldErrors.name ? "border-red-300 focus:ring-red-500/10" : "border-gray-200 dark:border-gray-800 focus:ring-gray-900/10 dark:focus:ring-white/10"
                      }`}
                    />
                  </div>
                  {fieldErrors.name && <p className="text-[11px] text-red-500 mt-1 ml-1">{fieldErrors.name}</p>}
                </div>
              )}

              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="邮箱"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full h-10 pl-10 pr-3 rounded-xl border bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 transition-all ${
                      fieldErrors.email || (!emailValid && email) ? "border-red-300 focus:ring-red-500/10" : "border-gray-200 dark:border-gray-800 focus:ring-gray-900/10 dark:focus:ring-white/10"
                    }`}
                  />
                </div>
                {!emailValid && email && <p className="text-[11px] text-red-500 mt-1 ml-1">邮箱格式不正确</p>}
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full h-10 pl-10 pr-10 rounded-xl border bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 transition-all ${
                      fieldErrors.password || (!passwordValid && password) ? "border-red-300 focus:ring-red-500/10" : "border-gray-200 dark:border-gray-800 focus:ring-gray-900/10 dark:focus:ring-white/10"
                    }`}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === "register" && (
                  <div className="mt-1.5 ml-1">
                    {!password && <p className="text-[11px] text-gray-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> 至少 6 位，包含字母和数字</p>}
                    {password && !passwordValid && <p className="text-[11px] text-red-500">密码需至少6位，包含字母和数字</p>}
                    {passwordValid && <p className="text-[11px] text-emerald-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> 密码格式正确</p>}
                  </div>
                )}
              </div>

              {mode === "register" && (
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      placeholder="确认密码"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full h-10 pl-10 pr-3 rounded-xl border bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 transition-all ${
                        fieldErrors.confirm || (confirmPassword && !confirmValid) ? "border-red-300 focus:ring-red-500/10" : "border-gray-200 dark:border-gray-800 focus:ring-gray-900/10 dark:focus:ring-white/10"
                      }`}
                    />
                  </div>
                  {confirmPassword && !confirmValid && <p className="text-[11px] text-red-500 mt-1 ml-1">两次密码不一致</p>}
                </div>
              )}

              {error && (
                <div className={`text-xs px-3 py-2 rounded-lg ${
                  error.includes("成功")
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                }`}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || submitting || (mode === "login" ? !canLogin : !canRegister)}
                className="w-full h-10 rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading || submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? "登录并进入工作台" : "注册并进入工作台"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
              {mode === "login" ? "还没有账号？" : "已有账号？"}
              <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setFieldErrors({}); }} className="ml-1 text-gray-900 dark:text-gray-100 font-medium hover:underline">
                {mode === "login" ? "立即注册" : "去登录"}
              </button>
            </p>
          </div>

          {/* Right: API Key Card */}
          <div className="md:col-span-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                <Key className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">API Key 配置</h3>
              <span className="text-[10px] text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-full font-medium">必需</span>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
              所有 AI 功能（日报、数据问答、需求评审、竞品分析等）依赖 DeepSeek API。
              <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline ml-1">获取 API Key →</a>
            </p>

            <div className="flex-1">
              <div className="relative mb-4">
                <Key className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type={showApiKey ? "text" : "password"}
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setApiKeySkipped(false); }}
                  className={`w-full h-10 pl-10 pr-10 rounded-xl border bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 font-mono outline-none focus:ring-2 transition-all ${
                    apiKeySkipped && !apiKey.trim() ? "border-red-300 focus:ring-red-500/10" : "border-gray-200 dark:border-gray-800 focus:ring-violet-500/20"
                  }`}
                />
                <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {apiKeySkipped && !apiKey.trim() && (
                <p className="text-[11px] text-red-500 -mt-3 mb-3 ml-1">请先配置 API Key</p>
              )}
              {apiKey.trim() && apiKey.trim().startsWith("sk-") && (
                <p className="text-[11px] text-emerald-500 flex items-center gap-1 -mt-3 mb-3 ml-1">
                  <ShieldCheck className="w-3 h-3" /> API Key 已配置
                </p>
              )}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
              <button
                onClick={handleLocalEnter}
                disabled={!apiKey.trim()}
                className="w-full h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                仅配置 API Key 进入
              </button>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-2 leading-relaxed">
                跳过注册，以本地模式使用。<br/>数据保存在浏览器本地存储中。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
