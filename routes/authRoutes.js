"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/authRoutes.ts
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const userController_1 = __importDefault(require("../controllers/userController"));
const react_native_uuid_1 = __importDefault(require("react-native-uuid"));
const fileControllers_1 = __importDefault(require("../controllers/fileControllers"));
const formidable_1 = __importDefault(require("formidable"));
const path_1 = __importDefault(require("path"));
const fileParser_1 = __importDefault(require("../middlewares/fileParser"));
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const router = express_1.default.Router();
const JWT_SECRET = "8b4061ff56160f352be1233f6138b39824a026de71dc75cfd347e7f9b33450be9a9f0d7d865ab903177879ae8629e7458d7a405195149a0c0b5f22a95d0852d1";
// router.post("/create-note", (req, res) => {
//   res.send("<h1>Welcome to file upload</h1>");
// });
// ******************************************** FILE UPLOADER ************************************************
router.post("/upload-file", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const form = (0, formidable_1.default)({
        uploadDir: path_1.default.join(__dirname, "public"),
        filename(name, ext, part) {
            const uniqueFileName = Date.now() + "_" + (part.originalFilename || name + ".jpg");
            return uniqueFileName;
        },
    });
    yield form.parse(req);
    res.json({ ok: true });
}));
router.post("/upload-file-to-cloud", fileParser_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { files } = req;
    const myFile = files === null || files === void 0 ? void 0 : files.profileImage;
    if (Array.isArray(myFile)) {
        // Multiple files upload
    }
    else {
        if (myFile) {
            const cloudRes = yield cloudinary_1.default.uploader.upload(myFile.filepath);
            res.json(Object.assign({}, cloudRes));
        }
    }
}));
// ******************************************** FILE UPLOADER ENDS ************************************************
// SIGN UP
router.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, surname, email, password, confirmPassword, avatar } = req.body;
        if (!name || !surname || !email || !password || !confirmPassword || !avatar) {
            return res.status(400).json({ message: "Please fill in all fields." });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match." });
        }
        // Check if user already exists
        const existingUser = yield User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists." });
        }
        // Hash the password
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        // Create a new user
        const newUser = new User_1.default({
            name,
            surname,
            email,
            password: hashedPassword,
            avatar: {
                public_id: react_native_uuid_1.default.v4(),
                url: avatar,
            },
        });
        yield newUser.save();
        // Create and sign a JWT token
        const token = jsonwebtoken_1.default.sign({ userId: newUser._id }, JWT_SECRET, {
            expiresIn: "1h",
        });
        res.status(201).json({ token });
    }
    catch (error) {
        console.error("error", error);
        res.status(500).json({ message: "Server error." });
    }
}));
// SIGN IN
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Please fill in all fields." });
        }
        // Find the user by email
        const user = yield User_1.default.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials." });
        }
        // Compare passwords
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid Password credentials." });
        }
        else {
            console.log("USER: ", user);
        }
        // Create and sign a JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_SECRET, {
            expiresIn: "1h",
        });
        // Set the JWT token as a cookie
        res.cookie("token", token, { httpOnly: true });
        res.status(200).json({ token, user });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error." });
    }
}));
// SIGN OUT
router.post("/signout", (req, res) => {
    res.clearCookie("token"); // Clear the JWT token cookie
    res.status(200).json({ message: "Sign-out successful." });
});
router.get("/user", authMiddleware_1.default, userController_1.default.getUser);
router.get('/user/logout', authMiddleware_1.default, userController_1.default.logoutUser); // New route for logout
router.put("/user/update-user", authMiddleware_1.default, userController_1.default.updateUser);
router.put("/user/update-avatar", authMiddleware_1.default, userController_1.default.updateUserImage);
router.put("/user/update-password", authMiddleware_1.default, userController_1.default.updatePassword);
router.get("/documents", authMiddleware_1.default, fileControllers_1.default.getDocuments);
exports.default = router;
