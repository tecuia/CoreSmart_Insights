// Три набора данных для дашборда «Общие показатели» — переключаются фильтрами
const DATASETS = [
  {
    visits:      { plan: 17857, fact: 21945 },
    reads:       { plan: 6694,  fact: 7003  },
    transitions: { plan: 6427,  fact: 6452  },
    budget:      { value: 500000, percent: 100, tag: '↑ 100% плана' },
    cpv:         { value: 22.78, tag: '↓ −18,6% экономия' },
    cpaReads:    { value: 71.40, markerX: 100, tag: 'В рамках бюджета' },
    cpaTrans:    { value: 77.50, markerX: 100, tag: 'В рамках бюджета' },
  },
  {
    visits:      { plan: 17857, fact: 20300 },
    reads:       { plan: 6694,  fact: 7240  },
    transitions: { plan: 6427,  fact: 5940  },
    budget:      { value: 490000, percent: 98, tag: '↑ 98% плана' },
    cpv:         { value: 24.50, tag: '↓ −12,5% экономия' },
    cpaReads:    { value: 68.20, markerX: 88, tag: 'В рамках бюджета' },
    cpaTrans:    { value: 72.80, markerX: 90, tag: 'В рамках бюджета' },
  },
  {
    visits:      { plan: 17857, fact: 22400 },
    reads:       { plan: 6694,  fact: 8120  },
    transitions: { plan: 6427,  fact: 7850  },
    budget:      { value: 480000, percent: 96, tag: '↑ 96% плана' },
    cpv:         { value: 18.45, tag: '↓ −34,1% экономия' },
    cpaReads:    { value: 52.30, markerX: 65, tag: 'В рамках бюджета' },
    cpaTrans:    { value: 58.60, markerX: 70, tag: 'В рамках бюджета' },
  },
];

// Форматирование чисел и процентов в русской локали
const formatInt     = (n) => Math.round(n).toLocaleString('ru-RU').replace(/\u00A0/g, ' ');
const formatDec     = (n, d = 2) => n.toFixed(d).replace('.', ',');
const formatMoney   = (n, d = 2) => `${formatDec(n, d)} ₽`;
const formatPercent = (n, d = 1) => `${formatDec(n, d)}%`;

const achievement = (d) => (d.fact / d.plan) * 100;

const tagClass = (percent) => {
  if (percent >= 100) return 'metric-card__tag--success';
  if (percent >= 90)  return 'metric-card__tag--warning';
  return 'metric-card__tag--danger';
};

// Текущее состояние дашборда — стартует с первого набора данных
const state = structuredClone(DATASETS[0]);

// Анимирует число от from к to; предыдущий твин на этом элементе убивается
function animateNumber(el, from, to, formatter, duration = 0.8) {
  if (!el) return;

  if (el._numTween) el._numTween.kill();
  if (Math.abs(from - to) < 0.001) {
    el.textContent = formatter(to);
    return;
  }

  const proxy = { val: from };
  el._numTween = gsap.to(proxy, {
    val: to,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      el.textContent = formatter(proxy.val);
    },
  });
}

// Хелпер для SVG-твинов: убивает предыдущий твин на элементе
function tweenFromTo(el, fromVars, toVars) {
  if (el._tween) el._tween.kill();
  el._tween = gsap.fromTo(el, fromVars, toVars);
}

// Предрасчёт длин SVG-путей для анимации stroke-dashoffset
function measureArcs() {
  document.querySelectorAll('.chart-gauge__arc').forEach((arc) => {
    const len = arc.getTotalLength();
    arc.style.strokeDasharray = len;
    arc.style.strokeDashoffset = 0;
    arc.dataset.len = len;
  });

  const cpvPath = document.querySelector('[data-card="cpv"] .chart-area path[stroke]');
  if (cpvPath) {
    const len = cpvPath.getTotalLength();
    cpvPath.style.strokeDasharray = len;
    cpvPath.style.strokeDashoffset = 0;
    cpvPath.dataset.len = len;
  }
}

function updateVisitsCard(data) {
  const card = document.querySelector('[data-card="visits"]');
  const tag = card.querySelector('.metric-card__tag');
  const plan = card.querySelector('.metric-card__plan');
  const value = card.querySelector('.metric-card__value');
  const factBar = card.querySelector('.chart-bars__bar--fact');

  const prev = state.visits;
  const percent = achievement(data);
  const prevBar = (prev.fact / prev.plan) * 100;
  const newBar = Math.min(percent, 130);

  animateNumber(value, prev.fact, data.fact, formatInt);
  plan.textContent = `План: ${formatInt(data.plan)}`;
  tag.textContent = `Выполнение: ${formatPercent(percent)}`;
  tag.className = `metric-card__tag ${tagClass(percent)}`;

  tweenFromTo(factBar,
    { height: `${prevBar}px` },
    { height: `${newBar}px`, duration: 0.9, ease: 'power2.out' }
  );

  state.visits = { plan: data.plan, fact: data.fact };
}

