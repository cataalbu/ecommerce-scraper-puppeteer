import { Producer } from 'sqs-producer';

export function scrapingTaskProducerFactory() {
  const producer = Producer.create({
    queueUrl: process.env.NEST_TASKS_QUEUE_URL || '',
  });

  return producer;
}
