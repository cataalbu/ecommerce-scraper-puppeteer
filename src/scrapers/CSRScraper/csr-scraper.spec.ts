import puppeteer, { Browser, Page } from 'puppeteer';
import { CSREcommerceWebsiteScraper } from '.';
import { EcommerceProductRepository } from '../../db/EcommerceProductRepository';
import exp from 'constants';
// import { EcommerceProductRepository } from '../../db/EcommerceProductRepository';

jest.mock('puppeteer');
jest.mock('../../db/EcommerceProductRepository');

describe('CSREcommerceWebsiteScraper', () => {
  let scraper: CSREcommerceWebsiteScraper;
  let mockPage: Page;
  let mockBrowser;

  beforeEach(() => {
    jest.clearAllMocks();
    scraper = new CSREcommerceWebsiteScraper();
    mockPage = {
      goto: jest.fn(),
      waitForSelector: jest.fn().mockImplementation((selector) => {
        return setTimeout(() => {
          return Promise.resolve({} as any);
        }, 100);
      }),
      $$: jest.fn(),
      url: jest.fn(),
    } as unknown as Page;
    mockBrowser = {
      pages: jest.fn().mockResolvedValue([mockPage]),
      close: jest.fn(),
    };
    jest
      .spyOn(puppeteer, 'launch')
      .mockResolvedValue(mockBrowser as unknown as Browser);
  });

  test('formatProduct correctly formats a product', () => {
    const rawProduct = {
      websiteId: '1',
      name: 'Test Product',
      price: '$10.99',
      rating: '5 stars',
      imageURL: 'http://example.com/image.jpg',
    };
    const formattedProduct = scraper.formatProduct(rawProduct);
    expect(formattedProduct.name).toBe('Test Product');
    expect(formattedProduct.price).toBe(10.99);
    expect(formattedProduct.rating).toBe(5);
    expect(formattedProduct.imageURL).toBe('http://example.com/image.jpg');
    expect(formattedProduct.websiteURL).toBeDefined();
    expect(formattedProduct.date).toBeDefined();
    expect(formattedProduct.date).toBeInstanceOf(Date);
  });

  test('extractProduct correctly extracts product data from a handle', async () => {
    const mockProductHandle = {
      evaluate: jest.fn(),
      $eval: jest.fn(),
    };
    mockProductHandle.evaluate.mockImplementation((fn) =>
      fn({ getAttribute: () => '1' })
    );
    mockProductHandle.$eval;
    mockProductHandle.$eval
      .mockImplementationOnce((selector, fn) =>
        fn({ textContent: 'Test Product' })
      )
      .mockImplementationOnce((selector, fn) => fn({ textContent: '$10.99' }))
      .mockImplementationOnce((selector, fn) =>
        fn({ getAttribute: () => '5 stars' })
      )
      .mockImplementationOnce((selector, fn) =>
        fn({ getAttribute: () => 'http://example.com/image.jpg' })
      );
    const product = await scraper.extractProduct(mockProductHandle as any);
    expect(product).toBeDefined();
    expect(product?.name).toBe('Test Product');
    expect(product?.price).toBe(10.99);
    expect(product?.rating).toBe(5);
    expect(product?.imageURL).toBe('http://example.com/image.jpg');
    expect(product?.websiteURL).toBeDefined();
    expect(product?.date).toBeDefined();
  });

  test('scrapePage extracts products from the page', async () => {
    const mockProductHandle = {
      evaluate: jest.fn(),
      $eval: jest.fn(),
    };
    mockProductHandle.evaluate.mockResolvedValue('1');
    mockProductHandle.$eval
      .mockResolvedValueOnce('Test Product')
      .mockResolvedValueOnce('$10.99')
      .mockResolvedValueOnce('5 stars')
      .mockResolvedValueOnce('http://example.com/image.jpg');
    mockPage.$$ = jest.fn().mockResolvedValue([mockProductHandle]);

    const insertCB = jest.fn();
    const products = await scraper.scrapePage(mockPage as any, insertCB);
    expect(products).toHaveLength(1);
    expect(insertCB).toHaveBeenCalledWith(products[0]);
  });

  test('scrapeWebsite navigates pages and extracts products', async () => {
    const mockProductHandle = {
      evaluate: jest.fn(),
      $eval: jest.fn(),
    };
    mockProductHandle.evaluate.mockResolvedValue('1');
    mockProductHandle.$eval
      .mockResolvedValueOnce('Test Product')
      .mockResolvedValueOnce('$10.99')
      .mockResolvedValueOnce('5 stars')
      .mockResolvedValueOnce('http://example.com/image.jpg');
    mockPage.$$ = jest.fn().mockResolvedValue([mockProductHandle]);

    mockPage.$ = jest
      .fn()
      .mockResolvedValueOnce({ click: jest.fn() })
      .mockResolvedValueOnce(null);

    const insertCB = jest.fn();
    const products = await scraper.scrapeWebsite(insertCB);
    expect(products).toHaveLength(2);
    expect(insertCB).toHaveBeenCalledTimes(2);
    expect(mockPage.goto).toHaveBeenCalled();
    expect(mockPage.waitForSelector).toHaveBeenCalledWith(
      'p[class*="_product-item-title"]'
    );
    expect(mockPage.$).toHaveBeenCalledWith(
      '.MuiPaginationItem-previousNext:not(.Mui-disabled)[aria-label="Go to next page"]'
    );
  });

  test('getNextPageButton returns the next page button if it exists', async () => {
    const mockNextButton = {
      click: jest.fn(),
    };
    mockPage.$ = jest.fn().mockResolvedValue(mockNextButton);

    const nextPage = await scraper.getNextPageButton(mockPage as any);
    expect(nextPage).toBe(mockNextButton);
  });

  test('saveProduct inserts a product into the repository', async () => {
    const product = {
      name: 'Test Product',
      price: 10.99,
      rating: 5,
      imageURL: 'http://example.com/image.jpg',
      websiteURL: 'http://example.com/product/1',
      date: new Date(),
    };
    // @ts-expect-error
    await scraper.saveProduct(product);
    expect(
      EcommerceProductRepository.prototype.insertProduct
    ).toHaveBeenCalledWith(product);
  });

  test('start connects to the repository, scrapes products, and disconnects', async () => {
    const connectSpy = jest.spyOn(
      EcommerceProductRepository.prototype as any,
      'connect'
    );
    const disconnectSpy = jest.spyOn(
      EcommerceProductRepository.prototype as any,
      'connect'
    );

    jest.spyOn(scraper, 'scrapeWebsite').mockResolvedValue([]);

    const stats = await scraper.start();
    expect(stats.scrapeCount).toBe(0);
    expect(connectSpy).toHaveBeenCalled();
    expect(disconnectSpy).toHaveBeenCalled();

    expect(scraper.scrapeWebsite).toHaveBeenCalled();
  });
});
