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
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      executablePath: chromePath,
      headless: isLocal ? false : true,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');

    // 1. Block heavy assets to save time
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'font', 'stylesheet'].includes(req.resourceType())) req.abort();
      else req.continue();
    });

    // 2. Go straight to the Attendance portal link
    console.log("Flux: Navigating to Academia...");
    await page.goto('https://academia.srmist.edu.in/#View:My_Attendance', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });

    // 3. The "Frame" Wait: Academia often hides the login behind a Zoho load screen
    await new Promise(r => setTimeout(r, 5000)); 

    // 4. Try to find the username field in any frame
    const usernameSelector = '#txtUsername';
    await page.waitForSelector(usernameSelector, { visible: true, timeout: 30000 });

    // --- Execute Login ---
    await page.type(usernameSelector, netid, { delay: 50 });
    await page.click('#btnLogin'); 

    await page.waitForSelector('#txtPassword', { visible: true, timeout: 20000 });
    await page.type('#txtPassword', pass, { delay: 50 });
    await page.click('#btnLogin');

    // 5. Handle the Terminate Session popup
    try {
      await page.waitForSelector('input[value*="Terminate"]', { timeout: 5000 });
      await page.click('input[value*="Terminate"]');
      console.log("Flux: Session conflict resolved.");
    } catch (e) {}

    // 6. Final Data Extraction
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
    console.error("Critical Flux Error:", error.message);
    throw new Error("ACADEMIA_REJECTED_CONNECTION"); // Friendly error for frontend
  }
}