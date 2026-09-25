import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "smartsplit_jwt_secret_key_2026_super_secure_token";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface TokenPayload {
  id: string;
  email: string;
  fullName?: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};
