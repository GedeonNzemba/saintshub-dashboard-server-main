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
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findById(new mongoose_1.default.Types.ObjectId(req.userId));
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json(user);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error." });
    }
});
const logoutUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("User Id", req.userId);
    yield User_1.default.findByIdAndRemove(req.userId)
        .then((user) => {
        return res.json({ message: "User Deleted! ", user });
    })
        .catch((error) => console.log(error));
});
const updatePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { password, confirmPassword } = req.body;
        // CHECK PASSWORD
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match." });
        }
        const user = yield User_1.default.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        // Check if the new password is the same as the initial password
        const isNewPasswordSameAsInitial = yield bcrypt_1.default.compare(password, user.password);
        if (isNewPasswordSameAsInitial) {
            return res.status(400).json({ message: "New password must be different from the current password." });
        }
        // Hash the new password
        const hashedNewPassword = yield bcrypt_1.default.hash(password, 10);
        // Update the user's password
        user.password = hashedNewPassword;
        yield user.save();
        res.status(200).json({ message: 'Password has been updated !', user: user });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error." });
    }
});
// Update User Info
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, surname, email } = req.body;
        if (!name || !surname || !email) {
            console.log("UPDATE USER - FUNC ", JSON.stringify(req.body));
            return res.status(400).json({ message: "Please fill in all fields." });
        }
        const user = yield User_1.default.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const updatedUser = yield User_1.default.findByIdAndUpdate(req.userId, {
            $set: {
                name,
                surname,
                email,
            },
        }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json(updatedUser);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error." });
    }
});
// Update User Image
const updateUserImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { avatar } = req.body;
        if (!avatar) {
            console.log("UPDATE USER - FUNC ", JSON.stringify(req.body));
            return res.status(400).json({ message: "Please select an image to upload." });
        }
        const user = yield User_1.default.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const updatedUser = yield User_1.default.findByIdAndUpdate(req.userId, {
            $set: {
                avatar,
            },
        }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json(updatedUser);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error." });
    }
});
exports.default = { getUser, logoutUser, updateUser, updatePassword, updateUserImage };