function updateReadsCard(data) {
  const card = document.querySelector('[data-card="reads"]');
  const tag = card.querySelector('.metric-card__tag');
  const plan = card.querySelector('.metric-card__plan');
  const value = card.querySelector('.metric-card__value');
  const marker = card.querySelector('.chart-progress__marker');
  const percentLabel = card.querySelector('.chart-progress__value');

  const prev = state.reads;
  const percent = achievement(data);
  const prevPercent = achievement(prev);

  const prevMarkerPos = Math.min(100, (prev.plan / prev.fact) * 100);
  const newMarkerPos = Math.min(100, (data.plan / data.fact) * 100);

  animateNumber(value, prev.fact, data.fact, formatInt);
  plan.textContent = `План: ${formatInt(data.plan)}`;
  tag.textContent = `Выполнение: ${formatPercent(percent)}`;
  tag.className = `metric-card__tag ${tagClass(percent)}`;

  marker.style.left = `${prevMarkerPos}%`;
  void marker.offsetWidth;
  marker.style.left = `${newMarkerPos}%`;

  animateNumber(percentLabel, prevPercent, percent, formatPercent);

  state.reads = { plan: data.plan, fact: data.fact };
}

function updateTransitionsCard(data) {
  const card = document.querySelector('[data-card="transitions"]');
  const tag = card.querySelector('.metric-card__tag');
  const plan = card.querySelector('.metric-card__plan');
  const value = card.querySelector('.metric-card__value');
  const arc = card.querySelector('.chart-gauge__arc');
  const label = card.querySelector('.chart-gauge__label');

  const prev = state.transitions;
  const percent = achievement(data);
  const prevPercent = achievement(prev);
  const arcLen = parseFloat(arc.dataset.len) || 172.79;

  const prevFill = Math.min(100, prevPercent);
  const newFill = Math.min(100, percent);

  animateNumber(value, prev.fact, data.fact, formatInt);
  plan.textContent = `План: ${formatInt(data.plan)}`;
  tag.textContent = `Выполнение: ${formatPercent(percent)}`;
  tag.className = `metric-card__tag ${tagClass(percent)}`;

  tweenFromTo(arc,
    { strokeDashoffset: arcLen * (1 - prevFill / 100) },
    { strokeDashoffset: arcLen * (1 - newFill / 100), duration: 1, ease: 'power2.out' }
  );

  animateNumber(label, prevFill, newFill, (v) => `${Math.round(v)}%`);

  state.transitions = { plan: data.plan, fact: data.fact };
}

function updateBudgetCard(data) {
  const card = document.querySelector('[data-card="budget"]');
  const tag = card.querySelector('.metric-card__tag');
  const value = card.querySelector('.metric-card__value');
  const arc = card.querySelector('.chart-gauge__arc');
  const label = card.querySelector('.chart-gauge__label');

  const prev = state.budget;
  const arcLen = parseFloat(arc.dataset.len) || 172.79;

  const prevFill = Math.min(100, prev.percent);
  const newFill = Math.min(100, data.percent);

  animateNumber(value, prev.value, data.value, (v) => `${formatInt(v)} ₽`);
  tag.textContent = data.tag;

  tweenFromTo(arc,
    { strokeDashoffset: arcLen * (1 - prevFill / 100) },
    { strokeDashoffset: arcLen * (1 - newFill / 100), duration: 1, ease: 'power2.out' }
  );

  animateNumber(label, prevFill, newFill, (v) => `${Math.round(v)}%`);

  state.budget = { value: data.value, percent: data.percent };
}

function updateCpvCard(data) {
  const card = document.querySelector('[data-card="cpv"]');
  const tag = card.querySelector('.metric-card__tag');
  const value = card.querySelector('.metric-card__value');
  const cpvPath = card.querySelector('.chart-area path[stroke]');

  const prev = state.cpv;

  animateNumber(value, prev.value, data.value, (v) => formatMoney(v));
  tag.textContent = data.tag;

  if (cpvPath) {
    const len = parseFloat(cpvPath.dataset.len) || cpvPath.getTotalLength();
    tweenFromTo(cpvPath,
      { strokeDashoffset: len },
      { strokeDashoffset: 0, duration: 1, ease: 'power2.out' }
    );
  }

  state.cpv = { value: data.value };
}

