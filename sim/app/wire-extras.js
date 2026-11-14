import { initHazards } from './hazards.js';
import { initCorridor, createStopCard } from './corridor.js';

export async function initExtras({ scene, terrain, geo, groundY }) {
  const el = document.getElementById('stop-photo'), img = el.querySelector('img'), cap = el.querySelector('figcaption');
  // Küçük kart: sol + Navcam; büyük (tıkla / G): tam başlık ve kaynak notu.
  const caption = (s, big) => big ? `Curiosity · sol ${s.sol} · NASA/JPL-Caltech · ham Navcam` : `Sol ${s.sol} · Navcam · büyüt: G`;
  const card = createStopCard({
    show(s) { img.src = s.photo_url; img.alt = `Curiosity sol ${s.sol} Navcam görüntüsü`; el.hidden = false; },
    expand(big) { el.classList.toggle('big', big); if (card?.current) cap.textContent = caption(card.current, big); },
    hide() { el.hidden = true; el.classList.remove('big'); },
  });
  const close = () => card.close();
  el.querySelector('button').onclick = (e) => { e.stopPropagation(); close(); };
  img.onclick = () => card.toggle();
  addEventListener('keydown', e => {
    if (el.hidden || e.target?.closest?.('input, textarea, select')) return;
    if (e.code === 'Escape') card.escape();
    else if (e.code === 'KeyG') card.toggle();
  });
  const [hazards, corridor] = await Promise.all([
    initHazards(scene, terrain, geo), initCorridor(scene, terrain, geo, { groundY }),
  ]);
  return { hazards, corridor, close,
    update(position) {
      card.update(corridor.update(position), { blocked: !!document.querySelector('.mm-modal') });
    },
  };
}
