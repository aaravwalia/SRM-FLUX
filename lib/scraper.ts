import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import chromium from '@sparticuz/chromium-min';

// Register stealth plugin
try {
  puppeteer.use(StealthPlugin());
} catch (e) {
  // Already initialized
}

export async function getAcademiaData(netid: string, pass: string) {
  let browser;
  try {
    const isLocal = process.env.NODE_ENV === 'development';
    
    const executablePath = isLocal 
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : await chromium.executablePath(`https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`);

    // We define the viewport manually to avoid the 'chromium.defaultViewport' error
    const viewport = { width: 1280, height: 720 };

    browser = await (puppeteer as any).launch({
      args: [...chromium.args, '--disable-web-security', '--no-sandbox'],
      executablePath: executablePath,
      headless: isLocal ? false : true, 
      defaultViewport: viewport,
    });

    const page = await browser.newPage();

    // Stealth: Hide bot identity
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    console.log("[FLUX] Initiating stealth tunnel...");
    
    await page.goto('https://academia.srmist.edu.in/#View:My_Attendance', { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });

    // Login logic
    const userSelector = '#txtUsername';
    await page.waitForSelector(userSelector, { visible: true, timeout: 30000 });
    await page.type(userSelector, netid, { delay: 75 });
    await page.click('#btnLogin');

    await page.waitForSelector('#txtPassword', { visible: true, timeout: 20000 });
    await page.type('#txtPassword', pass, { delay: 75 });
    await page.click('#btnLogin');

    // Handle session interruptions
    try {
      await page.waitForSelector('input[value*="Terminate"]', { timeout: 5000 });
      await page.click('input[value*="Terminate"]');
    } catch (e) {}

    // Extract table data
    await page.waitForSelector('table', { timeout: 30000 });
    
    const subjects = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr'));
      return rows.map(row => {
        const td = row.querySelectorAll('td');
        if (td.length >= 4) {
          const name = td[1].innerText.trim();
          const present = parseInt(td[2].innerText.trim());
          const absent = parseInt(td[3].innerText.trim());
          
          if (name && !isNaN(present) && name !== "Subject Name") {
            const total = present + absent;
            return {
              name,
              present,
              absent,
              percentage: total > 0 ? ((present / total) * 100).toFixed(2) : "0",
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
    console.error("[FLUX ERROR]:", error.message);
    throw error;
  }
}