function updateCpaCard(cardName, data, stateKey) {
  const card = document.querySelector(`[data-card="${cardName}"]`);
  const tag = card.querySelector('.metric-card__tag');
  const value = card.querySelector('.metric-card__value');
  const line = card.querySelector('.chart-range__line');
  const dot = card.querySelector('.chart-range__dot');
  const label = card.querySelector('.chart-range__label');

  const prev = state[stateKey];

  animateNumber(value, prev.value, data.value, (v) => formatMoney(v));
  tag.textContent = data.tag;

  const proxy = { x: prev.markerX };
  if (card._cpaTween) card._cpaTween.kill();
  card._cpaTween = gsap.to(proxy, {
    x: data.markerX,
    duration: 0.9,
    ease: 'power2.out',
    onUpdate: () => {
      line.setAttribute('x1', proxy.x);
      line.setAttribute('x2', proxy.x);
      dot.setAttribute('cx', proxy.x);
      label.setAttribute('x', proxy.x);
    },
  });

  animateNumber(label, prev.value, data.value, (v) => formatDec(v, 1));

  state[stateKey] = { value: data.value, markerX: data.markerX };
}

// Синхронизирует текст цитаты с новым датасетом; вызывается до обновления state
function updateQuote(data) {
  const visitsSpan      = document.querySelector('[data-quote="visits"]');
  const readsSpan       = document.querySelector('[data-quote="reads"]');
  const transitionsSpan = document.querySelector('[data-quote="transitions"]');
  const cpvSpan         = document.querySelector('[data-quote="cpv"]');

  if (visitsSpan) {
    animateNumber(visitsSpan, achievement(state.visits), achievement(data.visits), formatPercent);
  }
  if (readsSpan) {
    animateNumber(readsSpan, achievement(state.reads), achievement(data.reads), formatPercent);
  }
  if (transitionsSpan) {
    animateNumber(transitionsSpan, achievement(state.transitions), achievement(data.transitions), formatPercent);
  }
  if (cpvSpan) {
    animateNumber(cpvSpan, state.cpv.value, data.cpv.value, (v) => formatMoney(v));
  }
}

// Переключает все карточки дашборда на набор данных по индексу фильтра
function updateDashboard(index) {
  const data = DATASETS[index];
  updateQuote(data);
  updateVisitsCard(data.visits);
  updateReadsCard(data.reads);
  updateTransitionsCard(data.transitions);
  updateBudgetCard(data.budget);
  updateCpvCard(data.cpv);
  updateCpaCard('cpa-reads', data.cpaReads, 'cpaReads');
  updateCpaCard('cpa-trans', data.cpaTrans, 'cpaTrans');
}

function initFilters() {
  const filters = document.querySelectorAll('.filter');
  filters.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) return;

      filters.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      updateDashboard(index);
    });
  });
}

function initMetricsTabs() {
  const tabs = document.querySelectorAll('.metrics-tab');
  const views = document.querySelectorAll('.metrics__view');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.classList.contains('is-active')) return;

      const view = tab.dataset.view;
      tabs.forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      views.forEach((v) => { v.hidden = v.dataset.view !== view; });
    });
  });
}

// Данные по 43 дням кампании; пики 08.07 и 28.07, провал 09–12.07
const DYNAMICS_DATA = {
  visits: [
    50, 500, 780, 400, 250, 200, 220, 280, 400, 550,
    520, 480, 420, 380, 350, 320, 350, 380, 420, 450,
    2080, 700, 250, 200, 180, 220, 280, 320, 380, 400,
    420, 440, 400, 350, 380, 450, 850, 800, 700, 800,
    1980, 1700, 200
  ],
  reads: [
    15, 150, 250, 130, 80, 70, 75, 90, 130, 180,
    170, 160, 140, 125, 115, 105, 115, 125, 140, 150,
    650, 220, 80, 65, 60, 75, 95, 110, 130, 135,
    145, 150, 140, 120, 130, 150, 290, 270, 240, 270,
    640, 560, 70
  ],
  clicks: [
    10, 130, 210, 110, 70, 60, 65, 80, 115, 160,
    150, 140, 125, 110, 100, 95, 100, 110, 125, 135,
    580, 200, 70, 55, 50, 65, 80, 95, 110, 120,
    125, 130, 120, 105, 115, 135, 250, 235, 210, 235,
    560, 490, 60
  ],
};

const DYNAMICS_KEY_POINTS = [
  { i: 2,  line: 'visits', value: 780,  color: '#00B4D8', label: '20 июня · 780',   tipX: 67,   tipY: 283 },
  { i: 20, line: 'visits', value: 2080, color: '#00B4D8', label: '8 июля · 2 080',  tipX: 719,  tipY: 106 },
  { i: 40, line: 'visits', value: 1980, color: '#00B4D8', label: '28 июля · 1 980', tipX: 1363, tipY: 120 },
  { i: 40, line: 'reads',  value: 640,  color: '#F59E0B', label: '28 июля · 740',   tipX: 1363, tipY: 302 },
  { i: 40, line: 'clicks', value: 560,  color: '#10B981', label: '28 июля · 700',   tipX: 1363, tipY: 379 },
];

