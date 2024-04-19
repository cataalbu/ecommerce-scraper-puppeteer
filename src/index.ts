import { Consumer } from 'sqs-consumer';
import 'dotenv/config';
import { SSREcommerceWebsiteScraper } from './scrapers/SSRScraper/index.js';
import { CSREcommerceWebsiteScraper } from './scrapers/CSRScraper/index.js';

const app = Consumer.create({
  queueUrl: process.env.PUPPETEER_TASKS_QUEUE_URL || '',
  handleMessage: async (message) => {
    try {
      if (message.Body) {
        const data = JSON.parse(message.Body);
        let scrapedData;
        switch (data.type) {
          case 'csr':
            const csrScraper = new CSREcommerceWebsiteScraper();
            scrapedData = await csrScraper.start();
          case 'ssr':
            const ssrScraper = new SSREcommerceWebsiteScraper();
            scrapedData = await ssrScraper.start();
        }
        console.log(scrapedData);
      }
    } catch (err) {
      console.log(err);
    }
  },
  pollingWaitTimeMs: 10000,
});

app.on('error', (err) => {
  console.error(err.message);
});

app.on('processing_error', (err) => {
  console.error(err.message);
});

app.start();
