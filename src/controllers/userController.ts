import { Request, Response } from "express";
import User, { UserDocument } from "../models/User";
import mongoose from "mongoose";
import { logoutMiddleware } from "../middlewares/authMiddleware";
import bcrypt from "bcrypt";

interface AuthRequest extends Request {
  userId?: string;
  body: {
    name: string;
    surname: string;
    email: string;
    password: string;
    confirmPassword: string;
    avatar: string;
    // Add other properties as needed
  };
}

// Define a custom interface that extends the existing Request interface
interface CustomRequest extends Request {
  body: {
    // Define the properties you expect in the request body
    name: string;
    surname: string;
    email: string;
    // Add other properties as needed
  };
}

const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(new mongoose.Types.ObjectId(req.userId));

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

const logoutUser = async (req: AuthRequest, res: Response) => {
  try {
    // invalidate/blacklist the token on the server side
    // or simply send a success response since the client already removed the token
    return res.status(200).json({ 
      success: true,
      message: "Successfully logged out" 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: "Error during logout",
      error: error 
    });
  }
};

const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { password, confirmPassword } = req.body;

     // CHECK PASSWORD
     if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the new password is the same as the initial password
    const isNewPasswordSameAsInitial = await bcrypt.compare(password, user.password);

    if (isNewPasswordSameAsInitial) {
      return res.status(400).json({ message: "New password must be different from the current password." });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    user.password = hashedNewPassword;
    await user.save();
    res.status(200).json({message: 'Password has been updated !', user: user});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
}

// Update User Info
const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, surname, email } = req.body;

    if (!name || !surname || !email) {
      console.log("UPDATE USER - FUNC ", JSON.stringify(req.body));
      return res.status(400).json({ message: "Please fill in all fields." });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          name,
          surname,
          email,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

// Update User Image
const updateUserImage = async (req: AuthRequest, res: Response) => {
  try {
    const { avatar } = req.body;

    if (!avatar) {
      console.log("UPDATE USER - FUNC ", JSON.stringify(req.body));
      return res.status(400).json({ message: "Please select an image to upload." });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          avatar,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

export default { getUser, logoutUser, updateUser, updatePassword, updateUserImage };
