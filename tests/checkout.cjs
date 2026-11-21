const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const url='https://imoce.givingfuel.com/turkana-schools-support';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const context=await browser.newContext({reducedMotion:'reduce'});
 const visited=[];
 await context.route('https://imoce.givingfuel.com/**',route=>{
  visited.push(route.request().url());
  return route.fulfill({contentType:'text/html',body:'<h1>Navigation fixture — not a real payment</h1>'});
 });
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const lang of ['en','uk','ru'])for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:1000});
  const local=`http://127.0.0.1:8000/${lang}/`;
  await page.goto(local);
  assert.equal(await page.locator('iframe, form, input').count(),0);
  const ctas=page.locator(`a[href="${url}"]:visible`);
  const count=await ctas.count();assert(count>=1);
  for(let i=0;i<count;i++){
   await page.goto(local);
   const cta=page.locator(`a[href="${url}"]:visible`).nth(i);
   assert([null,'_self'].includes(await cta.getAttribute('target')));
   await cta.scrollIntoViewIfNeeded();await page.waitForTimeout(150);
   await Promise.all([page.waitForURL(url),cta.click()]);
   assert.equal(page.url(),url);assert.equal(context.pages().length,1);
   assert.equal(page.frames().length,1);
   await page.goBack();assert.equal(page.url(),local);
  }
 }
 assert(visited.length>=12);assert(visited.every(u=>u===url));assert.deepEqual(errors,[]);
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:1000}});await nojs.route('https://imoce.givingfuel.com/**',r=>r.fulfill({contentType:'text/html',body:'Navigation fixture'}));const p=await nojs.newPage();await p.goto('http://127.0.0.1:8000/uk/');await p.locator('.mobile-donate-button').click();assert.equal(p.url(),url);await nojs.close();
 console.log('PASS: all visible GivingFuel CTAs use same-tab, top-level navigation to the exact campaign across 3 languages × 4 widths; Back works; no iframe, popup, local form or payment submission; works without JavaScript. Provider intercepted.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
