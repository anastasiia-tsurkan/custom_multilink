const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const expected=[
'https://www.instagram.com/mission_imoce/', 'https://www.facebook.com/imoce',
'https://www.imoce.org/', 'https://www.youtube.com/@imocemanuel',
'https://venmo.com/u/Anatoliy-Kolomiyets', 'https://www.paypal.com/paypalme/imoce',
'https://cash.app/$donate2imoce'];
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{
const context=await browser.newContext();
// Intercept external navigation: validate button destinations without contacting payment accounts.
await context.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:8000/')?route.continue():route.fulfill({status:200,contentType:'text/html',body:'<title>Navigation test</title>'}));
const page=await context.newPage();
for(const lang of ['en','uk','ru']){
 await page.goto(`http://127.0.0.1:8000/${lang}/`);
 for(const href of expected){
  const link=page.locator(`a[href="${href}"]`);
  assert.equal(await link.count(),1);assert.equal(await link.getAttribute('target'),'_blank');
  assert.match(await link.getAttribute('rel'),/noopener/);
  const opened=context.waitForEvent('page');await link.click();const popup=await opened;await popup.waitForLoadState();
  assert.equal(popup.url(),href);await popup.close();
 }
 assert.equal(await page.locator('[data-demo]').count(),2);
}
await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:8000/en/');
await page.screenshot({path:'artifacts/linked-desktop.png',fullPage:true});
await page.locator('.trust-icon').nth(1).screenshot({path:'artifacts/handshake.png'});
await page.setViewportSize({width:390,height:1000});await page.screenshot({path:'artifacts/linked-mobile.png',fullPage:true});
console.log('PASS: all 7 external links open exact supplied URLs in 3 languages (navigation intercepted; no payment requests made).');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
