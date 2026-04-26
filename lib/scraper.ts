import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import chromium from '@sparticuz/chromium-min';

// Register stealth plugin once (TS-safe way)
try {
  const stealth = StealthPlugin();
  puppeteer.use(stealth);
} catch (e) {
  // Plugin already in use
}

export async function getAcademiaData(netid: string, pass: string) {
  let browser;
  try {
    const isLocal = process.env.NODE_ENV === 'development';
    
    // Resolve Chromium executable path for Vercel vs Local
    const executablePath = isLocal 
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : await chromium.executablePath(`https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`);

    // Cast to any to avoid complex Puppeteer-Extra vs Core type conflicts during build
    browser = await (puppeteer as any).launch({
      args: [...chromium.args, '--disable-web-security', '--no-sandbox'],
      executablePath: executablePath,
      headless: isLocal ? false : true, 
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();

    // 1. Stealth Overrides: Hide 'automation' signatures
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    console.log("[FLUX] Initiating stealth tunnel to Academia...");
    
    // 2. Navigation
    await page.goto('https://academia.srmist.edu.in/#View:My_Attendance', { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });

    // 3. Login Logic
    const userSelector = '#txtUsername';
    await page.waitForSelector(userSelector, { visible: true, timeout: 30000 });
    
    // Human-like typing delay
    await page.type(userSelector, netid, { delay: 75 });
    await page.click('#btnLogin');

    await page.waitForSelector('#txtPassword', { visible: true, timeout: 20000 });
    await page.type('#txtPassword', pass, { delay: 75 });
    await page.click('#btnLogin');

    // 4. Handle SRM 'Multiple Session' Interrupts
    try {
      await page.waitForSelector('input[value*="Terminate"]', { timeout: 5000 });
      await page.click('input[value*="Terminate"]');
      console.log("[FLUX] Existing sessions terminated.");
    } catch (e) {
      // No active sessions to terminate
    }

    // 5. Scrape Attendance Table
    await page.waitForSelector('table', { timeout: 30000 });
    
    const subjects = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr'));
      return rows.map(row => {
        const td = row.querySelectorAll('td');
        if (td.length >= 4) {
          const name = td[1].innerText.trim();
          const present = parseInt(td[2].innerText.trim());
          const absent = parseInt(td[3].innerText.trim());
          
          if (name && !isNaN(present) && name !== "Subject Name" && name !== "Course Name") {
            const total = present + absent;
            const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : "0.00";
            return {
              name,
              present,
              absent,
              percentage,
              // Calculate Margin for 75%
              margin: Math.floor((present / 0.75) - total)
            };
          }
        }
        return null;
      }).filter(x => x !== null);
    });

    await browser.close();
    return subjects;

  } catch (error: any) {
    if (browser) await browser.close();
    console.error("[FLUX CRITICAL]:", error.message);
    throw error;
  }
}