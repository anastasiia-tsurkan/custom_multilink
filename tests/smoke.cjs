// Run with Playwright available: node tests/smoke.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
 const page = await browser.newPage();
 const errors=[]; const outbound=[];
 await page.route('https://imoce.givingfuel.com/**', route=>route.fulfill({contentType:'text/html',body:'<p>GivingFuel layout fixture — not the live checkout</p>'}));
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8000/') && !r.url().startsWith('https://imoce.givingfuel.com/'))outbound.push(r.url());});
 for (const width of [320,390,768,1440]) {
  await page.setViewportSize({width,height:1000});
  await page.goto('http://127.0.0.1:8000/');
  const cover = page.locator('.hero-image img');
  await cover.evaluate(img => img.decode());
  assert((await cover.evaluate(img => img.currentSrc)).endsWith(width <= 760 ? '/assets/cover-mobile.png' : '/assets/cover-desktop.jpg'), 'Wrong responsive cover');
  assert(await page.locator('.brand img, footer img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0)), 'Logo did not load');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at ${width}`);
  assert.equal(await page.locator('.givingfuel-link').count(),1);
  assert.equal(await page.locator('input').count(),0);
  assert.equal(await page.locator('iframe').getAttribute('allow'),'payment');
  assert.equal(await page.locator('iframe').getAttribute('height'),'2100');
  for (const button of await page.locator('[data-demo]').all()) {
   await button.scrollIntoViewIfNeeded();
    // Allow the cross-origin frame compositor to settle after a long scroll.
    await page.waitForTimeout(250);
    await button.click(); assert(await page.locator('dialog').isVisible());
   await page.locator('.dismiss').click();
  }
  await page.reload();
  await page.screenshot({path:`artifacts/preview-${width}.png`,fullPage:true});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(outbound,[]);
 console.log('PASS: 320, 390, 768, 1440px; GivingFuel embed layout (fixture), no local payment fields, 2 legal placeholder buttons, dialogs, no overflow, no external requests or JS errors.');
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
