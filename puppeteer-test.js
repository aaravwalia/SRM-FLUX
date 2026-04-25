const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Intercept requests to see what is sent
  page.on('request', request => {
    if (request.method() === 'POST') {
      console.log('POST URL:', request.url());
      console.log('POST Data:', request.postData());
    }
  });

  await page.goto('https://academia.srmist.edu.in/', { waitUntil: 'networkidle2' });
  
  // Wait for email input
  try {
    const html = await page.content();
    console.log('Page loaded. Checking for form...');
    
    // We will dump out all inputs to see what's what
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input')).map(i => ({ name: i.name, id: i.id, type: i.type }));
    });
    console.log('Inputs found:', inputs);
    
    // Check if there is an iframe or if the form is straight on the page
    const frames = page.frames();
    console.log('Frames:', frames.map(f => f.url()));

  } catch (err) {
    console.error(err);
  }

  await browser.close();
})();
