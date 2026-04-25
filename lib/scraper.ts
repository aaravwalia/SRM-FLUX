import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import chromium from '@sparticuz/chromium-min';

// Essential for bypassing Zoho's "Bot Detection"
if (puppeteer.findPlugin(StealthPlugin.name) === undefined) {
  puppeteer.use(StealthPlugin());
}

export async function getAcademiaData(netid: string, pass: string) {
  let browser;
  try {
    const isLocal = process.env.NODE_ENV === 'development';
    
    // Resolve the executable path
    const executablePath = isLocal 
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : await chromium.executablePath(`https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`);

    browser = await puppeteer.launch({
      args: [...chromium.args, '--disable-web-security', '--no-sandbox'],
      executablePath: executablePath,
      // FIX: Use 'true' for local and chromium.headless for production
      headless: isLocal ? false : true, 
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();

    // 1. Cyber-Command Stealth: Overriding the webdriver property
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // 2. Direct Navigation
    console.log("[FLUX] Authenticating through secure tunnel...");
    await page.goto('https://academia.srmist.edu.in/#View:My_Attendance', { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });

    // 3. Login Flow
    const userSelector = '#txtUsername';
    await page.waitForSelector(userSelector, { visible: true, timeout: 30000 });
    await page.type(userSelector, netid, { delay: 60 });
    await page.click('#btnLogin');

    await page.waitForSelector('#txtPassword', { visible: true, timeout: 15000 });
    await page.type('#txtPassword', pass, { delay: 60 });
    await page.click('#btnLogin');

    // 4. Handle SRM Session Conflicts
    try {
      await page.waitForSelector('input[value*="Terminate"]', { timeout: 5000 });
      await page.click('input[value*="Terminate"]');
    } catch (e) {
      // No active session found
    }

    // 5. Scrape Attendance Table
    await page.waitForSelector('table', { timeout: 30000 });
    const subjects = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr'));
      return rows.map(row => {
        const td = row.querySelectorAll('td');
        if (td.length >= 4) {
          return {
            name: td[1].innerText.trim(),
            present: td[2].innerText.trim(),
            absent: td[3].innerText.trim()
          };
        }
        return null;
      }).filter(x => x && x.name !== "Subject Name" && x.name !== "Course Name");
    });

    await browser.close();
    return subjects;

  } catch (error: any) {
    if (browser) await browser.close();
    console.error("[FLUX ERROR]:", error.message);
    throw error;
  }
}