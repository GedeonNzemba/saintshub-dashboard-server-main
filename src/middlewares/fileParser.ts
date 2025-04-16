import { RequestHandler } from "express";
import formidable, { File } from "formidable";

declare global {
    namespace Express {
        interface Request {
            files?: {[key: string]: File | File[]}
        }
    }
}

const fileParser: RequestHandler = async (req, res, next) => {
    const form = formidable();
    const [fields, files] = await form.parse(req);

    if (!req.body) {
        req.body = {};
    }

    for (let key in fields) {
        const value = fields[key];

        if (value) {
            req.body[key] = value[0];
        }
    }

    if (!req.files) {
        req.files = {};
    }

    for (let key in files) {
        const value = files[key];

        if (value) {
            if (value.length > 1) {
                req.files[key] = value
            } else {
                req.files[key] = value[0]
            }
        }
    }

    next();
}

export default fileParser;