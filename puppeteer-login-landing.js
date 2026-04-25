const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('https://academia.srmist.edu.in/', { waitUntil: 'networkidle2' });
  
  const frames = page.frames();
  const loginFrame = frames.find(f => f.url().includes('signin'));
  
  if (loginFrame) {
    await loginFrame.waitForSelector('#login_id');
    await loginFrame.type('#login_id', 'aw2771@srmist.edu.in');
    await loginFrame.click('#nextbtn');
    
    await new Promise(r => setTimeout(r, 2000));
    
    await loginFrame.waitForSelector('#password');
    await loginFrame.type('#password', '1234@srm.coM');
    await loginFrame.click('#nextbtn');
    
    // Wait for the main page to load after redirect
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
  }

  const html = await page.content();
  require('fs').writeFileSync('landing-debug.html', html);
  console.log('Current URL:', page.url());
  
  await browser.close();
})();
