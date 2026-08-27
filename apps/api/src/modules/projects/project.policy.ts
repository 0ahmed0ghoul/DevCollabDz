import type {
    ProjectRole,
  } from "../../generated/prisma/client.js";
  
  export function canManageProject(
    role: ProjectRole,
  ): boolean {
    return (
      role === "OWNER" ||
      role === "ADMIN"
    );
  }
  
  export function canManageProjectMembers(
    role: ProjectRole,
  ): boolean {
    return (
      role === "OWNER" ||
      role === "ADMIN"
    );
  }
  
  export function canManageProjectAdmins(
    role: ProjectRole,
  ): boolean {
    return role === "OWNER";
  }
  
  export function canModifyProject(
    role: ProjectRole,
  ): boolean {
    return (
      role === "OWNER" ||
      role === "ADMIN"
    );
  }
  
  export function canDeleteProject(
    role: ProjectRole,
  ): boolean {
    return role === "OWNER";
  }