import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError, ZodIssue } from "zod";

export const validate =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((e: ZodIssue) => `${e.path.join(".")}: ${e.message}`);
        return res.status(400).json({
          success: false,
          error: issues.join(" | ")
        });
      }
      return res.status(400).json({ success: false, error: "Invalid request payload" });
    }
  };
