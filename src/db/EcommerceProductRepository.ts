import { Collection, Db, MongoClient } from 'mongodb';
import 'dotenv/config';

export class EcommerceProductRepository {
  client: MongoClient;
  db: Db | undefined;
  collection: Collection | undefined;

  constructor() {
    this.client = new MongoClient(process.env.MONGODB_URL || '');
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db(process.env.MONGODB_DB_NAME);
    this.collection = this.db.collection('scrapedproducts');
  }

  async insertProduct(product: {
    name: string;
    price: number;
    rating: number;
    imageURL: string;
    websiteId: string;
    websiteURL: string;
    date: Date;
  }) {
    if (this.collection) {
      await this.collection.insertOne({
        ...product,
      });
    }
  }

  async deleteAllProducts() {
    if (this.collection) {
      await this.collection.deleteMany();
    }
  }

  async disconnect() {
    await this.client.close();
  }
}
