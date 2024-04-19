import 'dotenv/config';

import { scrapingTaskConsumerFactory } from './tasks/TaskConsumer.js';

const app = scrapingTaskConsumerFactory();

app.start();
