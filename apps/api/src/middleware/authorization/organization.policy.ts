import type {
    OrganizationRole,
  } from "../../generated/prisma/client.js";
  
  export function isOrganizationOwner(
    role: OrganizationRole,
  ): boolean {
    return role === "OWNER";
  }
  
  export function canManageMembers(
    role: OrganizationRole,
  ): boolean {
    return (
      role === "OWNER" ||
      role === "ADMIN"
    );
  }
  
  export function canInviteAsAdmin(
    role: OrganizationRole,
  ): boolean {
    return role === "OWNER";
  }
  
  export function canManageAdmin(
    role: OrganizationRole,
  ): boolean {
    return role === "OWNER";
  }
  
  export function canModifyOrganization(
    role: OrganizationRole,
  ): boolean {
    return role === "OWNER";
  }