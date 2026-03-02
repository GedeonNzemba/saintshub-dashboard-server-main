import { Request, Response } from "express";
import Documents, { DocumentsDocument } from "../models/Documents";

interface AuthRequest extends Request {
  userId?: string;
}

const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const documents = await Documents.find();
    //res.json(documents);

    if (!documents) {
      return res.status(404).json({ message: "documents not found." });
    }

    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

export default { getDocuments };

//export default { getDocuments };
