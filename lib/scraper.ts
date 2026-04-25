import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export async function getAcademiaData(netid: string, pass: string) {
  let browser;

  try {
    const isLocal = process.env.NODE_ENV === 'development';

    // 1. Path Resolution
    let chromePath: string;
    if (isLocal) {
      chromePath = process.env.LOCAL_CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    } else {
      chromePath = await chromium.executablePath(`https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`);
    }

    // 2. Launch with Stealth Arguments
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--disable-web-security',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
      executablePath: chromePath,
      headless: isLocal ? false : true,
    });

    const page = await browser.newPage();

    // 3. MOBILE STEALTH: Mimic an iPhone to bypass "Data Center" blocks
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    // 4. RESOURCE BLOCKING: Speed up load by 300%
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'font', 'media'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // 5. NAVIGATION: Go straight to the internal attendance view
    // This URL forces Academia to skip unnecessary home page redirects
    await page.goto('https://academia.srmist.edu.in/#View:My_Attendance', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });

    // Wait for the portal to "settle" (Crucial for Vercel)
    await new Promise(r => setTimeout(r, 4000));

    // 6. LOGIN FLOW
    const userField = '#txtUsername';
    await page.waitForSelector(userField, { visible: true, timeout: 25000 });
    
    await page.type(userField, netid, { delay: 40 });
    await page.click('#btnLogin'); 

    await page.waitForSelector('#txtPassword', { visible: true, timeout: 15000 });
    await page.type('#txtPassword', pass, { delay: 40 });
    await page.click('#btnLogin');

    // Handle "Terminate Other Sessions" popup
    try {
      const terminateBtn = 'input[value*="Terminate"]';
      await page.waitForSelector(terminateBtn, { timeout: 5000 });
      await page.click(terminateBtn);
      console.log("Flux: Sessions terminated.");
    } catch (e) {
      // No active session found
    }

    // 7. EXTRACTION: Wait for the data table
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
    console.error("SRM Flux Error:", error.message);
    throw new Error(error.message);
  }
}