/* ══════════════════════════════════════
   FRAMEIM STUDIOS — GLOBAL JS
   ══════════════════════════════════════ */

/* ─ REPLACE THIS with your deployed Google Apps Script Web App URL ─
   How to deploy:
   1. Open Google Sheets → Extensions → Apps Script
   2. Paste the code from google-apps-script.js
   3. Deploy → New deployment → Web app → Anyone
   4. Copy the URL and paste it below
*/
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzLRTXhwajmDfceJrm4gBfv99jv8giHYONf7JBZUJ0Royis5vXvlQtoy3YJx3Ja9Cnq/exec';

/* ─ REPLACE with your Calendly URL ─ */
const CALENDLY_URL = 'https://calendly.com/il-frameim/30min';

/* ══════════════════════════════════════
   CUSTOM CURSOR
   ══════════════════════════════════════ */
function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });

  document.querySelectorAll('a, button, [role="button"]').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('big'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
  });
}

/* ══════════════════════════════════════
   ACCESSIBILITY WIDGET
   ══════════════════════════════════════ */
const A11Y_PREFS_KEY = 'frameim_a11y';

const A11Y_OPTIONS = [
  { id: 'text-lg',       label: 'הגדלת טקסט',              class: 'text-lg' },
  { id: 'hc-mode',       label: 'ניגודיות גבוהה',           class: 'hc-mode' },
  { id: 'dyslexia-font', label: 'גופן קריא לדיסלקציה',     class: 'dyslexia-font' },
  { id: 'hl-links',      label: 'הדגשת קישורים',            class: 'hl-links' },
  { id: 'no-anim',       label: 'עצירת אנימציות',           class: 'no-anim' },
  { id: 'gs-mode',       label: 'מצב גווני אפור',           class: 'gs-mode' },
];

function initA11y() {
  const btn  = document.getElementById('a11y-btn');
  const menu = document.getElementById('a11y-menu');
  if (!btn || !menu) return;

  // Load saved preferences
  const saved = JSON.parse(localStorage.getItem(A11Y_PREFS_KEY) || '{}');

  // Build menu
  menu.innerHTML = `<div class="a11y-menu-title">נגישות</div>`;
  A11Y_OPTIONS.forEach(opt => {
    const active = saved[opt.id] ? 'active' : '';
    if (saved[opt.id]) document.body.classList.add(opt.class);

    const row = document.createElement('div');
    row.className = `a11y-option ${active}`;
    row.dataset.id = opt.id;
    row.innerHTML = `<span>${opt.label}</span><div class="a11y-toggle"></div>`;

    row.addEventListener('click', () => {
      const isActive = row.classList.toggle('active');
      document.body.classList.toggle(opt.class, isActive);

      const prefs = JSON.parse(localStorage.getItem(A11Y_PREFS_KEY) || '{}');
      prefs[opt.id] = isActive;
      localStorage.setItem(A11Y_PREFS_KEY, JSON.stringify(prefs));
    });

    menu.appendChild(row);
  });

  // Toggle menu
  btn.addEventListener('click', e => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });

  document.addEventListener('click', () => menu.classList.remove('open'));
  menu.addEventListener('click', e => e.stopPropagation());
}

/* ══════════════════════════════════════
   COOKIE BANNER
   ══════════════════════════════════════ */
function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;
  if (localStorage.getItem('frameim_cookies')) {
    banner.style.display = 'none';
    return;
  }

  document.getElementById('cookie-accept')?.addEventListener('click', () => {
    localStorage.setItem('frameim_cookies', '1');
    banner.style.display = 'none';
  });

  document.getElementById('cookie-decline')?.addEventListener('click', () => {
    localStorage.setItem('frameim_cookies', '0');
    banner.style.display = 'none';
  });
}

/* ══════════════════════════════════════
   LEAD FORM HANDLER
   ══════════════════════════════════════ */
