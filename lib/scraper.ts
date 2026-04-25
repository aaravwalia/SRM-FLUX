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
      args: [...chromium.args, '--disable-web-security', '--no-sandbox'],
      executablePath: chromePath,
      headless: isLocal ? false : true,
    });

    const page = await browser.newPage();
    
    // Stealth & Resource Control
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'font'].includes(req.resourceType())) req.abort();
      else req.continue();
    });

    // 1. Direct hit to the Attendance App
    console.log("Flux: Targeting Attendance Module...");
    await page.goto('https://academia.srmist.edu.in/#View:My_Attendance', { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });

    // 2. The "Smart Wait" - Academia's login box often lives inside an iframe
    // This helper function looks for the selector in the main page AND all frames
    const findSelector = async (selector: string) => {
      const start = Date.now();
      while (Date.now() - start < 30000) { // 30 second retry loop
        const mainEl = await page.$(selector);
        if (mainEl) return page;

        for (const frame of page.frames()) {
          const frameEl = await frame.$(selector);
          if (frameEl) return frame;
        }
        await new Promise(r => setTimeout(r, 1000));
      }
      throw new Error(`Selector ${selector} not found in any frame.`);
    };

    // 3. LOGIN PHASE
    console.log("Flux: Searching for Login Portal...");
    const targetFrame = await findSelector('#txtUsername');

    await targetFrame.type('#txtUsername', netid, { delay: 30 });
    await targetFrame.click('#btnLogin'); 

    await targetFrame.waitForSelector('#txtPassword', { visible: true, timeout: 15000 });
    await targetFrame.type('#txtPassword', pass, { delay: 30 });
    await targetFrame.click('#btnLogin');

    // 4. Handle "Terminate Session"
    try {
      await targetFrame.waitForSelector('input[value*="Terminate"]', { timeout: 5000 });
      await targetFrame.click('input[value*="Terminate"]');
      console.log("Flux: Session conflict cleared.");
    } catch (e) {}

    // 5. WAIT FOR REDIRECT & EXTRACT
    // We wait specifically for the Attendance table to render
    await page.waitForSelector('table', { timeout: 40000 });
    
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
    console.error("Critical Failure:", error.message);
    throw error;
  }
}