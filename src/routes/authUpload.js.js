const express = require("express");
const cloudinary = require("cloudinary");
const upload = require("../middlewares/multer");

const router_upload = express.Router();

// Handle image upload
router_upload.post('/image', upload.single('image'), function (req, res) {
  cloudinary.uploader.upload(req.file.path, function (err, result) {
    if (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "Error"
      })
    }

    res.status(200).json({
      success: true,
      message: "Uploaded!",
      data: result
    })
  })
});

module.exports =  router_upload;
