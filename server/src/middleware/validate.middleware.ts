import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError, ZodIssue } from "zod";

export const validate =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as { body?: any; query?: any; params?: any };
      req.body = parsed.body || req.body;
      req.query = parsed.query || req.query;
      req.params = parsed.params || req.params;
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
