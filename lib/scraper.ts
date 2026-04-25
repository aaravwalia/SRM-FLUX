import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import chromium from '@sparticuz/chromium-min';

puppeteer.use(StealthPlugin());

export async function getAcademiaData(netid: string, pass: string) {
  let browser;
  try {
    const isLocal = process.env.NODE_ENV === 'development';
    
    browser = await (puppeteer as any).launch({
      args: [
        ...chromium.args,
        '--disable-web-security',
        '--no-sandbox',
        // --- PORTALX SECRET: FAKE RESIDENTIAL IP ---
        // If you have a proxy, add: '--proxy-server=http://your-proxy-ip:port'
      ],
      executablePath: isLocal 
        ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        : await chromium.executablePath(`https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Patch fingerprints
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await page.goto('https://academia.srmist.edu.in/#View:My_Attendance', { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });

    // Handle the frame-switching Zoho login
    const userSelector = '#txtUsername';
    await page.waitForSelector(userSelector, { visible: true, timeout: 30000 });
    
    await page.type(userSelector, netid, { delay: 100 }); // Human-like typing
    await page.click('#btnLogin');

    await page.waitForSelector('#txtPassword', { visible: true, timeout: 15000 });
    await page.type('#txtPassword', pass, { delay: 100 });
    await page.click('#btnLogin');

    // Handle the Terminate Session popup (Common in SRM)
    try {
      await page.waitForSelector('input[value*="Terminate"]', { timeout: 5000 });
      await page.click('input[value*="Terminate"]');
    } catch (e) {}

    // Wait for data
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
      }).filter(x => x && x.name !== "Subject Name");
    });

    await browser.close();
    return subjects;

  } catch (error: any) {
    if (browser) await browser.close();
    console.error("PortalX-Style Failure:", error.message);
    throw error;
  }
}