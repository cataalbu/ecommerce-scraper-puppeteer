import { Consumer } from 'sqs-consumer';
import { v4 } from 'uuid';

import { CSREcommerceWebsiteScraper } from '../scrapers/CSRScraper/index.js';
import { SSREcommerceWebsiteScraper } from '../scrapers/SSRScraper/index.js';
import { Scraper } from '../scrapers/Scraper/index.js';
import { scrapingTaskProducerFactory } from './TaskProducer.js';

async function startScrapeTask(
  scraper: Scraper,
  taskData: { id: string; website: string }
) {
  const producer = scrapingTaskProducerFactory();
  try {
    const scrapedData = await scraper.start();
    console.log(scrapedData);
    await producer.send([
      {
        id: v4(),
        body: JSON.stringify({
          ...scrapedData,
          id: taskData.id,
          website: taskData.website,
          status: 'finished',
        }),
      },
    ]);
  } catch (err) {
    console.error(err);
    await producer.send([
      { id: v4(), body: JSON.stringify({ ...taskData, status: 'crashed' }) },
    ]);
  }
}

export function scrapingTaskConsumerFactory() {
  const consumer = Consumer.create({
    queueUrl: process.env.PUPPETEER_TASKS_QUEUE_URL || '',
    handleMessage: async (message) => {
      try {
        if (message.Body) {
          const data = JSON.parse(message.Body);
          console.log(data);
          switch (data.type) {
            case 'csr':
              const csrScraper = new CSREcommerceWebsiteScraper();
              startScrapeTask(csrScraper, data);
            case 'ssr':
              const ssrScraper = new SSREcommerceWebsiteScraper();
              startScrapeTask(ssrScraper, data);
          }
        }
      } catch (err) {
        console.log(err);
      }
    },
    pollingWaitTimeMs: 10000,
  });

  consumer.on('error', (err) => {
    console.error(err.message);
  });

  consumer.on('processing_error', (err) => {
    console.error(err.message);
  });

  return consumer;
}
