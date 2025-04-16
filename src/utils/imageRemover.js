import { rembg } from '@remove-background-ai/rembg.js';

export default function imageRemover(inputPath) {

  // API_KEY will be loaded from the .env file
  const API_KEY = '37bd381f-8d21-4979-b0b4-6c4722ce0aa7';

  // log upload and download progress
  const onDownloadProgress = console.log;
  const onUploadProgress = console.log;
  rembg({
    apiKey: API_KEY,
    inputImagePath: inputPath,
    onDownloadProgress,
    onUploadProgress
  }).then(({ outputImagePath, cleanup }) => {
    console.log('✅🎉 background removed and saved under path=', outputImagePath);
    // if called, it will cleanup (remove from disk) your removed background image
    // cleanup();
  });
}