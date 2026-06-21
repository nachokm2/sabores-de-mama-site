import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));
  await page.goto('http://localhost:5200', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'C:/tmp/sabores-home.png' });
  const title = await page.title();
  console.log('TITLE:', title);
  console.log('JS_ERRORS:', jsErrors.length ? jsErrors.join(' | ') : 'none');
  await browser.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
