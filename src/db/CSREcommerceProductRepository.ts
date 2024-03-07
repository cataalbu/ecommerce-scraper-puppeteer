import { Collection, Db, MongoClient } from 'mongodb';

export class CSREcommerceProductRepository {
  client: MongoClient;
  db: Db | undefined;
  collection: Collection | undefined;

  constructor() {
    this.client = new MongoClient('mongodb://127.0.0.1:27017/');
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db('mock_ecommerce_db');
    this.collection = this.db.collection('puppeteer_csr_scraped_products');
  }

  async insertProduct(product: {
    name: string;
    price: number;
    rating: number;
    imageUrl: string;
    websiteId: string;
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
