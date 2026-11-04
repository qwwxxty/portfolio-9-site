// Рендерить PNG-іконки й картинку для соцмереж (Open Graph) через Playwright.
// Запуск з кореня репозиторію: node tools/render-images.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const file = (p) => 'file://' + path.join(root, p);

const fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Arsenal:wght@400;700&family=Dela+Gothic+One&display=swap">';

const og = `<!doctype html><html lang="uk"><head><meta charset="utf-8">${fonts}
<link rel="stylesheet" href="${file('styles.css')}">
<style>
  html,body{margin:0;width:1200px;height:630px;overflow:hidden}
  .og{width:1200px;height:630px;display:grid;grid-template-columns:640px 1fr;gap:40px;align-items:center;padding:0 56px;box-sizing:border-box}
  .og .plate{padding:48px 44px 40px}
  .og h1{font-family:var(--ff-display);font-weight:400;font-size:52px;line-height:1.08;margin:14px 0 18px}
  .og .tags{grid-template-columns:repeat(2,1fr);gap:34px 18px}
  .og .tag__name{font-size:var(--fs-2)}
  .og .facts{font-weight:700;color:var(--muted)}
  .swing{opacity:1!important;animation:none!important}
</style></head><body class="board">
<div class="og">
  <div class="plate">
    <p class="kicker">СТО в Сумах · вул. Харківська, 118</p>
    <h1>Знайдемо поломку швидше, ніж ви&nbsp;— ключ на&nbsp;10</h1>
    <p class="facts">Кошторис до ремонту · Гарантія 6 міс. або 10 000 км</p>
  </div>
  <ul class="tags">
    <li class="tag tag--hit"><article class="tag__card"><span class="tag__hole"></span><p class="tag__no"><span>№03</span> Ходова</p><h3 class="tag__name">Огляд ходової</h3><p class="tag__price">300 <small>грн</small></p></article></li>
    <li class="tag"><article class="tag__card"><span class="tag__hole"></span><p class="tag__no"><span>№04</span> Ходова</p><h3 class="tag__name">Розвал-сходження</h3><p class="tag__price"><small>від</small> 700 <small>грн</small></p></article></li>
    <li class="tag"><article class="tag__card"><span class="tag__hole"></span><p class="tag__no"><span>№01</span> ТО</p><h3 class="tag__name">Олива й фільтр</h3><p class="tag__price"><small>від</small> 350 <small>грн</small></p></article></li>
    <li class="tag"><article class="tag__card"><span class="tag__hole"></span><p class="tag__no"><span>№05</span> Гальма</p><h3 class="tag__name">Колодки, вісь</h3><p class="tag__price"><small>від</small> 500 <small>грн</small></p></article></li>
  </ul>
</div></body></html>`;

(async () => {
  const browser = await chromium.launch();

  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  // file:// стилі не підвантажуються в setContent, тож пишемо тимчасовий файл
  const tmp = path.join(__dirname, '.og-tmp.html');
  fs.writeFileSync(tmp, og);
  await page.goto('file://' + tmp, { waitUntil: 'networkidle' });
  fs.unlinkSync(tmp);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(root, 'assets/og-image.png') });

  for (const [size, out] of [[32, 'assets/favicon-32.png'], [180, 'assets/apple-touch-icon.png'], [512, 'assets/icon-512.png']]) {
    const p = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    // apple-touch-icon без прозорих кутів: iOS сам заокруглює
    const bg = size === 32 ? 'transparent' : '#162336';
    const tmpIcon = path.join(__dirname, '.icon-tmp.html');
    fs.writeFileSync(tmpIcon, `<body style="margin:0;background:${bg}"><img src="${file('assets/favicon.svg')}" style="width:${size}px;height:${size}px;display:block"></body>`);
    await p.goto('file://' + tmpIcon);
    fs.unlinkSync(tmpIcon);
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(root, out), omitBackground: size === 32 });
    await p.close();
  }

  await browser.close();
  console.log('ok: og-image.png, favicon-32.png, apple-touch-icon.png, icon-512.png');
})();
