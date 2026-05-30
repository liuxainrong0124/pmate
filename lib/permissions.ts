let _authRole: Role | null = null;

export type Role = "admin" | "member" | "viewer";

/** Called by AuthGuard to sync Supabase role into permissions */
export function syncAuthRole(role: Role | null) {
  _authRole = role;
}

/** Get current user role (auth context first, localStorage fallback) */
export function getUserRole(): Role {
  if (_authRole) return _authRole;
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("pulse_user_role");
    if (stored === "admin" || stored === "member" || stored === "viewer") return stored;
  }
  return "admin"; // default for local dev
}

/** Check if current user can edit/delete content */
export function canEdit(): boolean {
  const role = getUserRole();
  return role === "admin" || role === "member";
}

/** Check if current user can manage team (invite, remove, change roles) */
export function canManageTeam(): boolean {
  return getUserRole() === "admin";
}

/** Check if current user can view - always true */
export function canView(): boolean {
  return true;
}

/** Check if current user can perform destructive actions */
export function canDelete(): boolean {
  return canEdit();
}

/** Get the label for a role */
export function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    admin: "管理员",
    member: "成员",
    viewer: "观察者",
  };
  return labels[role] || role;
}

/** Get the description for a role */
export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    admin: "可管理团队和所有内容",
    member: "可编辑内容，不可管理团队",
    viewer: "仅可查看，不可编辑",
  };
  return descriptions[role] || "";
}
