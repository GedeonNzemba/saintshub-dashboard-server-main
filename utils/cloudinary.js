"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const cloud_name = 'ddbiofmni';
const api_key = '629285927862696';
const api_secret = '7i7owfVVo3t860usBWvJqTITMHY';
cloudinary_1.v2.config({
    cloud_name: cloud_name,
    api_key: api_key,
    api_secret: api_secret,
});
exports.default = cloudinary_1.v2;
