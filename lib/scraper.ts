import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export async function getAcademiaData(netid: string, pass: string) {
  let browser;

  try {
    const isLocal = process.env.NODE_ENV === 'development';

    let chromePath: string;
    if (isLocal) {
      chromePath = process.env.LOCAL_CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    } else {
      chromePath = await chromium.executablePath(`https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`);
    }

    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--disable-web-security',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-notifications',
        '--disable-extensions'
      ],
      executablePath: chromePath,
      headless: isLocal ? false : true,
    });

    const page = await browser.newPage();

    // --- SPEED OPTIMIZATION: BLOCK HEAVY ASSETS ---
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media', 'other'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');

    // Visit Academia - "domcontentloaded" is much faster than "networkidle2"
    await page.goto('https://academia.srmist.edu.in/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });

    // --- LOGIN FLOW ---
    await page.waitForSelector('#txtUsername', { visible: true, timeout: 10000 });
    await page.type('#txtUsername', netid);
    await page.click('#btnLogin'); 

    await page.waitForSelector('#txtPassword', { visible: true, timeout: 10000 });
    await page.type('#txtPassword', pass);
    await page.click('#btnLogin');

    // Handle Session Termination
    try {
      const terminateBtn = 'input[value*="Terminate"], #btnTerminate'; 
      await page.waitForSelector(terminateBtn, { timeout: 3000 });
      await page.click(terminateBtn);
    } catch (e) {
      // No active session found, skip
    }

    // Wait for the redirect to complete
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 });

    // Scrape Attendance
    await page.goto('https://academia.srmist.edu.in/attendance.jsp', { waitUntil: 'domcontentloaded' });
    const html = await page.content();
    const $ = cheerio.load(html);

    const subjects: any[] = [];
    $('table tr').each((i, el) => {
       if (i === 0) return;
       const td = $(el).find('td');
       if (td.length >= 4) {
         const name = $(td[1]).text().trim();
         const present = parseInt($(td[2]).text().trim()) || 0;
         const absent = parseInt($(td[3]).text().trim()) || 0;
         if (name && name !== "Subject Name" && !isNaN(present)) {
            subjects.push({ name, present, absent });
         }
       }
    });

    await browser.close();
    return subjects;

  } catch (error: any) {
    if (browser) await browser.close();
    console.error("SRM Flux Error:", error.message);
    throw new Error(`Login failed: ${error.message}`);
  }
}