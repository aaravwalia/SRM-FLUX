const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('https://academia.srmist.edu.in/', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'step1.png' });
  
  const frames = page.frames();
  const loginFrame = frames.find(f => f.url().includes('signin'));
  
  if (loginFrame) {
    await loginFrame.waitForSelector('#login_id');
    await loginFrame.type('#login_id', 'aw2771@srmist.edu.in');
    await loginFrame.click('#nextbtn');
    
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'step2.png' });
    
    await loginFrame.waitForSelector('#password');
    await loginFrame.type('#password', '1234@srm.coM');
    await loginFrame.click('#nextbtn');
    
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: 'step3.png' });
  }

  await page.goto('https://academia.srmist.edu.in/attendance.jsp', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'step4.png' });
  const html = await page.content();
  require('fs').writeFileSync('attendance-debug.html', html);
  
  await browser.close();
})();
