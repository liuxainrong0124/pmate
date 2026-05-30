import { getCurrentUserRole } from "@/lib/store/local-store";

export type Role = "admin" | "member" | "viewer";

/** Get current user role (default admin) */
export function getUserRole(): Role {
  return getCurrentUserRole();
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

/** Check if current user can view - always true, but used for conditional UI */
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
