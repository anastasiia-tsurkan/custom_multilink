const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const child = fs.readFileSync(require('node:path').join(__dirname,'fixtures/iframeResizer.contentWindow.min.js'),'utf8');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try {
 const page=await browser.newPage({reducedMotion:'reduce'});
 // Exercise the real parent/child resizing library across origins. No live payment requests.
 await page.route('https://imoce.givingfuel.com/**',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><style>html,body{margin:0;padding:0;min-height:0}</style></head><body><div id="content" style="height:620px">Test checkout content</div><script>${child}</script></body></html>`}));
 for(const language of ['en','uk','ru']){
  for(const width of [390,1440]){
   await page.setViewportSize({width,height:1000});
   await page.goto(`http://127.0.0.1:8000/${language}/`);
   const frame=page.locator('#givingfuel-checkout');
   await page.waitForFunction(()=>{const h=document.querySelector('#givingfuel-checkout').getBoundingClientRect().height;return h>=620&&h<700});
   const contentFrame=page.frames().find(f=>f.url().startsWith('https://imoce.givingfuel.com/'));
   await contentFrame.locator('#content').evaluate(el=>el.style.height='1520px');
   await page.waitForFunction(()=>document.querySelector('#givingfuel-checkout').getBoundingClientRect().height>=1520);
   await contentFrame.locator('#content').evaluate(el=>el.style.height='480px');
   await page.waitForFunction(()=>{const h=document.querySelector('#givingfuel-checkout').getBoundingClientRect().height;return h>=480&&h<550});
   assert.equal(await frame.getAttribute('scrolling'),'yes');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
 }
 const nojs=await browser.newContext({javaScriptEnabled:false});
 await nojs.route('https://imoce.givingfuel.com/**',route=>route.fulfill({contentType:'text/html',body:'No-script fixture'}));
 const fallback=await nojs.newPage();await fallback.goto('http://127.0.0.1:8000/en/');
 assert.equal(await fallback.locator('#givingfuel-checkout').evaluate(el=>el.getBoundingClientRect().height),1100);
 assert.equal(await fallback.locator('#givingfuel-checkout').getAttribute('scrolling'),'yes');
 await nojs.close();
 console.log('PASS: actual iframe-resizer handshake, growth and shrinkage across 3 languages × 2 widths; scrollable 1100px fallback without JavaScript. Provider content simulated, no live payments.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
