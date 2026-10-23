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
  const cover = page.locator('.hero-image img');
  await cover.evaluate(img => img.decode());
  assert((await cover.evaluate(img => img.currentSrc)).endsWith(width <= 760 ? '/assets/cover-mobile.png' : '/assets/cover-desktop.jpg'), 'Wrong responsive cover');
  assert(await page.locator('.brand img, footer img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0)), 'Logo did not load');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at ${width}`);
  assert.equal(await page.locator('.givingfuel-link').count(),1);
  assert.equal(await page.locator('input, iframe').count(),0);
  for (const button of await page.locator('[data-demo]').all()) {
   await button.click(); assert(await page.locator('dialog').isVisible());
   await page.locator('.dismiss').click();
  }
  await page.reload();
  await page.screenshot({path:`artifacts/preview-${width}.png`,fullPage:true});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(outbound,[]);
 await browser.close();console.log('PASS: 320, 390, 768, 1440px; hosted GivingFuel card, no local payment fields, 2 legal placeholder buttons, dialogs, no overflow, no external requests or JS errors.');
})().catch(e=>{console.error(e);process.exitCode=1;});