// Строит SVG-график динамики по трём линиям и ключевым точкам
function renderDynamicsChart() {
  const svg = document.getElementById('dynamics-svg');
  if (!svg) return;

  const X_START = 60;
  const X_END = 1580;
  const Y_START = 100;
  const Y_END = 440;
  const Y_MAX = 2500;

  const n = DYNAMICS_DATA.visits.length;
  const step = (X_END - X_START) / (n - 1);

  const xFor = (i) => X_START + i * step;
  const yFor = (v) => Y_END - (v / Y_MAX) * (Y_END - Y_START);

  const parts = [];

  parts.push(`
    <defs>
      <linearGradient id="dyn-area-visits" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(0, 180, 216, 0.15)"/>
        <stop offset="100%" stop-color="rgba(0, 180, 216, 0)"/>
      </linearGradient>
      <filter id="dyn-shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.08)"/>
      </filter>
    </defs>
  `);

  const yTicks = [0, 500, 1000, 1500, 2000, 2500];
  yTicks.forEach((v) => {
    const y = yFor(v);
    parts.push(`<line x1="${X_START}" y1="${y}" x2="${X_END}" y2="${y}" stroke="#F5F5F7" stroke-width="1"/>`);
    const label = v === 0 ? '0' : v.toLocaleString('ru-RU').replace(/,/g, ' ');
    parts.push(`<text x="${X_START - 15}" y="${y + 4}" text-anchor="end" font-size="12" fill="#8A8A8A" font-family="Archivo, sans-serif">${label}</text>`);
  });

  const xTicks = [
    { i: 0,  label: '18.06' },
    { i: 7,  label: '25.06' },
    { i: 14, label: '02.07' },
    { i: 21, label: '09.07' },
    { i: 28, label: '16.07' },
    { i: 35, label: '23.07' },
    { i: 42, label: '30.07' },
  ];
  xTicks.forEach(({ i, label }) => {
    const x = xFor(i);
    parts.push(`<line x1="${x}" y1="${Y_START}" x2="${x}" y2="${Y_END}" stroke="#F5F5F7" stroke-width="1"/>`);
    parts.push(`<text x="${x}" y="${Y_END + 25}" text-anchor="middle" font-size="12" fill="#8A8A8A" font-family="Archivo, sans-serif">${label}</text>`);
  });

  const areaVisits =
    `M${xFor(0)},${Y_END} ` +
    DYNAMICS_DATA.visits.map((v, i) => `L${xFor(i).toFixed(1)},${yFor(v).toFixed(1)}`).join(' ') +
    ` L${xFor(n - 1)},${Y_END} Z`;
  parts.push(`<path d="${areaVisits}" fill="url(#dyn-area-visits)"/>`);

  const pathFor = (arr) =>
    arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(v).toFixed(1)}`).join(' ');

  parts.push(`<path d="${pathFor(DYNAMICS_DATA.visits)}" fill="none" stroke="#00B4D8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`);
  parts.push(`<path d="${pathFor(DYNAMICS_DATA.reads)}"  fill="none" stroke="#F59E0B" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`);
  parts.push(`<path d="${pathFor(DYNAMICS_DATA.clicks)}" fill="none" stroke="#10B981" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`);

  ['visits', 'reads', 'clicks'].forEach((key) => {
    const color = key === 'visits' ? '#00B4D8' : key === 'reads' ? '#F59E0B' : '#10B981';
    DYNAMICS_DATA[key].forEach((v, i) => {
      parts.push(`<circle cx="${xFor(i).toFixed(1)}" cy="${yFor(v).toFixed(1)}" r="2.2" fill="${color}"/>`);
    });
  });

  DYNAMICS_KEY_POINTS.forEach((p) => {
    const x = xFor(p.i);
    const y = yFor(p.value);
    parts.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${p.color}" stroke="#FFFFFF" stroke-width="2.5"/>`);

    const rectW = 132;
    const rectH = 36;
    parts.push(`<g class="dynamics-tooltip">`);
    parts.push(`<rect x="${p.tipX}" y="${p.tipY}" width="${rectW}" height="${rectH}" rx="8" fill="#FFFFFF" stroke="${p.color}" stroke-width="1.5" filter="url(#dyn-shadow)"/>`);
    parts.push(`<text x="${p.tipX + rectW / 2}" y="${p.tipY + 23}" text-anchor="middle" font-size="12" fill="${p.color}" font-family="Archivo, sans-serif">${p.label}</text>`);
    parts.push(`</g>`);
  });

  svg.innerHTML = parts.join('\n');
}

const PAGE_ORDER = [
  'home',
  'overview',
  'article-1',
  'article-2',
  'article-3',
  'bundles',
  'conclusions',
];

