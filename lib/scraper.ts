import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export async function getAcademiaData(netid: string, pass: string) {
  let browser;

  try {
    const isLocal = process.env.NODE_ENV === 'development';

    // 1. Resolve Chrome Path
    let chromePath: string;
    if (isLocal) {
      chromePath = process.env.LOCAL_CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    } else {
      // Using the latest stable pack link
      chromePath = await chromium.executablePath(`https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`);
    }

    // 2. Optimized Browser Launch
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--disable-web-security',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled', // Hides bot status
        '--disable-features=IsolateOrigins',
        '--site-per-process'
      ],
      executablePath: chromePath,
      headless: isLocal ? false : true,
    });

    const page = await browser.newPage();

    // 3. RESOURCE BLOCKING (Makes it 3x faster)
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');

    // 4. SMART NAVIGATION: Try hitting the site
    // "domcontentloaded" is much faster than waiting for everything
    await page.goto('https://academia.srmist.edu.in/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });

    // 5. RELIABILITY CHECK: If page didn't load, try one hard refresh
    try {
      await page.waitForSelector('#txtUsername', { visible: true, timeout: 8000 });
    } catch (e) {
      console.log("Flux: Initial load failed, retrying with networkidle2...");
      await page.goto('https://academia.srmist.edu.in/', { waitUntil: 'networkidle2', timeout: 20000 });
      await page.waitForSelector('#txtUsername', { visible: true, timeout: 10000 });
    }

    // --- LOGIN FLOW ---
    await page.type('#txtUsername', netid, { delay: 20 });
    await page.click('#btnLogin'); 

    await page.waitForSelector('#txtPassword', { visible: true, timeout: 10000 });
    await page.type('#txtPassword', pass, { delay: 20 });
    await page.click('#btnLogin');

    // Handle "Terminate Session" Popup
    try {
      const terminateBtn = 'input[value*="Terminate"], #btnTerminate'; 
      await page.waitForSelector(terminateBtn, { timeout: 4000 });
      await page.click(terminateBtn);
    } catch (e) {
      // Normal login, no popup
    }

    // Wait for the Dashboard/Home to load after login
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 });

    // 6. SCRAPE ATTENDANCE
    await page.goto('https://academia.srmist.edu.in/attendance.jsp', { waitUntil: 'domcontentloaded' });
    const html = await page.content();
    const $ = cheerio.load(html);

    const subjects: any[] = [];
    $('table tr').each((i, el) => {
       if (i === 0) return; // Skip Header
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
    console.error("SRM Flux Critical Error:", error.message);
    throw new Error(`Connection to Academia lost: ${error.message}`);
  }
}