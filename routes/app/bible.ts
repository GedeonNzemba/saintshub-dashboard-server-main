// src/routes/authRoutes.ts
import express, { Request, Response } from "express";
import request from "request";
import cheerio from 'cheerio';


interface MulterRequest extends Request {
  file: any;
}

const router = express.Router();

router.get('/proxy/test', (req: Request, res: Response) => {
  const url = 'https://www.bible.com/verse-of-the-day';

  request(url, (error, response, body) => {
    if (error) {
      res.status(500).send('Error fetching the external website');
      return;
    }

    if (response.statusCode === 200) {
      const $ = cheerio.load(body);
      const section = $('#__next').html(); // Adjust the selector

      if (section) {
        res.send(`
          <html>
            <head>
              <title>Proxy Section</title>
            </head>
            <body>
              ${section}
            </body>
          </html>
        `);
      } else {
        res.status(404).send('Section not found');
      }
    } else {
      res.status(response.statusCode).send('Failed to fetch the external website');
    }
  });
});

export default router;