import {v2 as cloudinary} from "cloudinary"

const cloud_name = 'ddbiofmni';
const api_key = '629285927862696';
const api_secret = '7i7owfVVo3t860usBWvJqTITMHY';


cloudinary.config({
    cloud_name: cloud_name,
    api_key: api_key,
    api_secret: api_secret,
});

export default cloudinary;