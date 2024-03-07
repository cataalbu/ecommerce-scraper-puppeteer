export async function updateResults(id: string, website: string, data: any) {
  const scrapedProducts = data.scrapedProducts.map((product: any) => ({
    ...product,
    price: {
      price: product.price,
      date: data.startTime,
    },
    website,
  }));

  console.log('Sending data...');

  try {
    const res = await fetch(
      `${process.env.SCRAPE_SENSE_API_URL}/scrape-tasks/results`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.SCRAPE_SENSE_API_KEY || '',
        },
        body: JSON.stringify({ ...data, id, scrapedProducts }),
      }
    );
    const message = await res.json();
    console.log(message);
  } catch (err) {
    console.log(err);
  }
}
