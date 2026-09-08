import { chromium } from 'playwright';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import assert from 'node:assert/strict';
const out = 'artifacts/astra';
fs.mkdirSync(out, { recursive: true });
const probe = createServer();
await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const origin = `http://127.0.0.1:${port}`;
let browser;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
try {
for(let i=0;i<100;i++) {
 try { if ((await fetch(origin)).ok) break; } catch {}
 if (server.exitCode !== null || i===99) throw new Error('Production preview failed to start; run npm run build first.');
 await new Promise(resolve=>setTimeout(resolve,100));
}
browser = await chromium.launch({executablePath:process.env.CHROME_PATH || ['/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p)),headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],downloadsPath:out});
const errors=[];
const context=await browser.newContext({viewport:{width:1280,height:720}});
const page=await context.newPage();page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message)});
async function open(p=page){await p.goto(`${origin}/?qa`,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__cannon,{},{timeout:20000});}
async function state(p=page){return p.evaluate(()=>window.__cannon);}
const results={};
await open();
await page.screenshot({path:`${out}/final-01-ready.png`});
await page.keyboard.press('Space');
await page.waitForFunction(()=>window.__cannon.events.length>0);
await page.screenshot({path:`${out}/final-02-first-bonk.png`});
assert((await state()).events[0].time<2,'First gag in two seconds');
await page.waitForFunction(()=>window.__cannon.elapsed>5);
await page.screenshot({path:`${out}/final-03-chain.png`});
console.log('First gag and chain PASS');
await page.waitForFunction(()=>window.__cannon.state==='end',{},{timeout:95000});
results.default=await state();fs.writeFileSync(`${out}/default-run.json`,JSON.stringify(results.default,null,2));
await page.screenshot({path:`${out}/final-04-report.png`});
assert(results.default.maxStreak>=3,'Default flight chains props');
assert(results.default.hasPhoto,'Worst-hit photo captured');
assert(results.default.replayDuration>=5 && results.default.replayDuration<=8.2,'Worst clip bounded to 5–8 seconds');
assert(Number(await page.evaluate(()=>localStorage.getItem('friend-cannon-chaos')))===results.default.chaos,'Chaos record persisted');
const downloadPromise=page.waitForEvent('download');await page.click('#savePhoto');const download=await downloadPromise;await download.saveAs(`${out}/final-05-disaster-card.png`);
await page.click('#replay');await page.waitForFunction(()=>window.__cannon.state==='replay');
await page.waitForTimeout(1800);await page.screenshot({path:`${out}/final-06-replay.png`});
await page.waitForFunction(()=>window.__cannon.state==='end',{},{timeout:20000});
assert.equal((await state()).chaos,results.default.chaos,'Replay does not change score');
const clipDownload=page.waitForEvent('download',{timeout:20000});
await page.click('#saveClip');const clip=await clipDownload;await clip.saveAs(`${out}/final-12-worst-clip.webm`);
assert(fs.statSync(`${out}/final-12-worst-clip.webm`).size>10000,'Export contains a real video');
await page.waitForFunction(()=>window.__cannon.state==='end');
await page.keyboard.press('KeyR');await page.waitForTimeout(150);
let snap=await state();assert.equal(snap.state,'fly');assert(snap.elapsed<0.5);assert.equal(snap.farts,5);
console.log('default + report + download + replay + instant retry PASS');
// A low descent creates a real rescue opportunity. No physics/debug mutation.
await page.waitForFunction(()=>window.__cannon.position.y<10 && window.__cannon.velocity.y < -6 && window.__cannon.elapsed>1,{},{timeout:30000});
const before=await state();await page.keyboard.press('KeyF');await page.waitForTimeout(120);const after=await state();
assert(after.saves>before.saves,'Low descent boost recognized as save');
assert(after.velocity.y>before.velocity.y+10,'Boost reverses the descent');
assert.equal(after.farts,before.farts-1,'One fuel consumed');
results.save={before,after};
await page.screenshot({path:`${out}/final-07-fart-save.png`});
await page.keyboard.press('KeyF');await page.keyboard.press('KeyF');assert.equal((await state()).farts,after.farts,'Boost cooldown resists spam');
// Compare the two steering directions before any collision.
for(const [name,key] of [['lift','KeyQ'],['dive','KeyE']]){
 await open();await page.keyboard.press('Space');await page.keyboard.down(key);
 await page.waitForFunction(()=>window.__cannon.elapsed>0.62);results[name]=await state();await page.keyboard.up(key);
 await page.screenshot({path:`${out}/final-08-${name}.png`});
}
console.log('STEER',JSON.stringify({lift:results.lift.position,dive:results.dive.position,lv:results.lift.velocity,dv:results.dive.velocity}));
assert(results.lift.position.y>results.dive.position.y+2,'Q and E change altitude materially');
assert(results.dive.velocity.x>results.lift.velocity.x+4,'Dive has forward agency');
console.log('save + cooldown + steering PASS');
// Extreme aim/power settings must remain finite and encounter something.
for(const [name,angle,power] of [['low',15,35],['high',75,100]]){
 await open();await page.locator('#angle').fill(String(angle));await page.locator('#power').fill(String(power));await page.click('#fire');
 await page.waitForFunction(()=>window.__cannon.elapsed>8 || window.__cannon.state==='end',{},{timeout:30000});
 const a=await state();assert(a.events.some(e=>!['BOOST','GROUND'].includes(e.label)),'Extreme launch finds a prop');assert(Number.isFinite(a.position.y));results[name]=a;
 await page.screenshot({path:`${out}/final-09-${name}.png`});
}
// Photo opt-in and restoring the cartoon, keyboard aim, and re-aim exit.
await page.keyboard.press('Escape');await page.waitForFunction(()=>window.__cannon.state==='aim');
await page.locator('summary').click();await page.locator('[data-face="2"]').click();assert.match(await page.locator('#face-status').innerText(),/Sample 3/);
await page.locator('[data-face="none"]').click();assert.match(await page.locator('#face-status').innerText(),/cartoon/);
const a0=Number(await page.locator('#angle').inputValue());await page.keyboard.down('KeyD');await page.waitForTimeout(200);await page.keyboard.up('KeyD');assert(Number(await page.locator('#angle').inputValue())<a0);
await page.locator('summary').click();
// Keyboard access to report buttons and offline startup, including local fonts.
await page.route('https://**/*', route=>route.abort());
await open();await page.locator('summary').click();await page.locator('[data-face="1"]').click();
await page.waitForTimeout(150);assert.match(await page.locator('#face-status').innerText(),/illustrated/);
await page.locator('#file').setInputFiles(`${out}/final-05-disaster-card.png`);
await page.waitForFunction(()=>document.getElementById('face-status').textContent==='Your photo');
await page.locator('[data-face="none"]').click();
await page.locator('summary').click();await page.keyboard.press('Space');
await page.waitForFunction(()=>window.__cannon.elapsed>1);
assert((await state()).chaos>0,'Offline default play still scores');
results.offline=await state();
// Repeated mid-flight retries exercise all cleanup paths after particle/boost activity.
results.retrySoak=[];
for(let i=0;i<10;i++) {
 await page.keyboard.press('KeyR');await page.keyboard.press('KeyF');
 await page.waitForFunction(()=>window.__cannon.elapsed>2.2);
 const sample=await state();assert(Number.isFinite(sample.position.x)&&Number.isFinite(sample.position.y));
 results.retrySoak.push({geometries:sample.geometries,textures:sample.textures,particles:sample.particles});
}
const tail=results.retrySoak.slice(-4);
assert(Math.max(...tail.map(s=>s.geometries))-Math.min(...tail.map(s=>s.geometries))<16,'Retry GPU geometry count stabilizes after warmup');
console.log('offline + photo + retry soak PASS',JSON.stringify(tail));
// Mobile touch controls and layout.
const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});mobile.on('pageerror',e=>errors.push(e.message));
await open(mobile);await mobile.screenshot({path:`${out}/final-10-mobile-ready.png`});
await mobile.tap('#fire');await mobile.waitForFunction(()=>window.__cannon.elapsed>0.9);
await mobile.screenshot({path:`${out}/final-11-mobile-flight.png`});
assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile has no horizontal overflow');
const bounds=await mobile.locator('#liftTouch').boundingBox();assert(bounds && bounds.y+bounds.height<844);
await mobile.locator('#boostTouch').tap();await mobile.waitForTimeout(100);assert.equal((await state(mobile)).boostsUsed,1);
await mobile.locator('#reset').tap();await mobile.waitForTimeout(100);assert.equal((await state(mobile)).boostsUsed,0);
const touchSession=await mobile.context().newCDPSession(mobile);
const touchBox=await mobile.locator('#liftTouch').boundingBox();
await touchSession.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:touchBox.x+touchBox.width/2,y:touchBox.y+touchBox.height/2}]});
await mobile.waitForFunction(()=>window.__cannon.controls.q);
await mobile.waitForTimeout(250);
await touchSession.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
await mobile.waitForFunction(()=>!window.__cannon.controls.q);
await mobile.setViewportSize({width:844,height:390});await mobile.waitForTimeout(250);
await mobile.screenshot({path:`${out}/final-13-mobile-landscape.png`});
results.mobile=await state(mobile);await mobile.close();
results.errors=errors;assert.deepEqual(errors,[]);
fs.writeFileSync(`${out}/final-qa.json`,JSON.stringify(results,null,2));
console.log('ALL CHECKS PASS',JSON.stringify({default:{chaos:results.default.chaos,events:results.default.events.length,elapsed:results.default.elapsed,clip:results.default.replayDuration},steer:{up:results.lift.position,down:results.dive.position},errors}));
} finally { await browser?.close(); server.kill('SIGTERM'); }
