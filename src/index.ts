import { Consumer } from 'sqs-consumer';
import 'dotenv/config';

const app = Consumer.create({
  queueUrl: process.env.PUPPETEER_TASKS_QUEUE_URL || '',
  handleMessage: async (message) => {
    console.log(message);
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
