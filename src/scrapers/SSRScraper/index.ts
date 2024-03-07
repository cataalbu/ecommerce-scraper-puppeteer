import puppeteer, { ElementHandle, Page } from 'puppeteer';
import { SSREcommerceProductRepository } from '../../db/SSREcommerceProductRepository.js';
import { htmlOnly } from '../utils/index.js';

const baseUrl = 'http://localhost:3001';

async function cleanCollection(
  ssrEcommerceProductRepository: SSREcommerceProductRepository
) {
  try {
    await ssrEcommerceProductRepository.deleteAllProducts();
  } catch (err) {
    console.log(err);
    throw new Error('Error while cleaning collection');
  }
}

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
  const productHandles = await page.$$(
    '[class*="ProductItem_product-item-container"]'
  );
  const products = [];
  for (const productHandle of productHandles) {
    const product = await extractProduct(productHandle);
    insertCB(product);
    products.push(product);
  }
  return products;
}

async function getNextPage(page: Page) {
  const nextButton = await page.$(
    '.MuiPaginationItem-previousNext:not(.Mui-disabled)[aria-label="Go to next page"]'
  );
  if (nextButton) {
    const nextPage = await nextButton.evaluate((el) => el.getAttribute('href'));
    return baseUrl + nextPage;
  }
  return null;
}

async function startScraping(insertCB: any) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const [page] = await browser.pages();

  await htmlOnly(page);

  await page.goto(`${baseUrl}/products`);

  const products = [];

  while (true) {
    const pageProducts = await scrapePage(page, insertCB);
    products.push(...pageProducts);
    const nextPage = await getNextPage(page);
    if (nextPage) {
      await page.goto(nextPage);
    } else break;
  }

  await browser.close();
  return products;
}

export default async function scrapeSSREcommerceWebsite() {
  const startTime = Date.now();
  const ssrEcommerceProductRepository = new SSREcommerceProductRepository();
  await ssrEcommerceProductRepository.connect();

  await cleanCollection(ssrEcommerceProductRepository);

  const scrapedProducts = await startScraping((product: any) => {
    ssrEcommerceProductRepository.insertProduct(product!);
  });
  ssrEcommerceProductRepository.disconnect();
  const endTime = Date.now();

  return {
    scrapedProducts,
    scrapeCount: scrapedProducts.length,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
  };
}
