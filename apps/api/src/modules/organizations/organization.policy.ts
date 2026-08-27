
import type {
    OrganizationRole,
  } from "../../generated/prisma/client.js";
  
  export function canDeleteOrganization(
    role: OrganizationRole,
  ): boolean {
    return role === "OWNER";
  }
  
  export function canTransferOwnership(
    role: OrganizationRole,
  ): boolean {
    return role === "OWNER";
  }