const PAGE_META = {
  home:         { label: 'Главная' },
  overview:     { label: 'Общие показатели' },
  'article-1':  { label: 'Статью №1' },
  'article-2':  { label: 'Статью №2' },
  'article-3':  { label: 'Статью №3' },
  bundles:      { label: 'Лучшие связки' },
  conclusions:  { label: 'Выводы' },
};

const pageLinks    = document.querySelectorAll('a[data-page]');
const pages        = document.querySelectorAll('.page[data-page]');
const navLinksMain = document.querySelectorAll(
  '.main-nav > .main-nav__link, .main-nav__item > .main-nav__link'
);
const siteHeader = document.querySelector('.site-header');
const footerPrev = document.querySelector('.site-footer__link--prev');
const footerNext = document.querySelector('.site-footer__link--next');

function getActiveNavPage(target) {
  if (target.startsWith('article-')) return 'articles';
  return target;
}

function updateNavActive(target) {
  const activeNav = getActiveNavPage(target);

  navLinksMain.forEach((l) => {
    l.classList.remove('is-active');
    l.removeAttribute('aria-current');
    if (l.dataset.page === activeNav) {
      l.classList.add('is-active');
      l.setAttribute('aria-current', 'page');
    }
  });
}

function updateFooter(currentPage) {
  const idx = PAGE_ORDER.indexOf(currentPage);

  if (idx > 0) {
    const prevPage = PAGE_ORDER[idx - 1];
    footerPrev.hidden = false;
    footerPrev.dataset.page = prevPage;
    const label = footerPrev.querySelector('.site-footer__label');
    if (label) label.textContent = `Перейти к: ${PAGE_META[prevPage].label}`;
  } else {
    footerPrev.hidden = true;
    footerPrev.dataset.page = '';
  }

  if (idx >= 0 && idx < PAGE_ORDER.length - 1) {
    const nextPage = PAGE_ORDER[idx + 1];
    footerNext.hidden = false;
    footerNext.dataset.page = nextPage;
    const label = footerNext.querySelector('.site-footer__label');
    if (label) label.textContent = `Перейти к: ${PAGE_META[nextPage].label}`;
  } else {
    footerNext.hidden = true;
    footerNext.dataset.page = '';
  }
}

function updateHeaderVisibility(currentPage) {
  if (!siteHeader) return;
  siteHeader.hidden = (currentPage === 'home');
  siteHeader.classList.toggle('site-header--overlay', currentPage === 'article-1');
}

// Показывает страницу, обновляет навигацию/футер и (опционально) пишет в историю
function showPage(target, { push = true } = {}) {
  if (!PAGE_ORDER.includes(target)) return;

  pages.forEach((p) => {
    p.hidden = p.dataset.page !== target;
  });

  updateNavActive(target);
  updateFooter(target);
  updateHeaderVisibility(target);
  window.scrollTo({ top: 0, behavior: 'auto' });

  if (push) history.pushState({ page: target }, '', `#${target}`);
}

// Читает hash из URL и открывает соответствующую страницу (или главную)
function showPageFromLocation() {
  const hash = location.hash.replace('#', '');
  const target = PAGE_ORDER.includes(hash) ? hash : 'home';
  showPage(target, { push: false });
}

// Навигация по ссылкам и дропдауну, синхронизация с URL, реакция на back/forward
function initRouting() {
  pageLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.page;
      if (!target) return;
      showPage(target);

      document.querySelectorAll('.main-nav__item--has-dropdown').forEach((item) => {
        const trigger = item.querySelector('.main-nav__link--dropdown');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    });
  });

  document.querySelectorAll('.main-nav__item--has-dropdown').forEach((item) => {
    const trigger = item.querySelector('.main-nav__link--dropdown');
    if (!trigger) return;

    item.addEventListener('mouseenter', () => trigger.setAttribute('aria-expanded', 'true'));
    item.addEventListener('mouseleave', () => trigger.setAttribute('aria-expanded', 'false'));
    item.addEventListener('focusin', () => trigger.setAttribute('aria-expanded', 'true'));
    item.addEventListener('focusout', () => {
      setTimeout(() => {
        if (!item.contains(document.activeElement)) {
          trigger.setAttribute('aria-expanded', 'false');
        }
      }, 0);
    });
  });

  window.addEventListener('popstate', showPageFromLocation);
  showPageFromLocation();
}

// Копирует карточки креативов из первой (открытой) кампании во все остальные
function cloneCreativesGrids() {
  const sourceGrid = document.querySelector('.campaign-accordion.is-open .creatives-grid');
  if (!sourceGrid) return;

  const cardsHTML = sourceGrid.innerHTML;
  document.querySelectorAll('.campaign-accordion:not(.is-open) .creatives-grid').forEach((grid) => {
    grid.innerHTML = cardsHTML;
  });
}

