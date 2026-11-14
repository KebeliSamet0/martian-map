// Oyun akışı: açılış → görev seçimi → (brifing, rota: wire.js/screens.js) → yürüyüş HUD'u → duraklat menüsü → karne sonrası.
// main.js tek çağrı yapar: const flow = initFlow({...}).
import { ensureUiCss } from './hud.js';
import { el, button } from './screens.js';
import { t, getLang, setLang, onLang, loadTexts, missionText } from './i18n.js';
import { slotItems } from './slots.js';
import { bearingRel, missionSummary, fmtDist } from './flow-logic.js';

const emit = (screen, extra = {}) => window.dispatchEvent(new CustomEvent('mm:screen', { detail: { screen, ...extra } }));

export function initFlow({ wire, root, getState, getPose, pause, enterMap, exitToTour, audio, dev }) {
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
    const foot = el('footer', 'mm-intro-foot');
    foot.append(el('div', null, t('intro.sources')), el('div', 'mm-intro-syn', t('intro.synthetic')));
    layer.append(box, foot, langButton());
    layer.classList.add('mm-in');
    go.focus();
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
      card.append(top, el('h3', 'mm-mcard-title', wire.missionTitle(m)), el('p', 'mm-mcard-story', missionText(m.id, 'brief')), facts, go);
      row.append(card);
    });
    layer.append(head, row, langButton());
    layer.classList.add('mm-in');
    row.querySelector('button')?.focus();
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
    else if (screen === 'walk') { buildWalkHud(); }
  });

  loadTexts();
  return {
    showIntro, showSelect, showWalk, update, openPause, closePause, toggleHelp,
    get screen() { return screen; }, get paused() { return paused; }, dev,
    // wire.js kancaları
    onScreen: (name, m) => { if (name === 'briefing' || name === 'computing' || name === 'route') { clearLayer(); setScreen(name, { mission: m?.id }); } else if (name === 'select') { /* onBack gösterir */ } else setScreen(name, { mission: m?.id }); },
    onBack: () => { exitToTour(); showSelect(); },
    onReport: (action) => { hudLayer.hidden = true; exitToTour(); showSelect(); },
    autoWalk: true,
  };
}
