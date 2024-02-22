import puppeteer, { ElementHandle, Page, ProductLauncher } from 'puppeteer';
import { CSREcommerceProductRepository } from '../../db/CSREcommerceProductRepository.js';
import { writeFileSync } from 'fs';

function cleanProduct(product: {
  websiteId: string;
  imageUrl: string;
  name: string;
  price: string;
  rating: string;
}) {
  const price = parseFloat(product.price.substring(1));
  const rating = parseInt(product.rating.split(' ')[0]);
  return {
    ...product,
    price,
    rating,
  };
}

async function extractProduct(productHandle: ElementHandle<Element>) {
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

  const imageUrl = await productHandle?.$eval('img', (el) =>
    el.getAttribute('src')
  );

  if (websiteId && name && price && rating && imageUrl) {
    return cleanProduct({
      websiteId,
      name,
      price,
      rating,
      imageUrl,
    });
  }
}

async function scrapePage(page: Page, insertCB: any) {
  console.log('Scraping page ' + page.url());
  const productHandles = await page.$$('[class*="_product-item-container"]');
  const products: any = [];
  for (const productHandle of productHandles) {
    const product = await extractProduct(productHandle);
    insertCB(product);
    products.push(product);
  }
  return products;
}

async function getNextPageButton(page: Page) {
  const nextButton = await page.$(
    '.MuiPaginationItem-previousNext:not(.Mui-disabled)[aria-label="Go to next page"]'
  );
  return nextButton;
}

async function startScraping(insertCB: any) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const [page] = await browser.pages();

  await page.goto('http://localhost:5173');

  await page.waitForSelector('p[class*="_product-item-title"]');

  const products = [];

  while (true) {
    const pageProducts = await scrapePage(page, insertCB);
    products.push(...pageProducts);
    const nextPage = await getNextPageButton(page);

    if (nextPage) {
      await nextPage.click();
      await page.waitForSelector('p[class*="_product-item-title"]');
    } else break;
  }

  await browser.close();
  return products;
}

export default async function scrapeCSREcommerceWebsite() {
  const startTime = Date.now();
  const csrEcommerceProductRepository = new CSREcommerceProductRepository();
  await csrEcommerceProductRepository.connect();

  const products = await startScraping((product: any) => {
    csrEcommerceProductRepository.insertProduct(product!);
  });

  csrEcommerceProductRepository.disconnect();
  const endTime = Date.now();
  return {
    products,
    scrapeCount: products.length,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
  };
}
