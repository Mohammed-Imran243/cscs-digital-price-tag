const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:5173/login');
  await page.type('input[placeholder="Username"]', 'DG0358');
  await page.type('input[placeholder="Password"]', 'xzlongan@123');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'frontend_translation_test.png' });
  await browser.close();
})();
