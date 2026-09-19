import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/home/harsha/.gemini/antigravity-ide/brain/95240ca8-f159-4734-baa4-ceb54880adb3/screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runCompleteWebTest() {
  console.log('=== RUNNING COMPLETE CONTRACTLENS END-TO-END WEB TEST ===');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const report = {
    testedAt: new Date().toISOString(),
    themeTests: {},
    sidebarTests: {},
    contractAnalysis: {},
    tabScreenshots: [],
    correctionsVerified: []
  };

  try {
    // 1. Load Homepage
    console.log('Step 1: Navigating to http://localhost:5173');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 20000 });
    
    // Clear localStorage to test fresh default state
    await page.evaluate(() => {
      localStorage.removeItem('cl_theme');
      location.reload();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await page.waitForSelector('aside', { timeout: 10000 });

    // 2. Verify Sidebar Properties
    const sidebarMetrics = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      const rect = aside ? aside.getBoundingClientRect() : null;
      const navButtons = Array.from(aside.querySelectorAll('button')).map(b => b.textContent.trim()).filter(Boolean);
      return {
        width: rect ? rect.width : 0,
        buttonCount: navButtons.length,
        navButtons: navButtons.slice(0, 8)
      };
    });
    console.log('Sidebar initial metrics:', sidebarMetrics);
    report.sidebarTests.expanded = sidebarMetrics;

    // 3. Verify Pure Dark Mode Color Values
    const darkStyles = await page.evaluate(() => {
      const isDark = document.documentElement.classList.contains('dark');
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      const asideBg = window.getComputedStyle(document.querySelector('aside')).backgroundColor;
      const headerBg = window.getComputedStyle(document.querySelector('header')).backgroundColor;
      return { isDark, bodyBg, asideBg, headerBg };
    });
    console.log('Default Dark Mode Styles:', darkStyles);
    report.themeTests.darkMode = darkStyles;
    
    // Verify NOT blue: rgb(9, 9, 11) is pure dark obsidian
    const isPureDark = darkStyles.bodyBg === 'rgb(9, 9, 11)';
    report.correctionsVerified.push({
      item: 'Dark Theme is Pure Obsidian (#09090B), NOT dark blue',
      passed: isPureDark && darkStyles.isDark,
      details: darkStyles
    });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'final_01_landing_pure_dark.png') });

    // 4. Test Sidebar Collapse to 64px
    console.log('Step 2: Testing Sidebar Collapse');
    const collapseBtn = await page.$('aside button[title*="Sidebar"]');
    if (collapseBtn) {
      await collapseBtn.click();
      await new Promise(r => setTimeout(r, 400));
      const collapsedWidth = await page.evaluate(() => {
        const aside = document.querySelector('aside');
        return aside ? aside.getBoundingClientRect().width : 0;
      });
      console.log('Collapsed width:', collapsedWidth);
      report.sidebarTests.collapsed = { width: collapsedWidth };
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'final_02_sidebar_collapsed.png') });

      // Re-expand
      await collapseBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // 5. Test Light Mode Contrast
    console.log('Step 3: Testing Light Theme Toggle & Contrast');
    const themeBtn = await page.$('button[title*="Theme"]');
    if (themeBtn) {
      await themeBtn.click();
      await new Promise(r => setTimeout(r, 400));
      const lightStyles = await page.evaluate(() => {
        const isDark = document.documentElement.classList.contains('dark');
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        const textColor = window.getComputedStyle(document.body).color;
        return { isDark, bodyBg, textColor };
      });
      console.log('Light Mode Styles:', lightStyles);
      report.themeTests.lightMode = lightStyles;
      report.correctionsVerified.push({
        item: 'Light Mode High Contrast Text',
        passed: !lightStyles.isDark && lightStyles.bodyBg === 'rgb(244, 244, 245)',
        details: lightStyles
      });
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'final_03_landing_light_mode.png') });

      // Switch back to Dark Mode
      await themeBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // 6. Click Sample Contract Button and Wait for Real Analysis
    console.log('Step 4: Loading Sample Contract "Load Master Agreement (v1.0)"');
    const loadSuccess = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const targetBtn = buttons.find(b => b.textContent.includes('Load Master Agreement'));
      if (targetBtn) {
        targetBtn.click();
        return true;
      }
      return false;
    });

    console.log('Load Master Agreement button clicked:', loadSuccess);

    // Wait for analysis to complete and overview to render
    await page.waitForFunction(() => {
      const headings = Array.from(document.querySelectorAll('h2, h3'));
      return headings.some(h => h.textContent.includes('Agreement') || h.textContent.includes('Contract Overview') || h.textContent.includes('Parties'));
    }, { timeout: 45000 });

    console.log('Contract loaded successfully!');
    await new Promise(r => setTimeout(r, 2000));

    // Capture Contract Intelligence Top Card and Overview
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'final_04_contract_overview.png') });

    // Verify Active Document in Sidebar
    const activeDocInSidebar = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      return aside ? aside.textContent.includes('Active Document') : false;
    });
    report.sidebarTests.showsActiveDocument = activeDocInSidebar;

    // 7. Navigate through ALL Tabs via Sidebar
    const tabs = [
      { id: 'obligations', label: 'Obligations & SLAs', file: 'final_05_obligations.png' },
      { id: 'timeline', label: 'Time Management', file: 'final_06_timeline.png' },
      { id: 'flags', label: 'Clause Risk Audit', file: 'final_07_risk_flags.png' },
      { id: 'compare', label: 'Version Diff', file: 'final_08_version_diff.png' },
      { id: 'qa', label: 'Ask AI Legal Q&A', file: 'final_09_ask_ai_qa.png' },
      { id: 'summary', label: 'Executive Briefing', file: 'final_10_executive_summary.png' },
      { id: 'alerts', label: 'Deadline Watchlist', file: 'final_11_deadline_alerts.png' }
    ];

    for (const t of tabs) {
      console.log(`Navigating via Sidebar: ${t.label}`);
      await page.evaluate((label) => {
        const asideButtons = Array.from(document.querySelectorAll('aside button'));
        const target = asideButtons.find(b => b.textContent.includes(label));
        if (target) target.click();
      }, t.label);

      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, t.file) });
      report.tabScreenshots.push({ tab: t.label, screenshot: t.file });
    }

    // 8. Test Legal Review Email Modal from Flags tab
    console.log('Step 5: Testing Legal Review Email Drafter Modal');
    await page.evaluate(() => {
      const asideButtons = Array.from(document.querySelectorAll('aside button'));
      const target = asideButtons.find(b => b.textContent.includes('Clause Risk Audit'));
      if (target) target.click();
    });
    await new Promise(r => setTimeout(r, 500));

    const emailModalTriggered = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const mailBtn = btns.find(b => b.textContent.includes('Copy for Legal Review'));
      if (mailBtn) {
        mailBtn.click();
        return true;
      }
      return false;
    });

    if (emailModalTriggered) {
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'final_12_legal_email_modal.png') });
      
      // Close modal
      await page.evaluate(() => {
        const closeBtn = document.querySelector('div.fixed button');
        if (closeBtn) closeBtn.click();
      });
      await new Promise(r => setTimeout(r, 400));
    }

    // 9. Test Ask AI Q&A Interactive Question
    console.log('Step 6: Testing AI Q&A Interaction');
    await page.evaluate(() => {
      const asideButtons = Array.from(document.querySelectorAll('aside button'));
      const target = asideButtons.find(b => b.textContent.includes('Ask AI Legal Q&A'));
      if (target) target.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Click first suggested question
    await page.evaluate(() => {
      const suggestBtns = Array.from(document.querySelectorAll('main button'));
      const firstQ = suggestBtns.find(b => b.textContent.includes('What happens if we miss'));
      if (firstQ) firstQ.click();
    });
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'final_13_ask_ai_with_citation.png') });

    // 10. Test Auth Modal
    console.log('Step 7: Testing Auth Modal in Pure Dark Theme');
    const profileBtn = await page.$('button[title="Account Settings"]');
    if (profileBtn) {
      await profileBtn.click();
      await new Promise(r => setTimeout(r, 300));
      
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const switchAcc = btns.find(b => b.textContent.includes('Switch Account') || b.textContent.includes('Sign In'));
        if (switchAcc) switchAcc.click();
      });
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'final_14_auth_modal_pure_dark.png') });
    }

    console.log('=== TEST COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Test error:', err);
    report.error = err.message;
  } finally {
    await browser.close();
  }

  fs.writeFileSync(
    path.join('/home/harsha/.gemini/antigravity-ide/brain/95240ca8-f159-4734-baa4-ceb54880adb3', 'scratch/complete_test_report.json'),
    JSON.stringify(report, null, 2)
  );
  console.log(JSON.stringify(report, null, 2));
}

runCompleteWebTest();
