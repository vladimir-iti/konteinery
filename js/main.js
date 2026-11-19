'use strict';

/*
 * КОНТАКТЫ — единственное место, где их нужно менять.
 * Скрипт подставляет их во все элементы с атрибутом data-c="…".
 * В index.html те же значения прописаны как запасные (на случай отключённого JS)
 * и для поисковиков — при смене контактов обновите и их (поиск-замена).
 */
const CONTACTS = {
  phone: '+7 (904) 349-27-14',
  phone2: '+7 (929) 819-83-22',
  email: 'info.skb@inbox.ru',
  city: 'г. Ростов-на-Дону',
  street: 'ул. Каширская, зд.\u00a05',   // в подвале — отдельной строкой
  addressShort: 'Ростов-на-Дону, ул. Каширская, 5',
  hours: 'Пн–Пт, 9:00–18:00',
  whatsapp: '79043492714',              // номер для wa.me, только цифры
  telegram: 'https://t.me/+79043492714',
  max: 'https://max.ru/u/f9LHodD0cOLu1gW3ZUstR_G8hhGto0_pODiQZXsS0OgMW8wv7iFQY60tKe8',
};

// полный адрес — для блока «Связаться»
CONTACTS.address = `${CONTACTS.city}, ${CONTACTS.street}`;

// ID счётчика Яндекс.Метрики. Пока 0 — цели не отправляются.
const METRIKA_ID = 0;

const tel = (p) => 'tel:+' + p.replace(/\D/g, '').replace(/^8/, '7');
const wa = () => `https://wa.me/${CONTACTS.whatsapp}`;

/* ---------- Подстановка контактов ---------- */
function fillContacts() {
  document.querySelectorAll('[data-c]').forEach((el) => {
    const key = el.dataset.c;
    const value = CONTACTS[key];
    if (!value) return;
    const isLink = el.tagName === 'A';
    // текст внутри ссылки: последний <span> или <b>, иначе — сам элемент без иконок
    const textNode = el.querySelector('b') || el.querySelector('span:last-child');
    switch (key) {
      case 'phone':
      case 'phone2':
        if (isLink) el.href = tel(value);
        if (textNode) textNode.textContent = value;
        else if (isLink && !el.querySelector('svg') && /\d/.test(el.textContent)) el.textContent = value;
        break;
      case 'email':
        if (isLink) el.href = 'mailto:' + value;
        if (textNode) textNode.textContent = value;
        else if (!el.querySelector('svg')) el.textContent = value;
        break;
      case 'whatsapp':
        if (isLink) el.href = wa();
        break;
      case 'telegram':
      case 'max':
        if (isLink) el.href = value;
        break;
      default:
        el.textContent = value;
    }
  });
}

/* ---------- Цели Метрики ---------- */
function goal(name) {
  if (METRIKA_ID && typeof window.ym === 'function') window.ym(METRIKA_ID, 'reachGoal', name);
}
function trackClicks() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const h = a.getAttribute('href');
    if (h.startsWith('tel:')) goal('click_phone');
    else if (h.startsWith('mailto:')) goal('click_email');
    else if (h.includes('wa.me')) goal('click_whatsapp');
    else if (h.includes('t.me')) goal('click_telegram');
    else if (h.includes('max.ru')) goal('click_max');
  });
}

/* ---------- Окно «Как вам удобнее связаться?» ---------- */
function setupAsk() {
  const dlg = document.getElementById('ask');
  if (!dlg) return;
  const $ = (id) => document.getElementById(id);

  function open() {
    $('ask-phone').href = tel(CONTACTS.phone);
    $('ask-phone').querySelector('small').textContent = CONTACTS.phone;
    $('ask-wa').href = wa();
    $('ask-tg').href = CONTACTS.telegram;
    $('ask-max').href = CONTACTS.max;
    $('ask-mail').href = `mailto:${CONTACTS.email}`;
    $('ask-mail').querySelector('small').textContent = CONTACTS.email;
    dlg.showModal();
    goal('open_contact_dialog');
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ask]');
    if (btn) open();
  });

  // после перехода в мессенджер или звонка окно закрываем
  dlg.querySelectorAll('.ask__item').forEach((a) => a.addEventListener('click', () => setTimeout(() => dlg.close(), 300)));
}

