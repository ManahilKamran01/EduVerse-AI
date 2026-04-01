const puppeteer = require('puppeteer'); 
(async () => { 
    const browser = await puppeteer.launch(); 
    const page = await browser.newPage(); 
    await page.goto('http://localhost:4200'); 
    await page.screenshot({path: 'frontend_screenshot.png'}); 
    await browser.close(); 
})();
