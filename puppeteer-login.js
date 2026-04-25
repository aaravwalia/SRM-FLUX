const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // Show UI
  const page = await browser.newPage();
  
  await page.goto('https://academia.srmist.edu.in/', { waitUntil: 'networkidle2' });
  
  // Wait for the iframe and form to load
  await new Promise(r => setTimeout(r, 3000));
  
  const frames = page.frames();
  const loginFrame = frames.find(f => f.url().includes('signin'));
  if (!loginFrame) {
    console.log('Login frame not found');
    await browser.close();
    return;
  }
  
  console.log('Typing credentials...');
  await loginFrame.type('#login_id', 'aw2771@srmist.edu.in');
  
  // They might have a next button, wait let's look at the iframe inputs we printed earlier:
  // LOGIN_ID, PASSWORD (but is it split into two steps?)
  // Usually Zoho has "Next" button for email, then password. Let's try pressing enter.
  await loginFrame.type('#login_id', String.fromCharCode(13));
  
  await new Promise(r => setTimeout(r, 2000));
  await loginFrame.type('#password', '1234@srm.coM');
  await loginFrame.type('#password', String.fromCharCode(13));
  
  // Wait for redirect to academia.srmist.edu.in/attendance.jsp or home
  console.log('Waiting for login...');
  await new Promise(r => setTimeout(r, 10000));
  
  await page.goto('https://academia.srmist.edu.in/attendance.jsp', { waitUntil: 'networkidle2' });
  
  const html = await page.content();
  fs.writeFileSync('attendance-test2.html', html);
  console.log('Done, saved to attendance-test2.html');
  
  await browser.close();
})();
