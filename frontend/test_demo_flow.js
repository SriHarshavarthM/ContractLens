import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = '/home/harsha/.gemini/antigravity-ide/brain/95240ca8-f159-4734-baa4-ceb54880adb3/screenshots';
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function clickByText(page, tag, textSnippet) {
  const clicked = await page.evaluate((tag, textSnippet) => {
    const elements = Array.from(document.querySelectorAll(tag));
    for (const el of elements) {
      if (el.textContent && el.textContent.includes(textSnippet)) {
        el.click();
        return true;
      }
    }
    return false;
  }, tag, textSnippet);

  if (!clicked) {
    throw new Error(`Could not find ${tag} containing text "${textSnippet}"`);
  }
}

async function runDemoFlow() {
  console.log('Launching Google Chrome...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Landing Screen
  console.log('1. Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '00_landing_hero.png') });
  console.log('-> Saved 00_landing_hero.png');

  // 2. Click "Load Sample Contract (v1.0)"
  console.log('2. Clicking "Load Sample Contract (v1.0)"...');
  await clickByText(page, 'button', 'Load Sample Contract (v1.0)');

  // 3. Wait for analysis to complete and navigate to Overview
  console.log('3. Waiting for analysis pipeline to complete...');
  await page.waitForFunction(() => {
    return document.body.textContent.includes('Contract Metadata Extracted') &&
           document.body.textContent.includes('Acme Cloud Services LLC');
  }, { timeout: 20000 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_overview.png') });
  console.log('-> Saved 01_overview.png');

  // 4. Toggle "View Source Clause"
  console.log('4. Toggling collapsible source clause...');
  await clickByText(page, 'button', 'View Source Clause');
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_overview_source_clause.png') });
  console.log('-> Saved 02_overview_source_clause.png');

  // 5. Obligations tab
  console.log('5. Clicking "Obligations" tab...');
  await clickByText(page, 'button', 'Obligations');
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_obligations.png') });
  console.log('-> Saved 03_obligations.png');

  // 6. Timeline tab
  console.log('6. Clicking "Timeline" tab...');
  await clickByText(page, 'button', 'Timeline');
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_timeline.png') });
  console.log('-> Saved 04_timeline.png');

  // 7. Risk Flags tab
  console.log('7. Clicking "Risk Flags" tab...');
  await clickByText(page, 'button', 'Risk Flags');
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_risk_flags.png') });
  console.log('-> Saved 05_risk_flags.png');

  // 8. Open "Copy for Legal Review" modal
  console.log('8. Opening "Copy for Legal Review" email modal...');
  await clickByText(page, 'button', 'Copy for Legal Review');
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_legal_email_modal.png') });
  console.log('-> Saved 06_legal_email_modal.png');

  // Close modal
  await clickByText(page, 'button', 'Close');
  await new Promise((r) => setTimeout(r, 400));

  // 9. Ask AI tab
  console.log('9. Clicking "Ask AI" tab...');
  await clickByText(page, 'button', 'Ask AI');
  await new Promise((r) => setTimeout(r, 600));

  console.log('Submitting question: "What happens if we miss the payment deadline?"');
  await clickByText(page, 'button', 'What happens if we miss the payment deadline?');
  await page.waitForFunction(() => {
    return document.body.textContent.includes('ContractLens Intelligence') &&
           document.body.textContent.includes('Section 5.3');
  }, { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_ask_ai_answer.png') });
  console.log('-> Saved 07_ask_ai_answer.png');

  // 10. Executive Summary tab
  console.log('10. Clicking "Executive Summary" tab...');
  await clickByText(page, 'button', 'Executive Summary');
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_executive_summary.png') });
  console.log('-> Saved 08_executive_summary.png');

  // 11. Compare Diff tab
  console.log('11. Clicking "Compare Diff" tab...');
  await clickByText(page, 'button', 'Compare Diff');
  await new Promise((r) => setTimeout(r, 600));

  console.log('Loading comparison versions...');
  await clickByText(page, 'button', 'Load Sample v1 vs v2');
  await page.waitForFunction(() => {
    return document.body.textContent.includes('Payment Terms') ||
           document.body.textContent.includes('MODIFIED TERMS');
  }, { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_compare_diff.png') });
  console.log('-> Saved 09_compare_diff.png');

  // 12. Alerts tab
  console.log('12. Clicking "Alerts" tab...');
  await clickByText(page, 'button', 'Alerts');
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_alerts_watchlist.png') });
  console.log('-> Saved 10_alerts_watchlist.png');

  // 13. API Key Config Modal
  console.log('13. Opening AI API Key modal in header...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => b.title === 'Configure AI API Key');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_api_key_modal.png') });
  console.log('-> Saved 11_api_key_modal.png');

  await browser.close();
  console.log('\n======================================================');
  console.log('SUCCESS: ALL DEMO FLOW STEPS VERIFIED IN GOOGLE CHROME!');
  console.log('======================================================\n');
}

runDemoFlow().catch((err) => {
  console.error('Demo flow failed:', err);
  process.exit(1);
});
