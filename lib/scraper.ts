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
      args: [...chromium.args, '--disable-web-security', '--disable-features=IsolateOrigins', '--site-per-process'],
      executablePath: chromePath,
      headless: isLocal ? false : true,
    });

    const page = await browser.newPage();
    
    // Use a very specific User Agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // 1. Visit with a longer timeout and "commit" wait
    await page.goto('https://academia.srmist.edu.in/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });

    // 2. Extra "Breath" - wait 2 seconds for JS to kick in
    await new Promise(r => setTimeout(r, 2000));

    // 3. Robust Selector Check
    try {
      await page.waitForSelector('#txtUsername', { visible: true, timeout: 15000 });
    } catch (e) {
      // DEBUG: If it fails, let's see what the page actually looks like
      const content = await page.content();
      console.log("Page HTML Snippet:", content.substring(0, 500));
      throw new Error("Academia login fields did not load. The site might be blocking the cloud connection.");
    }

    // --- LOGIN FLOW ---
    await page.type('#txtUsername', netid, { delay: 50 }); // Type like a human
    await page.click('#btnLogin'); 

    await page.waitForSelector('#txtPassword', { visible: true, timeout: 15000 });
    await page.type('#txtPassword', pass, { delay: 50 });
    await page.click('#btnLogin');

    // Handle session conflicts
    try {
      const terminateBtn = 'input[value*="Terminate"], #btnTerminate'; 
      await page.waitForSelector(terminateBtn, { timeout: 5000 });
      await page.click(terminateBtn);
    } catch (e) {
      // Normal flow if no popup
    }

    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Scrape Attendance
    await page.goto('https://academia.srmist.edu.in/attendance.jsp', { waitUntil: 'networkidle2' });
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
    throw error;
  }
}