function initLeadForm(formEl) {
  if (!formEl) return;

  formEl.addEventListener('submit', async e => {
    e.preventDefault();

    const msgEl  = formEl.querySelector('.form-message');
    const submitBtn = formEl.querySelector('.form-submit');

    // Honeypot check
    if (formEl.querySelector('.honey')?.value) return;

    const name  = formEl.querySelector('[name="name"]')?.value.trim();
    const phone = formEl.querySelector('[name="phone"]')?.value.trim();
    const email = formEl.querySelector('[name="email"]')?.value.trim();
    const source = formEl.dataset.source || 'unknown';

    // Validation
    if (!name || !phone || !email) {
      showMsg(msgEl, 'יש למלא את כל השדות', 'error');
      return;
    }

    if (!isValidPhone(phone)) {
      showMsg(msgEl, 'מספר טלפון לא תקין', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showMsg(msgEl, 'כתובת מייל לא תקינה', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'שולח...';

    const payload = new FormData();
    payload.append('name',   name);
    payload.append('phone',  phone);
    payload.append('email',  email);
    payload.append('source', source);
    payload.append('date',   new Date().toLocaleString('he-IL'));

    try {
      const res = await fetch(SCRIPT_URL, { method: 'POST', body: payload });
      const data = await res.json();

      if (data.result === 'success') {
        sessionStorage.setItem('frameim_lead_email', email); // save for Calendly listener
        formEl.reset();
        showMsg(msgEl, 'פרטייך התקבלו! מעביר אותך לדף הקביעת פגישה…', 'success');
        setTimeout(() => {
          window.location.href = `booking.html?source=${source}&email=${encodeURIComponent(email)}`;
        }, 1400);
      } else {
        throw new Error('server error');
      }
    } catch {
      showMsg(msgEl, 'משהו השתבש, נסה שוב', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'שלח פרטים';
    }
  });
}

function showMsg(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className = `form-message ${type}`;
}

function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function isValidPhone(p) { return /^[0-9+\-()\s]{7,15}$/.test(p); }

/* ══════════════════════════════════════
   GLOBAL FORM HTML TEMPLATE
   (injected into every .lead-form-container)
   ══════════════════════════════════════ */
function injectForms() {
  document.querySelectorAll('.lead-form-container').forEach(container => {
    const source = container.dataset.source || 'unknown';

    container.innerHTML = `
      <form class="lead-form" data-source="${source}" novalidate>
        <input class="honey" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
        <div class="form-row">
          <input type="text" name="name" placeholder="שם מלא" autocomplete="name" required />
        </div>
        <div class="form-row">
          <input type="tel" name="phone" placeholder="טלפון" autocomplete="tel" required />
        </div>
        <div class="form-row">
          <input type="email" name="email" placeholder="מייל" autocomplete="email" required />
        </div>
        <button type="submit" class="form-submit">שלח פרטים ←</button>
        <p class="form-message" aria-live="polite"></p>
      </form>
    `;

    initLeadForm(container.querySelector('.lead-form'));
  });
}

/* ══════════════════════════════════════
   CALENDLY BOOKING LISTENER
   Updates Google Sheets when a meeting is booked
   ══════════════════════════════════════ */
function initCalendlyListener() {
  window.addEventListener('message', async e => {
    if (e.data?.event === 'calendly.event_scheduled') {
      const calendlyPayload = e.data.payload || {};
      const invitee  = calendlyPayload.invitee || {};
      const event    = calendlyPayload.event   || {};

      // email: prefer what was stored at form submit, fallback to Calendly invitee email
      const email    = sessionStorage.getItem('frameim_lead_email') || invitee.email || '';
      const datetime = event.start_time || '';

      const payload = new FormData();
      payload.append('action',         'update_booking');
      payload.append('email',          email);
      payload.append('meeting_booked', 'כן');
      payload.append('meeting_date',   datetime ? new Date(datetime).toLocaleString('he-IL') : '');

      try {
        // no-cors so the request always reaches Apps Script regardless of redirect headers
        await fetch(SCRIPT_URL, { method: 'POST', body: payload, mode: 'no-cors' });
      } catch {
        // silent — main lead was already captured
      }

      sessionStorage.removeItem('frameim_lead_email');

      // Redirect to thank-you
      setTimeout(() => {
        window.location.href = 'thank-you.html?booked=1';
      }, 1000);
    }
  });
}

/* ══════════════════════════════════════
   MOBILE NAV
   ══════════════════════════════════════ */
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  const closeBtn  = document.getElementById('mobile-nav-close');
  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', () => mobileNav.classList.add('open'));
  closeBtn?.addEventListener('click', () => mobileNav.classList.remove('open'));
  mobileNav.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => mobileNav.classList.remove('open'))
  );
}

/* ══════════════════════════════════════
   SCROLL ANIMATIONS
   ══════════════════════════════════════ */
function initScrollAnim() {
  // ── 1. Split [data-split] headlines into word spans ──
  document.querySelectorAll('[data-split]').forEach(el => {
    // Preserve <br> tags, split everything else into word spans
    const raw = el.innerHTML;
    const tokens = raw.split(/(<br\s*\/?>)/gi);
    el.innerHTML = tokens.map(token => {
      if (/^<br/i.test(token)) return token;
      return token.split(/\s+/).filter(Boolean).map(word =>
        `<span class="word-outer"><span class="word-inner">${word}</span></span>`
      ).join(' ');
    }).join('');
  });

  // ── 2. Observer for plain [data-reveal] elements ──
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = parseInt(el.dataset.delay || '0');
      setTimeout(() => el.classList.add('is-visible'), delay);
      revealObs.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  // ── 3. Observer for [data-split] — stagger each word ──
  const splitObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const base = parseInt(el.dataset.delay || '0');
      el.querySelectorAll('.word-inner').forEach((w, i) => {
        w.style.transitionDelay = (base + i * 75) + 'ms';
        w.style.transform = 'translateY(0)';
      });
      splitObs.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

  // ── 4. Observer for [data-stagger] — stagger children ──
  const staggerObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const ms = parseInt(entry.target.dataset.stagger || '100');
      entry.target.querySelectorAll('[data-reveal]').forEach((child, i) => {
        setTimeout(() => child.classList.add('is-visible'), i * ms);
      });
      staggerObs.unobserve(entry.target);
    });
  }, { threshold: 0.08 });

  // Observe — skip stagger-children in revealObs (handled by staggerObs)
  document.querySelectorAll('[data-reveal]').forEach(el => {
    if (!el.closest('[data-stagger]')) revealObs.observe(el);
  });
  document.querySelectorAll('[data-split]').forEach(el => splitObs.observe(el));
  document.querySelectorAll('[data-stagger]').forEach(el => staggerObs.observe(el));
}

/* ══════════════════════════════════════
   INIT
   ══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initA11y();
  initCookieBanner();
  injectForms();
  initCalendlyListener();
  initMobileNav();
  initScrollAnim();
});
