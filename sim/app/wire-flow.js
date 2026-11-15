// Oyun akışı: açılış → görev seçimi → (brifing, rota: wire.js/screens.js) → yürüyüş HUD'u → duraklat menüsü → karne sonrası.
// main.js tek çağrı yapar: const flow = initFlow({...}).
import { ensureUiCss } from './hud.js';
import { el, button } from './screens.js';
import { t, getLang, setLang, onLang, loadTexts, missionText } from './i18n.js';
import { slotItems } from './slots.js';
import { bearingRel, missionSummary, fmtDist } from './flow-logic.js';
import { awardBadge, readBadges, BADGES } from './score.js';
import { openMapPicker, loadPickerLayers } from './mappicker.js';   // batu:custom
import { parseAB, buildCustomMission } from './custommission.js';   // batu:custom
import { API_BASE, API_OFF } from './api.js';   // batu:custom

const emit = (screen, extra = {}) => window.dispatchEvent(new CustomEvent('mm:screen', { detail: { screen, ...extra } }));

export function initFlow({ wire, root, getState, getPose, pause, enterMap, exitToTour, audio, dev, geo, overviewUrl }) {
  ensureUiCss();
  const layer = el('div', 'mm-ui mm-flow');
  layer.id = 'flow';
  root.append(layer);
  const hudLayer = el('div', 'mm-ui mm-walkhud');
  hudLayer.hidden = true;
  root.append(hudLayer);
  let screen = null, paused = false, current = null, tipTimer = 0;
  const setScreen = (name, extra) => { screen = name; layer.dataset.screen = name ?? ''; emit(name ?? 'none', extra); };
  const clearLayer = () => layer.replaceChildren();

  function langButton() {
    const b = button(t('lang.switch'), 'ghost');
    b.classList.add('mm-lang');
    b.title = 'TR / EN';
    b.onclick = () => setLang(getLang() === 'tr' ? 'en' : 'tr');
    return b;
  }

  // ---------- Açılış ----------
  function showIntro() {
    clearLayer(); hudLayer.hidden = true; setScreen('intro');
    const box = el('section', 'mm-intro');
    box.append(
      el('div', 'mm-kicker', t('intro.place')),
      el('h1', 'mm-intro-title', t('intro.title')),
      el('div', 'mm-intro-sub', t('intro.subtitle')),
      el('p', 'mm-intro-tag', t('intro.tagline')),
    );
    const go = button(t('intro.start'));
    go.classList.add('mm-btn-lg'); go.dataset.testid = 'intro-start';
    go.onclick = () => showSelect();
    box.append(go);
    // #125 B.6: kazanılmış rozetler açılışta küçük bir satır
    const have = readBadges(), got = BADGES.filter((id) => have[id]);
    if (got.length) {
      const row = el('div', 'mm-badge-row mm-intro-badges');
      row.append(el('span', 'mm-kicker', t('intro.badges')));
      for (const id of got) { const b = el('span', 'mm-badge', t(`badge.${id}`)); b.dataset.on = '1'; b.title = t(`badge.${id}.how`); row.append(b); }
      box.append(row);
    }
    const foot = el('footer', 'mm-intro-foot');
    foot.append(el('div', null, t('intro.sources')), el('div', 'mm-intro-syn', t('intro.synthetic')));
    layer.append(box, foot, langButton());
    layer.classList.add('mm-in');
    go.focus();
  }

  // ---------- Görev kartı harita önizlemesi (#103 B.6) ----------
  // Ortofoto genel görünümünden başlangıç–hedef çevresini kırpar, üstüne rota doğrusunu çizer.
  // Veri yoksa (geo/overview/px eksik) hiç çizilmez; uydurma görsel yok.
  let overview = null;
  function overviewImg() {
    if (overview || !overviewUrl) return overview;
    overview = new Image();
    overview.src = overviewUrl;
    return overview;
  }
  function missionPreview(m) {
    const img = overviewImg();
    if (!img || !geo || !wire.coords || !m.start_px || !m.goal_px) return null;
    const cv = el('canvas', 'mm-mcard-map');
    cv.width = 320; cv.height = 124;
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', `${m.id}: ${t('select.distance')}`);
    const paint = () => {
      if (!img.naturalWidth) return;
      let a, b;
      try { a = wire.coords.pxToWorld(m.start_px); b = wire.coords.pxToWorld(m.goal_px); } catch { return; }
      const cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2;
      const ar = cv.width / cv.height;
      const halfW = Math.max(Math.abs(a[0] - b[0]) / 2, (Math.abs(a[1] - b[1]) / 2) * ar) * 1.35 + 40;
      const halfH = halfW / ar;
      const u = (x) => (x / geo.sizeX) * img.naturalWidth, v = (z) => (z / geo.sizeZ) * img.naturalHeight;
      const g = cv.getContext('2d');
      g.drawImage(img, u(cx - halfW), v(cz - halfH), u(2 * halfW), v(2 * halfH), 0, 0, cv.width, cv.height);
      const px = (x) => ((x - (cx - halfW)) / (2 * halfW)) * cv.width;
      const pz = (z) => ((z - (cz - halfH)) / (2 * halfH)) * cv.height;
      g.strokeStyle = '#f2a93b'; g.lineWidth = 2; g.setLineDash([5, 4]);
      g.beginPath(); g.moveTo(px(a[0]), pz(a[1])); g.lineTo(px(b[0]), pz(b[1])); g.stroke();
      g.setLineDash([]);
      g.lineWidth = 2;
      g.beginPath(); g.arc(px(a[0]), pz(a[1]), 4, 0, 7); g.stroke();           // başlangıç: boş halka
      g.fillStyle = '#f2a93b';
      g.beginPath(); g.arc(px(b[0]), pz(b[1]), 4.5, 0, 7); g.fill();           // hedef: dolu
    };
    img.complete && img.naturalWidth ? paint() : img.addEventListener('load', paint, { once: true });
    return cv;
  }

  // ---------- Görev seçimi ----------
  function showSelect() {
    clearLayer(); hudLayer.hidden = true; setScreen('select');
    const head = el('header', 'mm-select-head');
    head.append(el('h2', 'mm-select-title', t('select.title')));
    const back = button(t('select.back'), 'ghost');
    back.onclick = () => showIntro();
    head.append(back);
    const row = el('div', 'mm-missions');
    const list = wire.catalog.missions.filter((m) => m.start_px && m.goal_px);
    if (!list.length) row.append(el('p', 'mm-text', t('select.loading')));
    list.forEach((m, i) => {
      const s = missionSummary(m, wire.coords);
      const card = el('article', 'mm-mcard');
      card.dataset.difficulty = s.difficulty ?? ''; card.dataset.testid = `mission-${m.id}`; card.dataset.mission = m.id;
      card.style.setProperty('--i', i);
      const top = el('div', 'mm-mcard-top');
      top.append(el('span', 'mm-mcard-id mm-num', m.id), el('span', 'mm-diff', t(`diff.${s.difficulty}`) || '—'));
      const facts = el('div', 'mm-mcard-facts');
      for (const [k, v] of [['select.distance', fmtDist(s.straightM)], ['select.time', s.timeMin == null ? '—' : `${s.timeMin} ${t('unit.min')}`], ['select.o2', s.o2L == null ? '—' : `${s.o2L} L`]]) {
        const f = el('div'); f.append(el('span', 'mm-g-label', t(k)), el('b', 'mm-num', v)); facts.append(f);
      }
      const go = button(t('select.go'), 'ghost'); go.dataset.testid = `mission-go-${m.id}`;
      go.onclick = () => { clearLayer(); layer.classList.remove('mm-in'); void wire.selectMission(m); };
      card.append(top, el('h3', 'mm-mcard-title', wire.missionTitle(m)));
      const map = missionPreview(m);
      if (map) card.append(map);
      card.append(el('p', 'mm-mcard-story', missionText(m.id, 'brief')), facts, go);
      row.append(card);
    });
    row.append(customCard());   // batu:custom
    layer.append(head, row, langButton());
    layer.classList.add('mm-in');
    row.querySelector('button')?.focus();
  }

  // ---------- Özel görev: 'Kendi rotanı planla' (#120, batu:custom) ----------
  let pickerLayers = null;
  function customCard() {
    const card = el('article', 'mm-mcard'); card.dataset.testid = 'mission-custom'; card.dataset.mission = 'CUSTOM';
    const top = el('div', 'mm-mcard-top'); top.append(el('span', 'mm-mcard-id mm-num', '+'), el('span', 'mm-diff', t('custom.badge')));
    const go = button(t('custom.card.go'), 'ghost'); go.dataset.testid = 'mission-go-custom';
    go.onclick = () => void openCustom();
    card.append(top, el('h3', 'mm-mcard-title', t('custom.card.title')), el('p', 'mm-mcard-story', t('custom.card.text')), go);
    if (API_OFF) { go.disabled = true; card.append(el('p', 'mm-fine', t('custom.err.api'))); }
    return card;
  }
  async function openCustom(initial) {
    clearLayer(); hudLayer.hidden = true; setScreen('picker');
    if (!pickerLayers && !API_OFF) pickerLayers = await loadPickerLayers(API_BASE);
    openMapPicker({ root: document.body, geo, coords: wire.coords, overviewUrl, grid: wire.grid, layers: pickerLayers ?? {}, initial,
      onCompute: (m) => { layer.classList.remove('mm-in'); void wire.selectMission(m); }, onBack: () => showSelect() });
  }
  // ?a=col,row&b=col,row ile açılış: aynı özel görev doğrudan brifinge gelir.
  function openCustomFromUrl() {
    const ab = parseAB(location.search); if (!ab) return false;
    try { void wire.selectMission(buildCustomMission({ ...ab, title: t('mission.CUSTOM.title') })); return true; } catch { return false; }
  }

  // ---------- Görev içi mini hedefler (#125 B.5) ----------
  // İsteğe bağlı; yıldıza bonus verir. Yalnız gerçekten izlenebilen maddeler listelenir.
  let checkBox = null, checkState = new Map();
  function setObjectives(keys = []) {
    checkState = new Map(keys.map((k) => [k, false]));
    renderChecklist();
  }
  // hudLayer her yeniden kurulduğunda (buildWalkHud) liste de yeniden çizilir, durum korunur.
  function renderChecklist() {
    checkBox?.remove(); checkBox = null;
    const keys = [...checkState.keys()];
    if (!keys.length) return;
    checkBox = el('section', 'mm-checklist');
    checkBox.setAttribute('aria-label', t('check.title'));
    checkBox.append(el('div', 'mm-kicker', t('check.title')));
    for (const k of keys) {
      const row = el('div', 'mm-check');
      row.dataset.key = k;
      const done = checkState.get(k);
      if (done) row.dataset.done = '1';
      row.append(el('span', 'mm-check-box', done ? '●' : '○'), el('span', 'mm-check-txt', t(`check.${k}`)));
      checkBox.append(row);
    }
    hudLayer.append(checkBox);
  }
  function tickObjective(key) {
    if (!checkState.has(key) || checkState.get(key)) return false;
    checkState.set(key, true);
    const row = checkBox?.querySelector(`.mm-check[data-key="${key}"]`);
    if (row) { row.dataset.done = '1'; row.firstChild.textContent = '●'; }
    return true;
  }
  const objectiveState = () => Object.fromEntries(checkState);
  // #125 B.6: üç farklı Navcam durağı incelendiyse rozet
  const camStops = new Set();
  addEventListener('mm:camera-insight', (e) => {
    tickObjective('camera');
    const id = e.detail?.stopId; if (id) camStops.add(id);
    if (camStops.size >= 3) awardBadge('camera3');
  });
  addEventListener('mm:scan', () => tickObjective('scan'));

  // ---------- Hesaplanıyor ekranı (#103 A.1) ----------
  // Eskiden bu aşamada katman boşaltılıp hiçbir şey çizilmiyordu: yavaş API'de boş ekran.
  function showComputing(m) {
    clearLayer(); hudLayer.hidden = true; setScreen('computing', { mission: m?.id });
    const card = el('section', 'mm-card mm-card-busy');
    card.append(
      el('div', 'mm-kicker', m?.id ?? ''),
      el('h2', 'mm-card-title', t('computing.title')),
      el('p', 'mm-text', t('computing.hint')),
    );
    const bar = el('div', 'mm-progress');
    bar.append(el('div', 'mm-progress-fill'));
    card.append(bar, el('p', 'mm-fine', t('computing.step.route')));
    const box = el('div', 'mm-modal mm-overlay mm-in');
    box.append(card);
    layer.append(box);
    layer.classList.add('mm-in');
  }

  // ---------- Görünür hata + tekrar dene (#103 A.1) ----------
  let lastError = null;
  function showError(info) {
    const { message, detail, retry } = info;
    lastError = info;
    clearLayer(); hudLayer.hidden = true; setScreen('error');
    const card = el('section', 'mm-card');
    card.append(
      el('h2', 'mm-card-title', t('error.title')),
      el('p', 'mm-text', message ?? t('error.route')),
    );
    if (detail) card.append(el('p', 'mm-fine', detail));
    const acts = el('div', 'mm-alert-acts mm-acts-end');
    const back = button(t('briefing.back'), 'ghost');
    back.onclick = () => { exitToTour(); showSelect(); };
    acts.append(back);
    if (retry) {
      const again = button(t('fatal.retry'));
      again.onclick = () => { void retry(); };
      acts.append(again);
      card.append(acts);
      again.focus();
    } else { card.append(acts); back.focus(); }
    const box = el('div', 'mm-modal mm-overlay mm-in');
    box.append(card);
    layer.append(box);
    layer.classList.add('mm-in');
  }

  // ---------- Yürüyüş HUD'u ----------
  let hudRefs = null;
  function buildWalkHud() {
    hudLayer.replaceChildren();
    const m = wire.selected;
    const box = el('section', 'mm-mhud');
    const arrow = el('div', 'mm-arrow'); arrow.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 2 L20 20 L12 15 L4 20 Z" fill="currentColor"/></svg>';
    const txt = el('div', 'mm-mhud-txt');
    const title = el('div', 'mm-mhud-title'), obj = el('div', 'mm-mhud-obj'), dist = el('div', 'mm-mhud-dist mm-num');
    txt.append(el('div', 'mm-kicker', t('hud.mission')), title, el('div', 'mm-kicker mm-k2', t('hud.next')), obj, dist);
    box.append(arrow, txt);
    hudLayer.append(box, el('div', 'mm-tip'));
    title.textContent = m ? `${m.id} · ${wire.missionTitle(m)}` : t('hud.free');
    obj.textContent = m ? missionText(m.id, 'objective') : '';
    hudRefs = { arrow, dist, obj, title, tip: hudLayer.querySelector('.mm-tip') };
    renderChecklist();   // #125 B.5: katman yeniden kurulunca liste geri gelsin
  }
  function showWalk(kind) {
    clearLayer(); layer.classList.remove('mm-in'); setScreen('walk');
    buildWalkHud(); hudLayer.hidden = false; hudLayer.dataset.testid = 'walk-3d';
    hudRefs.tip.textContent = t(kind === 'auto' ? 'tip.auto' : 'tip.walk');
    hudRefs.tip.classList.add('mm-show');
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => hudRefs?.tip.classList.remove('mm-show'), 10000);   // ilk 10 sn'de solar
  }
  // main.js her HUD turunda çağırır
  function update(P, run) {
    if (!hudRefs || hudLayer.hidden) return;
    const goal = run?.r?.dense?.at(-1);
    if (!goal) { hudRefs.dist.textContent = ''; return; }
    const rem = run.total - run.s;
    hudRefs.dist.textContent = `${fmtDist(rem)}`;
    hudRefs.arrow.style.transform = `rotate(${bearingRel(P.x, P.z, P.yaw, goal[0], goal[1])}rad)`;
  }

  // ---------- Yardım ve duraklat ----------
  function overlay(cls) {
    const back = el('div', `mm-ui mm-modal mm-overlay ${cls}`);
    const card = el('section', 'mm-card mm-card-menu');
    back.append(card); root.append(back);
    requestAnimationFrame(() => back.classList.add('mm-in'));
    return { back, card, close: () => back.remove() };
  }
  let help = null;
  function toggleHelp() {
    if (help) { help.close(); help = null; return; }
    help = overlay('mm-help');
    help.card.append(el('h2', 'mm-card-title', t('help.title')));
    const parts = t('help.rows').split('|'), grid = el('div', 'mm-keys');
    for (let i = 0; i + 1 < parts.length; i += 2) { grid.append(el('kbd', 'mm-key', parts[i]), el('span', null, parts[i + 1])); }
    const close = button(t('help.close'));
    close.onclick = toggleHelp;
    help.card.append(grid, el('div', 'mm-alert-acts mm-acts-end'));
    help.card.lastChild.append(close);
    close.focus();
  }

  function openPause() {
    if (current) return;
    const s = getState();
    if (s === 'map' || s === 'tour' || document.querySelector('.mm-modal') || !wire.selected && s !== 'walk' && s !== 'auto' && s !== 'fly') return;
    paused = true; pause(true); document.exitPointerLock?.();
    current = overlay('mm-pausemenu');
    renderPause();
    emit('pause');
  }
  function renderPause(view = 'main') {
    const c = current.card; c.replaceChildren(); c.classList.toggle('mm-card-layers', view === 'layers');
    c.append(el('div', 'mm-kicker', wire.selected ? wire.selected.id : ''), el('h2', 'mm-card-title', t('pause.title')));
    if (view === 'main') {
      const menu = el('div', 'mm-menu');
      const add = (label, fn, kind = 'ghost') => { const b = button(label, kind); b.onclick = fn; menu.append(b); return b; };
      const first = add(t('pause.resume'), closePause, 'primary');
      add(t('pause.info'), () => renderPause('info'));
      add(t('pause.layers'), () => renderPause('layers'));
      const snd = add(`${t('pause.sound')}: ${audio?.enabled ? t('pause.sound.on') : t('pause.sound.off')}`, () => { audio?.setEnabled(!audio.enabled); renderPause(); });
      if (!audio) snd.disabled = true;
      add(`${t('pause.language')}: ${getLang().toUpperCase()}`, () => { setLang(getLang() === 'tr' ? 'en' : 'tr'); });
      add(t('pause.exit'), () => renderPause('confirm'));
      c.append(menu); first.focus();
    } else if (view === 'info') {
      const m = wire.selected;
      c.append(el('div', 'mm-mission', m ? wire.missionTitle(m) : t('hud.free')));
      if (m) c.append(el('p', 'mm-text', missionText(m.id, 'brief')), el('p', 'mm-text mm-objective', missionText(m.id, 'objective')));
      backRow(c);
    } else if (view === 'layers') {
      awardBadge('layers');   // #125 B.6: veri katmanları paneli açıldı
      const panels = slotItems('pause-panel');
      if (!panels.length) c.append(el('p', 'mm-text', t('pause.layers.empty')));
      for (const p of panels) {
        const box = el('div', 'mm-layer-panel'); box.append(el('h3', 'mm-sub', p.title)); c.append(box);
        try { p.render(box); } catch (e) { console.warn('[pause-panel]', e); }
      }
      backRow(c);
    } else if (view === 'confirm') {
      c.append(el('p', 'mm-text', t('pause.confirm')));
      const acts = el('div', 'mm-alert-acts mm-acts-end');
      const no = button(t('select.back'), 'ghost'), yes = button(t('pause.exit'));
      no.onclick = () => renderPause(); yes.onclick = () => { closePause(false); exitMission(); };
      acts.append(no, yes); c.append(acts); no.focus();
    }
  }
  function backRow(c) {
    const acts = el('div', 'mm-alert-acts mm-acts-end'), b = button(t('select.back'), 'ghost');
    b.onclick = () => renderPause(); acts.append(b); c.append(acts); b.focus({ preventScroll: true }); c.scrollTop = 0;
  }
  function closePause(resume = true) {
    current?.close(); current = null; paused = false;
    if (resume) { pause(false); emit('resume'); }
  }
  function exitMission() {
    wire.stop(); hudLayer.hidden = true; exitToTour(); showSelect();
  }

  // ---------- Girdi ----------
  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === '?' && !e.repeat && screen === 'walk') { toggleHelp(); e.preventDefault(); return; }
    if (e.code === 'Escape') {
      if (help) { toggleHelp(); return; }
      if (current) { closePause(); return; }
      if (screen === 'walk') openPause();
    }
  });
  // Fare kilidi Esc ile kalkarsa (Chrome keydown'u yutabilir) menüyü aç
  document.addEventListener('pointerlockchange', () => {
    if (!document.pointerLockElement && screen === 'walk' && !paused) setTimeout(() => { if (!document.pointerLockElement && screen === 'walk') openPause(); }, 60);
  });
  onLang(() => {
    if (screen === 'intro') showIntro(); else if (screen === 'select') showSelect();
    else if (current) renderPause();
    else if (screen === 'computing') showComputing(wire.selected);
    else if (screen === 'error' && lastError) showError(lastError);
    else if (screen === 'walk') { buildWalkHud(); }
  });

  loadTexts();
  return {
    showIntro, showSelect, showWalk, update, openPause, closePause, toggleHelp, openCustom, openCustomFromUrl,
    get screen() { return screen; }, get paused() { return paused; }, dev,
    // wire.js kancaları
    onScreen: (name, m) => {
      if (name === 'computing') return showComputing(m);
      if (name === 'briefing' || name === 'route') { clearLayer(); setScreen(name, { mission: m?.id }); }
      else if (name === 'select') { /* onBack gösterir */ } else setScreen(name, { mission: m?.id });
    },
    // #125 A.1: dönüş ayağında HUD hedef satırı değişir
    setObjective: (text) => { if (hudRefs) hudRefs.obj.textContent = text; },
    setObjectives, tickObjective, objectiveState,   // #125 B.5
    onError: showError,
    onBack: () => { exitToTour(); showSelect(); },
    onReport: (action) => { hudLayer.hidden = true; exitToTour(); showSelect(); },
    autoWalk: true,
  };
}