// Аккордеон кампаний: всегда открыт только один, синхронизируется aria-expanded
function initAccordions() {
  document.querySelectorAll('.campaign-accordion').forEach((acc) => {
    const header = acc.querySelector('.campaign-accordion__header');
    if (header) header.setAttribute('aria-expanded', String(acc.classList.contains('is-open')));
  });

  document.querySelectorAll('.campaign-accordion__header').forEach((header) => {
    header.addEventListener('click', () => {
      const accordion = header.closest('.campaign-accordion');
      const isOpen = accordion.classList.contains('is-open');

      document.querySelectorAll('.campaign-accordion').forEach((acc) => {
        acc.classList.remove('is-open');
        const h = acc.querySelector('.campaign-accordion__header');
        if (h) h.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        accordion.classList.add('is-open');
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

// Визуальная подсветка активных кнопок в тулбаре креативов
function initCreativesControls() {
  document.querySelectorAll('.creatives-sort__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.creatives-sort__btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
    });
  });

  document.querySelectorAll('.creatives-view__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.creatives-view__btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
    });
  });

  document.querySelectorAll('.creatives-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.creatives-tab').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
    });
  });
}

const CREATIVES_DATA = [
  { id: '1916527808572565916', visits: 4811, reads: 1264, transitions: 1385, crReads: 26.3, crTrans: 28.8, time: 106.6 },
  { id: '1915499154243368719', visits: 2524, reads: 1180, transitions: 1182, crReads: 46.8, crTrans: 46.8, time: 24.3 },
  { id: '17757540292',         visits: 1581, reads: 357,  transitions: 436,  crReads: 22.6, crTrans: 27.6, time: 61.4 },
  { id: '1916438787858895662', visits: 1195, reads: 176,  transitions: 179,  crReads: 14.7, crTrans: 15.0, time: 39.7 },
  { id: '1916235150574061602', visits: 1178, reads: 311,  transitions: 326,  crReads: 26.4, crTrans: 27.7, time: 45.4 },
  { id: '17757540684',         visits: 740,  reads: 223,  transitions: 251,  crReads: 30.1, crTrans: 33.9, time: 131.9 },
  { id: '17757540687',         visits: 619,  reads: 308,  transitions: 321,  crReads: 49.8, crTrans: 51.9, time: 156.3 },
  { id: '1916235150574061600', visits: 544,  reads: 162,  transitions: 170,  crReads: 29.8, crTrans: 31.3, time: 37.0 },
  { id: '17757540295',         visits: 510,  reads: 317,  transitions: 316,  crReads: 62.2, crTrans: 62.0, time: 29.8 },
  { id: '1916527808572565914', visits: 481,  reads: 52,   transitions: 55,   crReads: 10.8, crTrans: 11.4, time: 8.8 },
  { id: '17757480186',         visits: 351,  reads: 85,   transitions: 92,   crReads: 24.2, crTrans: 26.2, time: 22.5 },
  { id: '1913083552965500599', visits: 312,  reads: 167,  transitions: 166,  crReads: 53.5, crTrans: 53.2, time: null },
  { id: '1915497891522118318', visits: 288,  reads: 78,   transitions: 81,   crReads: 27.1, crTrans: 28.1, time: 24.8 },
  { id: '19130832995637944451', visits: 215, reads: 44,   transitions: 48,   crReads: 20.5, crTrans: 22.3, time: null },
  { id: '1916438787858895660', visits: 198,  reads: 31,   transitions: 33,   crReads: 15.7, crTrans: 16.7, time: 9.7 },
];

const statsState = {
  data: [...CREATIVES_DATA],
  sortKey: 'visits',
  sortDir: 'desc',
  filter: 'all',
  search: '',
  page: 1,
  limit: 15,
};

