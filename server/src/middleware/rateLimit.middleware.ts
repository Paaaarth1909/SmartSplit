import { Request, Response, NextFunction } from "express";

interface LoginAttempt {
  attempts: number;
  lockoutUntil?: number;
  firstAttemptAt: number;
}

const loginAttempts = new Map<string, LoginAttempt>();
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const WINDOW_DURATION_MS = 15 * 60 * 1000;

export const recordFailedLogin = (email: string) => {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const record = loginAttempts.get(key) || { attempts: 0, firstAttemptAt: now };

  if (now - record.firstAttemptAt > WINDOW_DURATION_MS) {
    record.attempts = 1;
    record.firstAttemptAt = now;
    delete record.lockoutUntil;
  } else {
    record.attempts += 1;
    if (record.attempts >= LOCKOUT_THRESHOLD) {
      record.lockoutUntil = now + LOCKOUT_DURATION_MS;
    }
  }

  loginAttempts.set(key, record);
};

export const clearFailedLogin = (email: string) => {
  loginAttempts.delete(email.toLowerCase().trim());
};

export const checkLoginLockout = (req: Request, res: Response, next: NextFunction) => {
  const email = (req.body?.email || "").toLowerCase().trim();
  if (!email) return next();

  const record = loginAttempts.get(email);
  if (record && record.lockoutUntil) {
    const now = Date.now();
    if (now < record.lockoutUntil) {
      const remainingMinutes = Math.ceil((record.lockoutUntil - now) / 60000);
      return res.status(429).json({
        success: false,
        error: `Account temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute${remainingMinutes > 1 ? "s" : ""} or reset your password.`,
      });
    } else {
      loginAttempts.delete(email);
    }
  }
  next();
};

interface IpRequestWindow {
  count: number;
  resetTime: number;
}

const ipBuckets = new Map<string, IpRequestWindow>();

export const createRateLimiter = (options: { max: number; windowMs: number; message: string }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const bucket = ipBuckets.get(ip);

    if (!bucket || now > bucket.resetTime) {
      ipBuckets.set(ip, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > options.max) {
      return res.status(429).json({
        success: false,
        error: options.message,
      });
    }

    next();
  };
};

export const authRateLimiter = createRateLimiter({
  max: 30,
  windowMs: 60 * 1000,
  message: "Too many authentication requests from this IP. Please slow down and try again in a minute.",
});
