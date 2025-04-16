// src/middlewares/authMiddleware.ts
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

interface DecodedToken {
  userId: string;
}

export const JWT_SECRET =
  "8b4061ff56160f352be1233f6138b39824a026de71dc75cfd347e7f9b33450be9a9f0d7d865ab903177879ae8629e7458d7a405195149a0c0b5f22a95d0852d1";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromRequest(req);
    console.log('UPDATE USER - TOKEN ', token);
    
    if (!token) {
      console.log('UPDATE USER - NO TOKEN ', token);
      return res.status(401).json({ message: "Unauthorized." });
    }

    const decodedToken = verifyToken(token) as DecodedToken;
    console.log('UPDATE USER - DECODED ', token);

    if (!decodedToken) {
      console.log('UPDATE USER - UNABLE TO DECODE ', token);
      return res.status(401).json({ message: "Unauthorized." });
    }

    setUserIdOnRequest(req, decodedToken.userId);
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

const getTokenFromRequest = (req: Request): string | null => {
  const authorizationHeader = req.header("Authorization");
  if (authorizationHeader && authorizationHeader.startsWith("Bearer ")) {
    return authorizationHeader.substring(7);
  }
  return null;
};

const verifyToken = (token: string): DecodedToken | string => {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch (error) {
    // Handle the error (e.g., log it or return a specific error message)
    console.error("Token verification failed:", error);
    return "Invalid token";
  }
};


const setUserIdOnRequest = (req: Request, userId: string): void => {
  (req as any).userId = userId;
};

// ******************************** SIGN OUT ********************************

export const logoutMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromRequest(req);

    clearUserIdOnRequest(req);

    res.status(200).json({ message: "Logout successful. 1" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during logout." });
  }
};

const clearUserIdOnRequest = (req: Request): void => {
  delete (req as any).userId;
};

// ******************************** SIGN OUT ENDS ********************************

export default authMiddleware;
