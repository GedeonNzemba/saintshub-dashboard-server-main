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
const express_1 = __importDefault(require("express"));
const Space_1 = require("../models/Space");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const dashboardController_1 = __importDefault(require("../controllers/dashboardController"));
const router = express_1.default.Router();
// Create a new church
router.post("/create-church", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const churchData = req.body;
        const newChurch = yield Space_1.ChurchModel.create(churchData);
        res.status(201).json(newChurch);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
// Update a specific field in the church document
router.patch("/churches/:id/:field", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, field } = req.params;
        const updateData = { [field]: req.body[field] };
        const updatedChurch = yield Space_1.ChurchModel.findByIdAndUpdate(id, updateData, { new: true });
        res.json(updatedChurch);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
router.get("/churches", authMiddleware_1.default, dashboardController_1.default.getAllChurch);
exports.default = router;
