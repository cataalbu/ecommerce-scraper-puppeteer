import puppeteer from 'puppeteer';
import { EcommerceProductRepository } from '../../db/EcommerceProductRepository.js';
import { htmlOnly } from '../utils/index.js';
import {
  Product,
  ScrapedProduct,
  Scraper,
  ScrapingStats,
} from '../Scraper/index.js';

export class SSREcommerceWebsiteScraper implements Scraper {
  private productRepository: EcommerceProductRepository;
  private baseURL = 'https://csr-scraping-website.whitecatdev.com';

  constructor() {
    this.productRepository = new EcommerceProductRepository();
  }

  formatProduct(product: ScrapedProduct): Product {
    const price = parseFloat(product.price.substring(1));
    const rating = parseInt(product.rating.split(' ')[0]);
    return {
      ...product,
      price,
      rating,
    };
  }

  async extractProduct(
    productHandle: puppeteer.ElementHandle<Element>
  ): Promise<Product | undefined> {
    const websiteId = await productHandle?.evaluate((el) =>
      el.getAttribute('data-id')
    );

    const name = await productHandle?.$eval(
      '[class*="ProductItem_product-item-title"]',
      (el) => el.textContent
    );

    const price = await productHandle?.$eval(
      '[class*="ProductItem_product-item-price"]',
      (el) => el.textContent
    );

    const rating = await productHandle?.$eval('.MuiRating-root', (el) =>
      el.getAttribute('aria-label')
    );

    const imageUrl = await productHandle?.$eval('img', (el) =>
      el.getAttribute('src')
    );
    if (websiteId && name && price && rating && imageUrl) {
      return this.formatProduct({
        websiteId,
        name,
        price,
        rating,
        imageUrl,
      });
    }
  }

  async scrapePage(page: puppeteer.Page, insertCB: any): Promise<Product[]> {
    console.log('Scraping page ' + page.url());
    const productHandles = await page.$$(
      '[class*="ProductItem_product-item-container"]'
    );
    const products: any = [];
    for (const productHandle of productHandles) {
      const product = await this.extractProduct(productHandle);
      insertCB(product);
      products.push(product);
    }
    return products;
  }

  async getNextPage(page: puppeteer.Page): Promise<string | null> {
    const nextButton = await page.$(
      '.MuiPaginationItem-previousNext:not(.Mui-disabled)[aria-label="Go to next page"]'
    );
    if (nextButton) {
      const nextPage = await nextButton.evaluate((el) =>
        el.getAttribute('href')
      );
      return this.baseURL + nextPage;
    }
    return null;
  }

  async scrapeWebsite(insertCB: any): Promise<Product[]> {
    const browser = await puppeteer.launch({ headless: true });
    const [page] = await browser.pages();

    await htmlOnly(page);

    await page.goto(`${this.baseURL}/products`);

    const products = [];

    while (true) {
      const pageProducts = await this.scrapePage(page, insertCB);
      products.push(...pageProducts);
      const nextPage = await this.getNextPage(page);
      if (nextPage) {
        await page.goto(nextPage);
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

    const scrapedProducts = await this.scrapeWebsite(this.saveProduct);
    const endTime = Date.now();
    this.productRepository.disconnect();

    return {
      scrapeCount: scrapedProducts.length,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    };
  }
}
