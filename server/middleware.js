import { MongoClient } from 'mongodb';
import 'dotenv/config';

const client = new MongoClient(process.env.MONGODB_URL);

export const validateApiKeyMiddleware = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).send('API key is required');
  }

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection('apikeys');
    const apiKeyExists = await collection.findOne({ key: apiKey });

    if (!apiKeyExists) {
      return res.status(401).send('Unauthorized: API key is invalid');
    }

    next();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).send('Internal Server Error');
  } finally {
    await client.close();
  }
};