// Инициализация таблицы «Сравнение по креативам»: сортировка, фильтры, поиск, пагинация
function initStatsTable() {
  const tbody = document.getElementById('stats-tbody');
  const countEl = document.getElementById('stats-count');
  const pagesContainer = document.getElementById('stats-pages');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const searchInput = document.getElementById('stats-search');

  if (!tbody) return;

  function getFilteredAndSortedData() {
    let result = [...statsState.data];

    if (statsState.search) {
      result = result.filter(item => item.id.includes(statsState.search));
    }

    if (statsState.filter === 'gt50') {
      result = result.filter(item => item.crTrans > 50);
    } else if (statsState.filter === 'gt30') {
      result = result.filter(item => item.crTrans > 30);
    }

    result.sort((a, b) => {
      const valA = a[statsState.sortKey];
      const valB = b[statsState.sortKey];

      if (valA === null) return 1;
      if (valB === null) return -1;

      if (typeof valA === 'string') {
        return statsState.sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return statsState.sortDir === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }

  function getColorClass(value, type) {
    if (type === 'cr') {
      if (value === null) return '';
      if (value > 50) return 'text-high';
      if (value < 20) return 'text-low';
    }
    if (type === 'time') {
      if (value === null) return '';
      if (value > 60) return 'text-high';
      if (value < 10) return 'text-danger';
    }
    return '';
  }

  function renderTable() {
    const filtered = getFilteredAndSortedData();
    const total = filtered.length;

    let start = 0;
    let end = total;
    if (statsState.limit !== Infinity) {
      start = (statsState.page - 1) * statsState.limit;
      end = start + statsState.limit;
      if (start >= total && total > 0) {
        statsState.page = Math.ceil(total / statsState.limit);
        start = (statsState.page - 1) * statsState.limit;
        end = start + statsState.limit;
      }
    }
    const paginated = filtered.slice(start, end);

    tbody.innerHTML = paginated.map((item, index) => {
      const visitPill = (start + index) < 3 ? 'stats-table__pill' : '';
      const visitHtml = visitPill
        ? `<span class="${visitPill}">${formatInt(item.visits)}</span>`
        : formatInt(item.visits);

      const crReadsClass = getColorClass(item.crReads, 'cr');
      const crTransClass = getColorClass(item.crTrans, 'cr');
      const timeClass = getColorClass(item.time, 'time');

      return `
        <tr>
          <td>
            <span class="stats-table__id-label">Креатив</span>
            <a href="#" class="stats-table__id-value">${item.id}</a>
          </td>
          <td>${visitHtml}</td>
          <td>${formatInt(item.reads)}</td>
          <td>${formatInt(item.transitions)}</td>
          <td class="${crReadsClass}">${item.crReads !== null ? formatDec(item.crReads, 1) : '—'}</td>
          <td class="${crTransClass}">${item.crTrans !== null ? formatDec(item.crTrans, 1) : '—'}</td>
          <td class="${timeClass}">${item.time !== null ? formatDec(item.time, 1) : '—'}</td>
        </tr>
      `;
    }).join('');

    const displayStart = total === 0 ? 0 : start + 1;
    const displayEnd = Math.min(end, total);
    countEl.textContent = `Показано ${displayStart}–${displayEnd} из ${total} креативов`;

    if (statsState.limit === Infinity || total <= statsState.limit) {
      pagesContainer.innerHTML = '';
      btnPrev.style.display = 'none';
      btnNext.style.display = 'none';
    } else {
      btnPrev.style.display = 'flex';
      btnNext.style.display = 'flex';
      btnPrev.disabled = statsState.page === 1;
      btnNext.disabled = statsState.page === Math.ceil(total / statsState.limit);

      const totalPages = Math.ceil(total / statsState.limit);
      let pagesHtml = '';
      for (let i = 1; i <= totalPages; i++) {
        pagesHtml += `<button type="button" class="stats-page-num ${i === statsState.page ? 'is-active' : ''}" data-page="${i}">${i}</button>`;
      }
      pagesContainer.innerHTML = pagesHtml;
    }
  }

  document.querySelectorAll('.stats-table__th').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (statsState.sortKey === key) {
        statsState.sortDir = statsState.sortDir === 'desc' ? 'asc' : 'desc';
      } else {
        statsState.sortKey = key;
        statsState.sortDir = 'desc';
      }

      document.querySelectorAll('.stats-table__th').forEach(t => {
        t.classList.remove('is-sorted', 'is-sorted-asc');
      });
      th.classList.add('is-sorted');
      if (statsState.sortDir === 'asc') th.classList.add('is-sorted-asc');

      statsState.page = 1;
      renderTable();
    });
  });

  document.querySelectorAll('#cr-filters .stats-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#cr-filters .stats-pill').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      statsState.filter = btn.dataset.filter;
      statsState.page = 1;
      renderTable();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      statsState.search = e.target.value.trim();
      statsState.page = 1;
      renderTable();
    });
  }

  document.querySelectorAll('.stats-pagination__right .stats-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stats-pagination__right .stats-pill').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const limit = btn.dataset.limit;
      statsState.limit = limit === 'all' ? Infinity : parseInt(limit, 10);
      statsState.page = 1;
      renderTable();
    });
  });

  btnPrev.addEventListener('click', () => {
    if (statsState.page > 1) {
      statsState.page--;
      renderTable();
    }
  });

  btnNext.addEventListener('click', () => {
    const filtered = getFilteredAndSortedData();
    if (statsState.page < Math.ceil(filtered.length / statsState.limit)) {
      statsState.page++;
      renderTable();
    }
  });

  pagesContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.stats-page-num');
    if (btn) {
      statsState.page = parseInt(btn.dataset.page, 10);
      renderTable();
    }
  });

  const defaultTh = document.querySelector('.stats-table__th[data-sort="visits"]');
  if (defaultTh) defaultTh.classList.add('is-sorted');

  renderTable();
}

