// src/index.ts
import dotenv from "dotenv";
dotenv.config(); // Load .env variables FIRST. Remove path if .env is in project root.

import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes/authRoutes";
import connectDB from "./utils/db";
import cloudinary from "cloudinary";
import bodyParser from "body-parser";
import path from "path";
import dashboardRouter from "./routes/authDashboard";
import request from "request";
import * as cheerio from 'cheerio';
import puppeteer from "puppeteer";
import { iframeStyles } from "./utils/styles";

// Call the connectDB function to establish the database connection
connectDB();

// Setting up cloudinary configuration
// SECURITY WARNING: Hardcoding credentials is risky. Use environment variables.
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "ddbiofmni", 
  api_key: process.env.CLOUDINARY_API_KEY || "629285927862696", 
  api_secret: process.env.CLOUDINARY_API_SECRET || "7i7owfVVo3t860usBWvJqTITMHY",
});

const app = express();
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Use body-parser middleware with increased limit
// app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Use cookie-parser middleware
app.use(cookieParser());

// Mount the routes under the '/api' prefix
app.use("/api", routes);
app.use("/api/dashboard", dashboardRouter);

// Define the base URL of the external site
//const baseUrl = "https://www.bible.com";

// Utility function to modify URLs
const makeAbsolute = (relativeUrl: string, baseUrl: string): string => {
  return new URL(relativeUrl, baseUrl).href;
};

app.get("/verse-of-the-day", (req: Request, res: Response) => {
  const url = `https://saintshub-daily-verse.vercel.app`;

  request(url, (error, response, body) => {
    if (error) {
      res.status(500).send("Error fetching the external website");
      return;
    }

    if (response.statusCode === 200) {
      const $ = cheerio.load(body);

      // Type guard to check if an element is a CheerioElement with tagName
      // const isCheerioElement = (elem: cheerio.Element | cheerio.TextElement): elem is cheerio.Element => {
      //   return elem.type !== 'text';
      // };

      // Rewrite URLs in the <head> section
      // $('head link[href], head script[src], a[href], script[src]').each((_, elem) => {
      //   if (isCheerioElement(elem)) {
      //     const attrib = $(elem).attr('href') ? 'href' : $(elem).attr('src') ? 'src' : '';
      //     if (attrib) {
      //       let relativeUrl = $(elem).attr(attrib)!; // Non-null assertion operator added here
      //       if (attrib === 'src' && relativeUrl.startsWith('/_next/image?url=')) {
      //         // If it's a proxied image URL, extract the original URL from the query parameter
      //         const originalUrl = new URL(relativeUrl, baseUrl).searchParams.get('url');
      //         if (originalUrl) {
      //           relativeUrl = originalUrl;
      //         }
      //       }
      //       // Rewrite the URL
      //       $(elem).attr(attrib, makeAbsolute(relativeUrl, baseUrl));
      //     }
      //   }
      // });

      const section = $("body").html(); // Adjust the selector

      if (section) {
        res.send(`
        <html>
          <head>
            <title>Hello</title>
            <style>
            </style>
          </head>
          <body>
            ${section}
          </body>
      </html>
        `);
      } else {
        res.status(404).send("Section not found");
      }
    } else {
      res
        .status(response.statusCode)
        .send("Failed to fetch the external website");
    }
  });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
