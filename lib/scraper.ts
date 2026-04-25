import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export async function getAcademiaData(netid: string, pass: string) {
  let browser;

  try {
    const isLocal = process.env.NODE_ENV === 'development';
    let chromePath = isLocal 
      ? (process.env.LOCAL_CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
      : await chromium.executablePath(`https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`);

    browser = await puppeteer.launch({
      args: [...chromium.args, '--disable-web-security', '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: chromePath,
      headless: isLocal ? false : true,
    });

    const page = await browser.newPage();
    
    // 1. STEALTH HEADERS: This is the secret sauce
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    // 2. RESOURCE BLOCKING: Skip everything but the logic
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'font', 'stylesheet'].includes(req.resourceType())) req.abort();
      else req.continue();
    });

    // 3. THE "DIRECT" NAVIGATION: Skip the home page and go straight to the login frame
    // Academia is wrapped in Zoho; this URL bypasses some of the redirects
    await page.goto('https://academia.srmist.edu.in/#View:My_Attendance', { 
      waitUntil: 'domcontentloaded', 
      timeout: 45000 
    });

    // 4. WAIT FOR REDIRECT: If we are at the login page, the selector will change
    // We wait for the NetID box or the main portal container
    await page.waitForSelector('#txtUsername, input[type="text"]', { visible: true, timeout: 20000 });

    // --- LOGIN ---
    await page.type('#txtUsername', netid, { delay: 30 });
    await page.click('#btnLogin'); 

    await page.waitForSelector('#txtPassword', { visible: true, timeout: 15000 });
    await page.type('#txtPassword', pass, { delay: 30 });
    await page.click('#btnLogin');

    // 5. SESSION TERMINATION
    try {
      await page.waitForSelector('input[value*="Terminate"]', { timeout: 5000 });
      await page.click('input[value*="Terminate"]');
    } catch (e) {}

    // 6. SCRAPE
    // Instead of navigating again, we wait for the attendance table to appear in the current frame
    await page.waitForSelector('table', { timeout: 30000 });
    const html = await page.content();
    const $ = cheerio.load(html);

    const subjects: any[] = [];
    $('table tr').each((i, el) => {
      const td = $(el).find('td');
      if (td.length >= 4) {
        const name = $(td[1]).text().trim();
        const present = parseInt($(td[2]).text().trim()) || 0;
        const absent = parseInt($(td[3]).text().trim()) || 0;
        if (name && !isNaN(present) && name !== "Subject Name") {
          subjects.push({ name, present, absent });
        }
      }
    });

    await browser.close();
    return subjects;

  } catch (error: any) {
    if (browser) await browser.close();
    console.error("Scraper Error:", error.message);
    throw error;
  }
}