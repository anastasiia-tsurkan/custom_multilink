const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
 try {
 const page = await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for (const lang of ['en','uk','ru']) {
  for (const width of [320,390,768,1440]) {
   await page.setViewportSize({width,height:1000});
   const response=await page.goto(`http://127.0.0.1:8000/${lang}/`);
   assert.equal(response.status(),200);
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${lang} overflow at ${width}`);
   assert.equal(await page.locator('.languages [aria-current="page"]').textContent(),lang==='uk'?'UA':lang.toUpperCase());
   const broken=await page.locator('img').evaluateAll(async images=>{await Promise.all(images.map(i=>i.decode()));return images.some(i=>!i.naturalWidth)});assert(!broken);
   await page.locator('label:has(input[value="other"])').click();
   await page.locator('#custom-amount').fill('0');
   await page.locator('[type="submit"]').click();assert(!(await page.locator('dialog').isVisible()));
   assert((await page.locator('#custom-amount').evaluate(i=>i.validationMessage)).length>0);
   await page.locator('#custom-amount').fill('42.50');
   await page.locator('label:has(input[value="once"])').click();
   await page.locator('[type="submit"]').click();assert(await page.locator('dialog').isVisible());
   const message=await page.locator('#notice-text').textContent();assert.match(message,/42/);
   if(lang!=='en')assert(!message.includes('You selected'));
   await page.keyboard.press('Escape');
   for(const button of await page.locator('[data-demo]').all()){
    await button.click();assert(await page.locator('dialog').isVisible());
    if(lang!=='en')assert(!/not connected|after approval/.test(await page.locator('#notice-text').textContent()));
    await page.locator('.dismiss').click();
   }
   await page.reload();
   if([390,1440].includes(width))await page.screenshot({path:`artifacts/${lang}-${width}.png`,fullPage:true});
  }
  for(const target of ['en','uk','ru']){await page.goto(`http://127.0.0.1:8000/${lang}/`);await page.locator(`.languages a[lang="${target}"]`).click();assert.equal(await page.locator('html').getAttribute('lang'),target);}
 }
 const nojs=await browser.newContext({javaScriptEnabled:false});const staticPage=await nojs.newPage();await staticPage.goto('http://127.0.0.1:8000/uk/');assert.match(await staticPage.locator('h1').textContent(),/Допомагаємо/);await staticPage.locator('.languages a[lang="ru"]').click();assert.match(await staticPage.locator('h1').textContent(),/Помогаем/);await nojs.close();
 assert.deepEqual(errors,[]);console.log('PASS: 3 languages × 4 widths, localized form validation and dialogs, all demo buttons, 9 language navigation paths, images, no overflow, static translations without JavaScript.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