// Доли времени по блокам статьи для 20 креативов (стеклянная диаграмма)
const STACKED_DATA = [
  [30, 25, 15, 12, 10, 8],
  [33, 17, 16, 16, 11, 7],
  [38, 13, 19, 10, 13, 7],
  [38, 18, 19, 13, 7, 5],
  [27, 18, 27, 11, 12, 5],
  [34, 13, 13, 16, 14, 10],
  [38, 20, 16, 10, 8, 8],
  [40, 15, 17, 13, 10, 5],
  [35, 18, 20, 13, 10, 4],
  [32, 20, 15, 15, 10, 8],
  [30, 25, 15, 12, 10, 8],
  [33, 17, 16, 16, 11, 7],
  [38, 13, 19, 10, 13, 7],
  [38, 18, 19, 13, 7, 5],
  [27, 18, 27, 11, 12, 5],
  [34, 13, 13, 16, 14, 10],
  [38, 20, 16, 10, 8, 8],
  [40, 15, 17, 13, 10, 5],
  [35, 18, 20, 13, 10, 4],
  [28, 22, 18, 12, 10, 10],
];

const STACKED_COLORS = ['#10B981', '#14B8A6', '#14B8A6', '#10B981', '#14B8A6', '#14B8A6'];
const STACKED_IDS = [
  '191307', '191308', '191309', '191310', '191311',
  '191312', '191313', '191314', '191315', '191316',
  '191317', '191318', '191319', '191320', '191321',
  '191322', '191323', '191324', '191325', '191326'
];

function renderStackedChart() {
  const container = document.getElementById('stacked-cols');
  if (!container) return;

  container.innerHTML = STACKED_DATA.map((col, i) => `
    <div class="behavior-stack">
      <div class="behavior-stack__bar">
        ${col.map((h, j) => `<span class="behavior-stack__seg" style="height: ${h}%; background: ${STACKED_COLORS[j]}"></span>`).join('')}
      </div>
      <span class="behavior-stack__label">cr_${STACKED_IDS[i]}</span>
    </div>
  `).join('');
}

// Генерирует облако точек для корреляционных графиков
function generateCorrelationPoints(id, count, type, color) {
  const container = document.getElementById(id);
  if (!container) return;

  let html = '';
  for (let i = 0; i < count; i++) {
    let x = Math.random();
    let y;

    if (type === 'positive') {
      y = 0.6 * x + (Math.random() * 0.4 - 0.2);
    } else {
      y = Math.random();
    }

    x = Math.max(0.02, Math.min(0.98, x));
    y = Math.max(0.05, Math.min(0.95, y));

    const left = x * 100;
    const top = (1 - y) * 100;

    html += `<span class="correlation-dot" style="left: ${left}%; top: ${top}%; background: ${color};"></span>`;
  }
  container.innerHTML = html;
}

function renderCorrelationPlots() {
  generateCorrelationPoints('corr-plot-1-c', 40, 'positive', '#14B8A6');
  generateCorrelationPoints('corr-plot-2-c', 40, 'positive', '#14B8A6');
  generateCorrelationPoints('corr-plot-3-c', 40, 'random',   '#F59E0B');
}

function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  if (!lightbox || !lightboxImg) return;

  const lightboxClose = document.querySelector('.lightbox__close');
  const lightboxBackdrop = document.querySelector('.lightbox__backdrop');

  document.querySelectorAll('.pattern-card__preview, .scenario-card__preview').forEach(preview => {
    preview.addEventListener('click', () => {
      const src = preview.dataset.src;
      if (src) {
        lightboxImg.src = src;
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  const closeModal = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => { lightboxImg.src = ''; }, 300);
  };

  lightboxClose.addEventListener('click', closeModal);
  lightboxBackdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
      closeModal();
    }
  });
}

function initBlockTabs() {
  document.querySelectorAll('.block-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.block-tab').forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');

      document.querySelectorAll('.block-card').forEach(card => {
        card.style.display = 'none';
        card.classList.remove('is-visible');
      });

      const targetCard = document.getElementById(tab.dataset.target);
      if (targetCard) {
        targetCard.style.display = 'flex';
        targetCard.classList.add('is-visible');
      }
    });
  });
}

// Единая точка инициализации всего приложения
function initApp() {
  measureArcs();
  renderDynamicsChart();
  renderStackedChart();
  renderCorrelationPlots();

  cloneCreativesGrids();
  initAccordions();
  initCreativesControls();
  initStatsTable();

  initFilters();
  initMetricsTabs();

  initRouting();
  initLightbox();
  initBlockTabs();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}