/* ---------- Закрытие окон: крестик и клик по фону ---------- */
function setupDialogs() {
  document.querySelectorAll('dialog').forEach((dlg) => {
    dlg.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) return dlg.close();
      const r = dlg.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside && e.clientX !== 0) dlg.close();
    });
  });
}

/* ---------- Галереи направлений и просмотр фото ----------
 * Листать можно стрелками, миниатюрами, свайпом (телефон) и клавишами ←/→
 * в окне просмотра. Окно просмотра листает ту галерею, из которой открыто. */
function onSwipe(el, cb) {
  let x0 = null, y0 = null;
  el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  el.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) cb(dx < 0 ? 1 : -1);
  });
}

function setupGalleries() {
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbCount = document.getElementById('lightbox-count');
  let current = null; // галерея, открытая в окне просмотра

  const galleries = [...document.querySelectorAll('[data-gallery]')].map((g) => {
    const main = g.querySelector('.dir__main img');
    const thumbs = [...g.querySelectorAll('.dir__thumbs button')];
    const count = g.querySelector('.gal-count');
    const srcs = thumbs.map((t) => t.dataset.src);
    const gal = { i: 0, srcs, alt: main.alt };

    gal.show = (i) => {
      gal.i = (i + srcs.length) % srcs.length;
      main.src = srcs[gal.i];
      thumbs.forEach((t, k) => t.classList.toggle('is-active', k === gal.i));
      count.textContent = `${gal.i + 1} / ${srcs.length}`;
      if (current === gal) syncLightbox();
    };
    gal.step = (d) => gal.show(gal.i + d);

    thumbs.forEach((t, k) => t.addEventListener('click', () => gal.show(k)));
    g.querySelector('[data-prev]').addEventListener('click', () => gal.step(-1));
    g.querySelector('[data-next]').addEventListener('click', () => gal.step(1));
    onSwipe(g.querySelector('.dir__stage'), gal.step);
    g.querySelector('[data-zoom]').addEventListener('click', () => {
      current = gal;
      syncLightbox();
      lb.showModal();
    });
    gal.show(0);
    return gal;
  });

  function syncLightbox() {
    lbImg.src = current.srcs[current.i];
    lbImg.alt = current.alt;
    lbCount.textContent = `${current.i + 1} / ${current.srcs.length}`;
  }

  if (!galleries.length) return;
  lb.querySelector('[data-lb-prev]').addEventListener('click', () => current.step(-1));
  lb.querySelector('[data-lb-next]').addEventListener('click', () => current.step(1));
  onSwipe(lb, (d) => current.step(d));
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') current.step(-1);
    if (e.key === 'ArrowRight') current.step(1);
  });
}

/* ---------- Вкладки ---------- */
function setupTabs() {
  document.querySelectorAll('[data-tabs]').forEach((box) => {
    const tabs = [...box.querySelectorAll('[role="tab"]')];
    const select = (tab) => tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    tabs.forEach((t, i) => {
      t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        const next = tabs[(i + d + tabs.length) % tabs.length];
        select(next); next.focus();
      });
    });
  });
}

/* ---------- Мобильное меню ---------- */
function setupMenu() {
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('nav');
  if (!burger || !nav) return;
  const set = (open) => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  };
  burger.addEventListener('click', () => set(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
}

/* ---------- Шапка: прячется при прокрутке вниз, появляется при прокрутке вверх ---------- */
function setupHeaderHide() {
  const header = document.querySelector('.header');
  const nav = document.getElementById('nav');
  if (!header) return;
  let lastY = scrollY;
  const update = () => {
    const y = scrollY;
    const dy = y - lastY;
    if (y <= header.offsetHeight || nav.classList.contains('is-open')) header.classList.remove('is-hidden');
    else if (dy > 6) header.classList.add('is-hidden');
    else if (dy < -6) header.classList.remove('is-hidden');
    if (Math.abs(dy) > 6 || y <= header.offsetHeight) lastY = y;
  };
  addEventListener('scroll', update, { passive: true });
  // фокус с клавиатуры внутри шапки — показываем её
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
}

fillContacts();
setupHeaderHide();
trackClicks();
setupAsk();
setupDialogs();
setupGalleries();
setupTabs();
setupMenu();
document.getElementById('year').textContent = new Date().getFullYear();
