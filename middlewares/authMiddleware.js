"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutMiddleware = exports.JWT_SECRET = void 0;
// src/middlewares/authMiddleware.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.JWT_SECRET = "8b4061ff56160f352be1233f6138b39824a026de71dc75cfd347e7f9b33450be9a9f0d7d865ab903177879ae8629e7458d7a405195149a0c0b5f22a95d0852d1";
const authMiddleware = (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);
        console.log('UPDATE USER - TOKEN ', token);
        if (!token) {
            console.log('UPDATE USER - NO TOKEN ', token);
            return res.status(401).json({ message: "Unauthorized." });
        }
        const decodedToken = verifyToken(token);
        console.log('UPDATE USER - DECODED ', token);
        if (!decodedToken) {
            console.log('UPDATE USER - UNABLE TO DECODE ', token);
            return res.status(401).json({ message: "Unauthorized." });
        }
        setUserIdOnRequest(req, decodedToken.userId);
        next();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error." });
    }
};
const getTokenFromRequest = (req) => {
    const authorizationHeader = req.header("Authorization");
    if (authorizationHeader && authorizationHeader.startsWith("Bearer ")) {
        return authorizationHeader.substring(7);
    }
    return null;
};
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, exports.JWT_SECRET);
    }
    catch (error) {
        // Handle the error (e.g., log it or return a specific error message)
        console.error("Token verification failed:", error);
        return "Invalid token";
    }
};
const setUserIdOnRequest = (req, userId) => {
    req.userId = userId;
};
// ******************************** SIGN OUT ********************************
const logoutMiddleware = (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);
        clearUserIdOnRequest(req);
        res.status(200).json({ message: "Logout successful. 1" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during logout." });
    }
};
exports.logoutMiddleware = logoutMiddleware;
const clearUserIdOnRequest = (req) => {
    delete req.userId;
};
// ******************************** SIGN OUT ENDS ********************************
exports.default = authMiddleware;
