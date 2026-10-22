// Run with Playwright available: node tests/smoke.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page = await browser.newPage();
 const errors=[]; const outbound=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8000/'))outbound.push(r.url());});
 for (const width of [320,390,768,1440]) {
  await page.setViewportSize({width,height:1000});
  await page.goto('http://127.0.0.1:8000/');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at ${width}`);
  await page.locator('label').filter({has:page.locator('input[name="amount"][value="50"]')}).click();
  assert.match(await page.locator('#checkout').textContent(),/\$50 per month/);
  await page.locator('label').filter({has:page.locator('input[value="once"]')}).click();
  assert.match(await page.locator('#checkout').textContent(),/one-time/);
  await page.locator('label').filter({has:page.locator('input[value="other"]')}).click();
  await page.locator('#custom-amount').fill('0');
  await page.locator('button[type="submit"]').click();
  assert.equal(await page.locator('dialog').isVisible(),false);
  await page.locator('#custom-amount').fill('37.50');
  await page.locator('button[type="submit"]').click();
  assert.match(await page.locator('#notice-text').textContent(),/37.5 one-time/);
  await page.keyboard.press('Escape');
  for (const button of await page.locator('[data-demo]').all()) {
   await button.click(); assert(await page.locator('dialog').isVisible());
   await page.locator('.dismiss').click();
  }
  await page.reload();
  await page.screenshot({path:`artifacts/preview-${width}.png`,fullPage:true});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(outbound,[]);
 await browser.close();console.log('PASS: 320, 390, 768, 1440px; amount/frequency, custom validation, 9 placeholder buttons, dialogs, no overflow, no external requests or JS errors.');
})().catch(e=>{console.error(e);process.exitCode=1;});
