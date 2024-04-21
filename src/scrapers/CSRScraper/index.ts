import puppeteer from 'puppeteer';

import { EcommerceProductRepository } from '../../db/EcommerceProductRepository.js';
import {
  Product,
  ScrapedProduct,
  Scraper,
  ScrapingStats,
} from '../Scraper/index.js';

export class CSREcommerceWebsiteScraper implements Scraper {
  private productRepository: EcommerceProductRepository;
  private startTime: Date;
  private baseURL = 'https://csr-scraping-website.whitecatdev.com';

  constructor() {
    this.productRepository = new EcommerceProductRepository();
    this.startTime = new Date();
    this.saveProduct = this.saveProduct.bind(this);
  }

  formatProduct(product: ScrapedProduct): Product {
    const price = parseFloat(product.price.substring(1));
    const rating = parseInt(product.rating.split(' ')[0]);
    return {
      ...product,
      price,
      rating,
      websiteURL: this.baseURL,
      date: this.startTime,
    };
  }
  async extractProduct(
    productHandle: puppeteer.ElementHandle<Element>
  ): Promise<Product | undefined> {
    const websiteId = await productHandle?.evaluate((el) =>
      el.getAttribute('data-id')
    );

    const name = await productHandle?.$eval(
      '[class*="_product-item-title"]',
      (el) => el.textContent
    );

    const price = await productHandle?.$eval(
      '[class*="_product-item-price"]',
      (el) => el.textContent
    );

    const rating = await productHandle?.$eval('.MuiRating-root', (el) =>
      el.getAttribute('aria-label')
    );

    const imageURL = await productHandle?.$eval('img', (el) =>
      el.getAttribute('src')
    );

    if (websiteId && name && price && rating && imageURL) {
      return this.formatProduct({
        websiteId,
        name,
        price,
        rating,
        imageURL,
      });
    }
  }

  async scrapePage(page: puppeteer.Page, insertCB: any): Promise<Product[]> {
    console.log('Scraping page ' + page.url());
    const productHandles = await page.$$('[class*="_product-item-container"]');
    const products: any = [];
    for (const productHandle of productHandles) {
      const product = await this.extractProduct(productHandle);
      insertCB(product);
      products.push(product);
    }
    return products;
  }

  async getNextPageButton(
    page: puppeteer.Page
  ): Promise<puppeteer.ElementHandle<Element> | null> {
    const nextButton = await page.$(
      '.MuiPaginationItem-previousNext:not(.Mui-disabled)[aria-label="Go to next page"]'
    );
    return nextButton;
  }

  async scrapeWebsite(insertCB: any): Promise<Product[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
      executablePath: process.env.CHROME_BIN_PATH || undefined,
    });
    const [page] = await browser.pages();

    await page.goto(this.baseURL);

    await page.waitForSelector('p[class*="_product-item-title"]');

    const products = [];

    while (true) {
      const pageProducts = await this.scrapePage(page, insertCB);
      products.push(...pageProducts);
      const nextPage = await this.getNextPageButton(page);

      if (nextPage) {
        await nextPage.click();
        await page.waitForSelector('p[class*="_product-item-title"]');
      } else break;
    }

    await browser.close();
    return products;
  }

  private saveProduct(product: Product) {
    this.productRepository.insertProduct(product!);
  }

  async start(): Promise<ScrapingStats> {
    await this.productRepository.connect();
    const startTime = Date.now();
    this.startTime = new Date(startTime);

    const scrapedProducts = await this.scrapeWebsite(this.saveProduct);

    const endTime = Date.now();
    await this.productRepository.disconnect();

    return {
      scrapeCount: scrapedProducts.length,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    };
  }
}
