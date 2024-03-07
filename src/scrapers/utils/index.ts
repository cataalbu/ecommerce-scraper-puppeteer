import { Page, PageEmittedEvents } from 'puppeteer';

export async function htmlOnly(page: Page) {
  await page.setRequestInterception(true);
  page.on(PageEmittedEvents.Request, (req) => {
    if (!['document', 'xhr', 'fetch'].includes(req.resourceType())) {
      return req.abort();
    }
    req.continue();
  });
}
