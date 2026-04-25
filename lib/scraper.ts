import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export async function getAcademiaData(netid: string, pass: string) {
  let browser;

  try {
    const isLocal = process.env.NODE_ENV === 'development';

    // 1. Browser Configuration
    browser = await puppeteer.launch({
      args: isLocal ? [] : chromium.args,
      defaultViewport: isLocal ? null : chromium.defaultViewport,
      // On Local: Uses path from .env.local
      // On Vercel: Uses the downloaded Chromium binary
      executablePath: isLocal 
        ? process.env.LOCAL_CHROME_PATH 
        : await chromium.executablePath(`https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`),
      headless: isLocal ? false : chromium.headless,
    });

    const page = await browser.newPage();
    
    // Set User Agent to mimic a real browser session
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

    // 2. Visit Academia
    await page.goto('https://academia.srmist.edu.in/', { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });

    // --- STEP 1: Email Phase ---
    await page.waitForSelector('#txtUsername', { visible: true });
    await page.type('#txtUsername', netid);
    await page.click('#btnLogin'); 

    // --- STEP 2: Password Phase ---
    // Waiting for the password field to appear after the email submission
    await page.waitForSelector('#txtPassword', { visible: true, timeout: 15000 });
    await page.type('#txtPassword', pass);
    await page.click('#btnLogin');

    // --- STEP 3: Handle Session Management ---
    // Cybersecurity Tip: SRM often forces you to terminate other active sessions.
    try {
      const terminateBtn = 'input[value*="Terminate"], #btnTerminate'; 
      await page.waitForSelector(terminateBtn, { timeout: 5000 });
      await page.click(terminateBtn);
      console.log("Flux: Active sessions terminated.");
    } catch (e) {
      console.log("Flux: No session conflict found.");
    }

    // 3. Wait for full navigation to the student dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // 4. Scrape Attendance Data
    await page.goto('https://academia.srmist.edu.in/attendance.jsp', { waitUntil: 'networkidle2' });
    const html = await page.content();
    const $ = cheerio.load(html);

    const subjects: any[] = [];
    
    // Parsing the SRM Attendance Table
    $('table tr').each((i, el) => {
       if (i === 0) return; // Skip Header row
       const td = $(el).find('td');
       
       if (td.length >= 4) {
         const name = $(td[1]).text().trim();
         const present = parseInt($(td[2]).text().trim()) || 0;
         const absent = parseInt($(td[3]).text().trim()) || 0;
         
         // Validation: Ignore placeholder or empty rows
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
    throw new Error(`Connection to Academia failed: ${error.message}`);
  }
}