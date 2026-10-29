/* ============================================================
   SAMUELS BARBER — script.js
   Vanilla JS: scroll reveals, navbar state, live open/closed
   chip, today-highlight, dynamic star ratings.
   ============================================================ */

/* ---------- 1. Star ratings (build SVG stars from data-score) ---------- */
(function buildStars() {
  const STAR = '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 1.6l2.6 5.3 5.8.9-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.6 7.8l5.8-.9z"/></svg>';
  const FIVE = STAR.repeat(5);

  document.querySelectorAll('.stars[data-score]').forEach(el => {
    const score = parseFloat(el.dataset.score) || 0;
    const pct = Math.max(0, Math.min(100, (score / 5) * 100));
    el.style.setProperty('--fill', pct + '%');
    el.innerHTML = FIVE + '<span class="fill">' + FIVE + '</span>';
  });
})();

/* ---------- 2. Navbar shadow + active link on scroll ---------- */
const nav = document.getElementById('mainNav');
const navLinks = [...document.querySelectorAll('#mainNav .nav-link')];
const sectionIds = ['home', 'about', 'services', 'reviews', 'contact'];

function onScrollNav() {
  nav.classList.toggle('scrolled', window.scrollY > 24);
}
window.addEventListener('scroll', onScrollNav, { passive: true });
onScrollNav();

const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    navLinks.forEach(l =>
      l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id)
    );
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sectionIds.forEach(id => {
  const s = document.getElementById(id);
  if (s) spy.observe(s);
});

/* Close mobile menu after tapping a link */
const collapseEl = document.getElementById('navMenu');
navLinks.forEach(l => l.addEventListener('click', () => {
  if (collapseEl.classList.contains('show')) {
    bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false }).hide();
  }
}));

/* ---------- 3. Scroll reveal animations ---------- */
const revealIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealIO.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

document.querySelectorAll('.reveal').forEach(el => revealIO.observe(el));

/* ---------- 4. Live "Open now / Closed" chip + today highlight ---------- */
(function openingHours() {
  const table = document.getElementById('hoursTable');
  const chip = document.getElementById('openChip');
  if (!table || !chip) return;

  // London time (barbershop's local time, regardless of visitor's timezone)
  const now = new Date(new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' }));
  const jsDay = now.getDay(); // 0 = Sunday … 6 = Saturday
  const minsNow = now.getHours() * 60 + now.getMinutes();

  const rows = [...table.querySelectorAll('tr')];
  const parse = v => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };
  const fmt = mins => {
    let h = Math.floor(mins / 60), m = mins % 60;
    const ap = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return h + (m ? ':' + String(m).padStart(2, '0') : '') + ' ' + ap;
  };

  const todayRow = rows.find(r => +r.dataset.day === jsDay);

  // Highlight today's row
  if (todayRow) todayRow.classList.add('today');

  if (!todayRow || !todayRow.dataset.open) {
    chip.textContent = 'Closed today';
    chip.classList.add('is-closed');
    return;
  }

  const open = parse(todayRow.dataset.open);
  const close = parse(todayRow.dataset.close);

  if (minsNow >= open && minsNow < close) {
    chip.textContent = 'Open now · closes ' + fmt(close);
    chip.classList.add('is-open');
  } else if (minsNow < open) {
    chip.textContent = 'Closed · opens ' + fmt(open);
    chip.classList.add('is-closed');
  } else {
    // After closing — find next opening day
    let label = 'Closed';
    for (let i = 1; i <= 7; i++) {
      const nextRow = rows.find(r => +r.dataset.day === (jsDay + i) % 7);
      if (nextRow && nextRow.dataset.open) {
        label = i === 1
          ? 'Closed · opens ' + fmt(parse(nextRow.dataset.open)) + ' tomorrow'
          : 'Closed · opens ' + nextRow.cells[0].textContent.slice(0, 3) + ' ' + fmt(parse(nextRow.dataset.open));
        break;
      }
    }
    chip.textContent = label;
    chip.classList.add('is-closed');
  }
})();

/* ---------- 5. Booking form ---------- */
(function bookingForm() {
  const form = document.getElementById('bookForm');
  const success = document.getElementById('bookSuccess');
  if (!form || !success) return;

  const nameI = document.getElementById('bName');
  const serviceI = document.getElementById('bService');
  const dateI = document.getElementById('bDate');
  const timeI = document.getElementById('bTime');
  const notesI = document.getElementById('bNotes');

  // Never allow past dates
  (function setMinDate() {
    const d = new Date();
    const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    dateI.min = iso;
  })();

  // "Book this cut" links pre-select the matching service in the form
  document.querySelectorAll('.book-link').forEach(link => {
    link.addEventListener('click', () => {
      if (link.dataset.service) {
        serviceI.value = link.dataset.service;
        serviceI.classList.remove('is-invalid');
      }
    });
  });

  function fmtDate(v) {
    try {
      return new Date(v + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch (e) { return v; }
  }

  form.addEventListener('submit', ev => {
    ev.preventDefault();
    if (!form.checkValidity()) {
      ev.stopPropagation();
      form.classList.add('was-validated');
      return;
    }

    const first = nameI.value.trim().split(' ')[0] || 'there';
    document.getElementById('bsName').textContent = first;
    document.getElementById('bsSum').textContent =
      serviceI.value + ' · ' + fmtDate(dateI.value) + ' · ' + timeI.value;

    // Swap form for the confirmation panel
    form.classList.add('d-none');
    success.classList.remove('d-none');
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  document.getElementById('bookAgain').addEventListener('click', () => {
    form.reset();
    notesI.value = '';
    form.classList.remove('was-validated', 'd-none');
    success.classList.add('d-none');
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();

/* ---------- 6. Footer year ---------- */
document.getElementById('year').textContent = new Date().getFullYear();
