const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const pages=[['privacy.html','Privacy Policy',12,'privacy-body.html'],['terms.html','Terms of Use',11,'terms-body.html'],['donation-policy.html','Donation & Refund Policy',9,'donation-policy-body.html']];
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const context=await browser.newContext({javaScriptEnabled:false});
 await context.route('https://imoce.givingfuel.com/**',r=>r.fulfill({contentType:'text/html',body:'Checkout fixture'}));
 const page=await context.newPage();
 for(const lang of ['en','uk','ru'])for(const [file,title,count,bodyFile]of pages){
  for(const width of [320,1440]){
   await page.setViewportSize({width,height:1000});
   const response=await page.goto(`http://127.0.0.1:8000/${lang}/${file}`);assert.equal(response.status(),200);
   assert.equal(await page.locator('h1').textContent(),title);
   assert.equal(await page.locator('.legal-copy').getAttribute('lang'),'en');
   assert.equal(await page.locator('.legal-copy h2').count(),count);
   assert.equal(await page.locator('time').getAttribute('datetime'),'2026-11-11');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.equal(await page.locator('iframe').count(),0);
   assert.equal(await page.locator('.legal-copy a[href="https://www.imoce.org/"]').count(),1);
   assert((await page.locator('.legal-copy a[href="mailto:imocemmanuel@gmail.com"]').count())>=1);
   // Ensure the complete supplied policy survives generation, including the English organization name.
   const fixture=fs.readFileSync(path.join(__dirname,'../templates',bodyFile),'utf8');
   const original=await page.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');return d.body.textContent.replace(/\s+/g,' ').trim()},fixture);
   const actual=await page.locator('.legal-copy').evaluate(a=>a.textContent.replace(/\s+/g,' ').trim());assert.equal(actual,original);
   for(const target of ['en','uk','ru']){
    const href=await page.locator(`.languages a[lang="${target}"]`).getAttribute('href');
    assert(href.endsWith(`${target}/${file}`));
   }
  }
  await page.locator('.languages a[lang="uk"]').click();assert(page.url().endsWith(`/uk/${file}`));
  await page.locator('.back-link').click();assert(page.url().endsWith('/uk/'));
 }
 // Verify the actual footer links, including root-relative deployment behavior.
 for(const prefix of ['', 'en/','uk/','ru/'])for(const [file]of pages){
  await page.goto('http://127.0.0.1:8000/'+prefix);
  await page.locator(`footer a[href="${file}"]`).click();assert(page.url().endsWith('/'+prefix+file));
 }
 await context.close();console.log('PASS: 3 policies × 3 languages × 2 widths, complete English text, section counts/date/contact links, footer navigation, language preservation and return link without JavaScript.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
