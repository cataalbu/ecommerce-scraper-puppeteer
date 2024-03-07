import scrapeSSREcommerceWebsite from '../../scrapers/SSRScraper/index.js';
import { updateResults } from '../utils/updateResults.js';

(async () => {
  const id = process.argv[2];
  const website = process.argv[3];

  const data = await scrapeSSREcommerceWebsite();

  console.log(data);

  await updateResults(id, website, data);
})();
