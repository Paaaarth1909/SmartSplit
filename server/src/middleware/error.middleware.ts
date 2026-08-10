import { Request, Response, NextFunction } from "express";

export interface CustomError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, unknown>;
}

export const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Resource not found. Invalid ID format.";
  }

  if (err.code === 11000 && err.keyValue) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered for '${field}'. Please use another value.`;
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  }

  return res.status(statusCode).json({
    success: false,
    error: message
  });
};
