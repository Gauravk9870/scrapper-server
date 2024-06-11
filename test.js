import puppeteer from 'puppeteer';

async function scrapeTitle(url) {
    // Launch a new browser instance
    const browser = await puppeteer.launch();

    // Open a new page
    const page = await browser.newPage();

    // Navigate to the URL
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Scrape the title
    const title = await page.title();

    console.log('Page Title:', title);

    // Close the browser
    await browser.close();
}

// URL of the page to scrape
const url = 'https://www.microsoft.com/en-in'; // Replace with the URL you want to scrape

scrapeTitle(url).catch(console.error);
