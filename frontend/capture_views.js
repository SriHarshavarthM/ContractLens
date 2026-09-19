import puppeteer from 'puppeteer-core';
import path from 'path';

const SCREENSHOTS_DIR = '/home/harsha/.gemini/antigravity-ide/brain/95240ca8-f159-4734-baa4-ceb54880adb3/screenshots';

async function captureAllViews() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Load sample contract
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Load Master Agreement') || b.textContent.includes('Load Sample Contract'));
    if (btn) btn.click();
  });

  // Wait for contract view to render
  console.log('Waiting for Contract Duration card to render...');
  await page.waitForFunction(() => {
    return document.body.textContent.includes('Contract Duration') ||
           document.body.textContent.includes('Working Scope');
  }, { timeout: 25000 });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screen_01_contract.png') });
  console.log('Saved screen_01_contract.png');

  // Navigate to Obligations tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Obligations'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screen_02_obligations.png') });

  // Navigate to Time Management tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Time Management'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screen_03_timeline.png') });

  // Navigate to Risk Flags tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Risk') || b.textContent.includes('Assets & Risks'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screen_04_flags.png') });

  await browser.close();
  console.log('Captured test views successfully.');
}

captureAllViews().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
