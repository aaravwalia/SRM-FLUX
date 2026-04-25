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
      args: [
        ...chromium.args,
        '--disable-blink-features=AutomationControlled', // Hides the "Navigator.webdriver" flag
        '--disable-infobars',
        '--window-size=1920,1080',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
      executablePath: chromePath,
      headless: isLocal ? false : true,
    });

    const page = await browser.newPage();
    
    // Mimic a very common Windows Chrome user
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

    // Remove the "Headless" fingerprint
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    console.log("Flux: Initiating secure tunnel...");
    
    // Go to the main portal first to get cookies
    await page.goto('https://academia.srmist.edu.in/', { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });

    // Check for #txtUsername with a very long timeout
    await page.waitForSelector('#txtUsername', { visible: true, timeout: 30000 });

    // --- LOGIN ---
    await page.type('#txtUsername', netid, { delay: 100 }); // Slow down typing
    await page.click('#btnLogin'); 

    await page.waitForSelector('#txtPassword', { visible: true, timeout: 20000 });
    await page.type('#txtPassword', pass, { delay: 100 });
    await page.click('#btnLogin');

    // Handle session conflict
    try {
      await page.waitForSelector('input[value*="Terminate"]', { timeout: 5000 });
      await page.click('input[value*="Terminate"]');
    } catch (e) {}

    // Wait for actual table content
    await page.waitForSelector('table', { timeout: 45000 });
    
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
    console.error("Critical Tunnel Failure:", error.message);
    throw new Error("ACADEMIA_TIMEOUT");
  }
}