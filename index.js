"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const db_1 = __importDefault(require("./utils/db"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const body_parser_1 = __importDefault(require("body-parser"));
const path_1 = __importDefault(require("path"));
const authDashboard_1 = __importDefault(require("./routes/authDashboard"));
dotenv_1.default.config({ path: "server/.env" });
// Call the connectDB function to establish the database connection
(0, db_1.default)();
// Setting up cloudinary configuration
cloudinary_1.default.v2.config({
    cloud_name: "ddbiofmni",
    api_key: "629285927862696",
    api_secret: "7i7owfVVo3t860usBWvJqTITMHY",
});
const app = (0, express_1.default)();
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "50mb" }));
// Use body-parser middleware with increased limit
// app.use(express.json({ limit: "50mb" }));
app.use(body_parser_1.default.json({ limit: "50mb" }));
app.use(body_parser_1.default.urlencoded({ limit: "50mb", extended: true }));
// Use cookie-parser middleware
app.use((0, cookie_parser_1.default)());
// Mount the routes under the '/api' prefix
app.use("/api", authRoutes_1.default);
app.use('/api/dashboard', authDashboard_1.default);
// @ts-ignore
// app.use("/api/upload", router_upload);
app.listen(3001, () => {
    console.log("Server is running on port 3001");
});
