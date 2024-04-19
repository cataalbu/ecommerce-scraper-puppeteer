import { Page } from 'puppeteer';

export async function htmlOnly(page: Page) {
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (!['document', 'xhr', 'fetch'].includes(req.resourceType())) {
      return req.abort();
    }
    req.continue();
  });
}
