import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = '/home/harsha/.gemini/antigravity-ide/brain/95240ca8-f159-4734-baa4-ceb54880adb3/screenshots';
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function inspect() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('1. Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'current_01_landing.png') });

  // Check DOM structure and theme
  const domInfo = await page.evaluate(() => {
    return {
      title: document.title,
      htmlClasses: document.documentElement.className,
      hasSidebar: Boolean(document.querySelector('aside')),
      sidebarWidth: document.querySelector('aside')?.offsetWidth,
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(Boolean).slice(0, 15),
    };
  });
  console.log('DOM Info:', JSON.stringify(domInfo, null, 2));

  // Toggle Dark Theme if not already dark
  console.log('2. Testing Dark Theme toggle...');
  await page.evaluate(() => {
    const themeBtn = document.querySelector('button[title*="Theme"]');
    if (themeBtn) themeBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'current_02_dark_toggle.png') });

  // Load sample contract
  console.log('3. Loading sample contract...');
  const loaded = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const loadBtn = btns.find(b => b.textContent.includes('Load Master Agreement') || b.textContent.includes('Load Sample Contract'));
    if (loadBtn) {
      loadBtn.click();
      return true;
    }
    return false;
  });
  console.log('Sample load button clicked:', loaded);

  // Wait for contract view
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'current_03_contract_view.png') });

  await browser.close();
  console.log('Inspection complete.');
}

inspect().catch(err => {
  console.error('Inspection error:', err);
  process.exit(1);
});
