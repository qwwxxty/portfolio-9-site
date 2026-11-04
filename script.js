/* СТО «Ключ на 10» — поведінка сторінки. Без залежностей. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;

  /* ---------- 1. Бирки й ключі гойдаються на гачках (єдина анімація) ---------- */
  const swingers = $$('.swing');

  swingers.forEach((el) => {
    el.addEventListener('animationend', (e) => {
      if (e.animationName === 'hang') el.classList.add('is-settled');
    });
  });

  if (!reduceMotion && hasIO) {
    const io = new IntersectionObserver((entries) => {
      entries
        .filter((e) => e.isIntersecting)
        .forEach((e, k) => {
          // елементи, що з'явилися разом, хитаються з невеликим зсувом
          e.target.style.animationDelay = `${k * 75}ms`;
          e.target.classList.add('is-hung');
          io.unobserve(e.target);
        });
    }, { threshold: 0.2 });
    swingers.forEach((el) => io.observe(el));
  } else {
    swingers.forEach((el) => el.classList.add('is-hung', 'is-settled'));
  }

  /* ---------- 2. Відчинено / зачинено за київським часом ---------- */
  // хвилини від півночі: [відкриття, закриття]; null — вихідний. 0 = неділя
  const SCHEDULE = {
    0: null,
    1: [510, 1140], 2: [510, 1140], 3: [510, 1140], 4: [510, 1140], 5: [510, 1140],
    6: [540, 960],
  };
  const DAY_ACC = ['у неділю', 'у понеділок', 'у вівторок', 'у середу', 'у четвер', 'у п’ятницю', 'у суботу'];
  const hhmm = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

  function kyivNow() {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Kyiv', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
      }).formatToParts(new Date());
      const get = (type) => parts.find((p) => p.type === type).value;
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
      return { day, min: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
    } catch (err) {
      const d = new Date();
      return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function statusText({ day, min }) {
    const today = SCHEDULE[day];
    if (today && min >= today[0] && min < today[1]) {
      const left = today[1] - min;
      return {
        open: true,
        text: left <= 60
          ? `Відчинено ще до ${hhmm(today[1])}, встигніть подзвонити`
          : `Зараз відчинено, працюємо до ${hhmm(today[1])}`,
      };
    }
    if (today && min < today[0]) {
      return { open: false, text: `Зачинено. Відчинимо сьогодні о ${hhmm(today[0])}` };
    }
    for (let i = 1; i <= 7; i += 1) {
      const d = (day + i) % 7;
      if (SCHEDULE[d]) {
        const when = i === 1 ? 'завтра' : DAY_ACC[d];
        return { open: false, text: `Зачинено. Відчинимо ${when} о ${hhmm(SCHEDULE[d][0])}, а заявки приймаємо цілодобово` };
      }
    }
    return { open: false, text: '' };
  }

  const now = kyivNow();
  const statusEl = $('[data-status]');
  if (statusEl) {
    const s = statusText(now);
    if (s.text) {
      $('.status__text', statusEl).textContent = s.text;
      statusEl.classList.toggle('is-open', s.open);
    }
  }

  // сьогоднішній рядок у табличці з годинами
  $$('.hours__row[data-days]').forEach((row) => {
    const days = row.dataset.days.split(',').map(Number);
    if (days.includes(now.day)) row.classList.add('is-today');
  });

  /* ---------- 3. Кнопка на бирці підставляє послугу у форму ---------- */
  const serviceSelect = $('#f-service');
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-service]');
    if (!link || !serviceSelect) return;
    const wanted = link.dataset.service;
    const option = Array.from(serviceSelect.options).find((o) => o.text === wanted);
    if (option) serviceSelect.value = option.value;
  });

  /* ---------- 4. Форма запису ---------- */
  // 'formspree' — стандартно; 'netlify' — якщо сайт на Netlify з Netlify Forms (див. README)
  const FORM_MODE = 'formspree';

  const form = $('[data-form]');
  if (form) {
    const result = $('[data-form-result]', form);
    const phone = $('#f-phone', form);
    const phoneErr = $('#f-phone-err', form);
    const date = $('#f-date', form);
    const submit = $('[type="submit"]', form);

    // не можна вибрати вчорашній день
    if (date) {
      const t = new Date();
      date.min = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    }

    const phoneOk = () => phone.value.replace(/\D/g, '').length >= 10;
    const showPhoneError = (on) => {
      phone.setAttribute('aria-invalid', on ? 'true' : 'false');
      phoneErr.hidden = !on;
    };
    phone.addEventListener('input', () => {
      if (phone.getAttribute('aria-invalid') === 'true' && phoneOk()) showPhoneError(false);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      result.textContent = '';

      if (!phoneOk()) {
        showPhoneError(true);
        phone.focus();
        return;
      }
      showPhoneError(false);

      const action = form.getAttribute('action') || '';
      if (FORM_MODE === 'formspree' && action.includes('YOUR_FORM_ID')) {
        result.textContent = 'Це демо-сайт, тому заявку нікуди не надіслано. Щоб заявки приходили на пошту, підключіть Formspree за інструкцією в README.';
        return;
      }

      const label = submit.textContent;
      submit.disabled = true;
      submit.textContent = 'Надсилаємо…';

      try {
        const data = new FormData(form);
        let res;
        if (FORM_MODE === 'netlify') {
          data.append('form-name', form.getAttribute('name') || 'zapys');
          res = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data).toString(),
          });
        } else {
          res = await fetch(action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        }
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        result.textContent = 'Дякуємо! Заявку прийнято. Передзвонимо протягом 15 хвилин у робочий час.';
      } catch (err) {
        result.textContent = 'Не вдалося надіслати заявку. Подзвоніть нам: 066 000 10 10, так навіть швидше.';
      } finally {
        submit.disabled = false;
        submit.textContent = label;
      }
    });
  }

  /* ---------- 5. Панель дій на телефоні ---------- */
  const bar = $('[data-action-bar]');
  const heroActions = $('.hero__actions');
  const booking = $('#zapys');
  if (bar) {
    const setBar = (show) => {
      bar.classList.toggle('is-visible', show);
      bar.inert = !show;
      if (!show) bar.setAttribute('aria-hidden', 'true'); else bar.removeAttribute('aria-hidden');
    };
    if (hasIO && heroActions && booking) {
      let heroSeen = true;
      let bookingSeen = false;
      const update = () => setBar(!heroSeen && !bookingSeen);
      new IntersectionObserver(([e]) => { heroSeen = e.isIntersecting; update(); }).observe(heroActions);
      new IntersectionObserver(([e]) => { bookingSeen = e.isIntersecting; update(); }, { threshold: 0.05 }).observe(booking);
    } else {
      setBar(true);
    }
  }

  /* ---------- 6. Рік у підвалі ---------- */
  const year = $('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
