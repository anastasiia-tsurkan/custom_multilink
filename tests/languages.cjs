const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
 try {
 const page = await browser.newPage({reducedMotion:'reduce'});
 await page.route('https://imoce.givingfuel.com/**', route=>route.fulfill({contentType:'text/html',body:'<p>GivingFuel layout fixture — not the live checkout</p>'}));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for (const lang of ['en','uk','ru']) {
  for (const width of [320,390,768,1440]) {
   await page.setViewportSize({width,height:1000});
   const response=await page.goto(`http://127.0.0.1:8000/${lang}/`);
   assert.equal(response.status(),200);
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   const favicon = await page.locator('link[rel="icon"]').evaluate(link=>link.href);
   assert(favicon.endsWith('/assets/logo-header.png'));
   assert.equal((await page.request.get(favicon)).status(),200);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${lang} overflow at ${width}`);
   assert.equal(await page.locator('.languages [aria-current="page"]').textContent(),lang==='uk'?'UA':lang.toUpperCase());
   await page.locator('.trust').scrollIntoViewIfNeeded();
   const broken=await page.locator('img').evaluateAll(async images=>{await Promise.all(images.map(i=>i.decode()));return images.some(i=>!i.naturalWidth)});assert(!broken);
   assert.equal(await page.locator('.givingfuel-link').count(),1);
   assert.equal(await page.locator('input').count(),0);
   assert.equal(await page.locator('iframe').getAttribute('allow'),'payment');
   await page.locator('.givingfuel-scroll').click();
   assert(new URL(page.url()).hash==='#donate');
   for(const button of await page.locator('[data-demo]').all()){
    await button.scrollIntoViewIfNeeded();
    // Allow the cross-origin frame compositor to settle after a long scroll.
    await page.waitForTimeout(250);
    await button.click();assert(await page.locator('dialog').isVisible());
    if(lang!=='en')assert(!/not connected|after approval/.test(await page.locator('#notice-text').textContent()));
    await page.locator('.dismiss').click();
   }
   await page.reload();
   if([390,1440].includes(width))await page.screenshot({path:`artifacts/${lang}-${width}.png`,fullPage:true});
  }
  console.log(`Layout and embed checks passed: ${lang}`);
  for(const target of ['en','uk','ru']){await page.goto(`http://127.0.0.1:8000/${lang}/`);await page.locator(`.languages a[lang="${target}"]`).click();assert.equal(await page.locator('html').getAttribute('lang'),target);}
 }
 const nojs=await browser.newContext({javaScriptEnabled:false});await nojs.route('https://imoce.givingfuel.com/**', route=>route.fulfill({contentType:'text/html',body:'GivingFuel layout fixture'}));const staticPage=await nojs.newPage();await staticPage.goto('http://127.0.0.1:8000/uk/');assert.match(await staticPage.locator('h1').textContent(),/Допомагаємо/);await staticPage.locator('.languages a[lang="ru"]').click();assert.match(await staticPage.locator('h1').textContent(),/Помогаем/);await nojs.close();
 assert.deepEqual(errors,[]);console.log('PASS: 3 languages × 4 widths, translated embedded checkout layout (fixture) and legal dialogs, all demo buttons, 9 language navigation paths, images, no overflow, static translations without JavaScript.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
