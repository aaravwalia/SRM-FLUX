import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export async function getAcademiaData(netid: string, pass: string) {
  let browser;

  try {
    const isLocal = process.env.NODE_ENV === 'development';

    // 1. Resolve Chrome Path outside of launch to satisfy Turbopack
    let chromePath: string;
    if (isLocal) {
      // Reads from your .env.local
      chromePath = process.env.LOCAL_CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    } else {
      // Cloud-optimized binary for Vercel
      chromePath = await chromium.executablePath(`https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`);
    }

    // 2. Launch Browser - Hardcoded headless values to bypass Type Errors
    browser = await puppeteer.launch({
      args: isLocal ? [] : chromium.args,
      executablePath: chromePath,
      headless: isLocal ? false : true, // Hardcoded: false for your laptop, true for Vercel
    });

    const page = await browser.newPage();
    
    // Set User Agent to mimic a real browser session
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

    // 3. Visit SRM Academia
    await page.goto('https://academia.srmist.edu.in/', { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });

    // --- LOGIN FLOW ---
    
    // Step 1: Email Phase
    await page.waitForSelector('#txtUsername', { visible: true });
    await page.type('#txtUsername', netid);
    await page.click('#btnLogin'); 

    // Step 2: Password Phase
    await page.waitForSelector('#txtPassword', { visible: true, timeout: 15000 });
    await page.type('#txtPassword', pass);
    await page.click('#btnLogin');

    // Step 3: Handle Session Management
    try {
      const terminateBtn = 'input[value*="Terminate"], #btnTerminate'; 
      await page.waitForSelector(terminateBtn, { timeout: 5000 });
      await page.click(terminateBtn);
      console.log("Flux: Sessions terminated.");
    } catch (e) {
      console.log("Flux: No session conflict.");
    }

    // Wait for portal redirection
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // 4. Navigate to Attendance
    await page.goto('https://academia.srmist.edu.in/attendance.jsp', { waitUntil: 'networkidle2' });
    const html = await page.content();
    const $ = cheerio.load(html);

    const subjects: any[] = [];
    
    // Parse the Attendance Table
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
    console.error("SRM Flux Scraper Failure:", error.message);
    throw new Error(`Scraper failed: ${error.message}`);
  }
}