import scrapeSSREcommerceWebsite from '../../scrapers/SSRScraper/index.js';

(async () => {
  const data = await scrapeSSREcommerceWebsite();

  console.log(data);
})();
