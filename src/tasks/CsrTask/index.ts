import scrapeCSREcommerceWebsite from '../../scrapers/CSRScraper/index.js';
import { updateResults } from '../utils/updateResults.js';

(async () => {
  console.log(process.argv);
  const id = process.argv[2];
  const website = process.argv[3];

  let data = await scrapeCSREcommerceWebsite();

  await updateResults(id, website, data);
})();
