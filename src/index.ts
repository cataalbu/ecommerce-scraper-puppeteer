import scrapeSSREcommerceWebsite from './scrapers/SSRScraper/index.js';

(async () => {
  const startTime = Date.now();
  await scrapeSSREcommerceWebsite();
  const endTime = Date.now();

  console.log(new Date(startTime));
  console.log(new Date(endTime));
})();
