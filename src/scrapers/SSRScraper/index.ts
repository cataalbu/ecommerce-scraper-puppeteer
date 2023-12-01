import puppeteer, { ElementHandle } from 'puppeteer';

async function extractProduct(productHandle: ElementHandle<Element>) {
  const websiteId = await productHandle?.evaluate((el) =>
    el.getAttribute('data-id')
  );

  const title = await productHandle?.$eval(
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
  return {
    websiteId,
    title,
    price,
    rating,
    imageUrl,
  };
}

async function startScraping() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const [page] = await browser.pages();

  await page.goto('http://localhost:3000/products');

  const productHandles = await page.$$(
    '[class*="ProductItem_product-item-container"]'
  );

  for (const productHandle of productHandles) {
    const product = await extractProduct(productHandle);
    console.log(product);
  }
  await browser.close();
}

export default async function scrapeSSREcommerceWebsite() {
  await startScraping();
}
