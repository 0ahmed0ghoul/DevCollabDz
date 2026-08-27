
import type {
    NextFunction,
    Request,
    Response,
  } from "express";
  
  import {
    addProjectMemberSchema,
    updateProjectMemberRoleSchema,
  } from "./project-member.schema.js";
  
  import {
    addProjectMember,
    getProjectMembers,
    removeProjectMember,
    updateProjectMemberRole,
  } from "./project-member.service.js";
  
  export async function getMembers(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }
  
      const projectId =
        req.params.projectId as string;
  
      const members =
        await getProjectMembers(
          projectId,
          req.userId,
        );
  
      return res.status(200).json({
        members,
      });
    } catch (error) {
      next(error);
    }
  }
  
  export async function addMember(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }
  
      const projectId =
        req.params.projectId as string;
  
      const result =
        addProjectMemberSchema.safeParse(
          req.body,
        );
  
      if (!result.success) {
        return res.status(400).json({
          message:
            "Validation failed",
          errors:
            result.error.flatten(),
        });
      }
  
      const member =
        await addProjectMember(
          projectId,
          req.userId,
          result.data,
        );
  
      return res.status(201).json({
        message:
          "Project member added successfully",
        member,
      });
    } catch (error) {
      next(error);
    }
  }
  
  export async function updateMemberRole(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }
  
      const projectId =
        req.params.projectId as string;
  
      const memberId =
        req.params.memberId as string;
  
      const result =
        updateProjectMemberRoleSchema.safeParse(
          req.body,
        );
  
      if (!result.success) {
        return res.status(400).json({
          message:
            "Validation failed",
          errors:
            result.error.flatten(),
        });
      }
  
      const member =
        await updateProjectMemberRole(
          projectId,
          req.userId,
          memberId,
          result.data,
        );
  
      return res.status(200).json({
        message:
          "Project member role updated successfully",
        member,
      });
    } catch (error) {
      next(error);
    }
  }
  
  export async function removeMember(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }
  
      const projectId =
        req.params.projectId as string;
  
      const memberId =
        req.params.memberId as string;
  
      await removeProjectMember(
        projectId,
        req.userId,
        memberId,
      );
  
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }