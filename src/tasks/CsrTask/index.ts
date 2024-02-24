import scrapeCSREcommerceWebsite from '../../scrapers/CSRScraper/index.js';

(async () => {
  const data = await scrapeCSREcommerceWebsite();

  console.log(data);
})();
