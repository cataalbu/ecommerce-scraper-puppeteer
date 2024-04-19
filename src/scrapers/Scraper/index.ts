import { ElementHandle, Page } from 'puppeteer';

export interface Product {
  websiteId: string;
  imageUrl: string;
  name: string;
  price: number;
  rating: number;
}

export interface ScrapedProduct {
  websiteId: string;
  imageUrl: string;
  name: string;
  price: string;
  rating: string;
}

export interface ScrapingStats {
  scrapeCount: number;
  startTime: Date;
  endTime: Date;
}

export interface Scraper {
  formatProduct(product: ScrapedProduct): Product;
  extractProduct(
    productHandle: ElementHandle<Element>
  ): Promise<Product | undefined>;

  scrapePage(page: Page, insertCB: any): Promise<Product[]>;
  scrapeWebsite(insertCB: any): Promise<Product[]>;
  start(): Promise<ScrapingStats>;
}
