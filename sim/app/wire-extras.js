import { initHazards } from './hazards.js';
import { initCorridor } from './corridor.js';

export async function initExtras({ scene, terrain, geo, groundY }) {
  const card = document.getElementById('stop-photo');
  const close = () => { card.hidden = true; };
  card.querySelector('button').onclick = close;
  addEventListener('keydown', e => { if (e.code === 'Escape') close(); });
  const [hazards, corridor] = await Promise.all([
    initHazards(scene, terrain, geo), initCorridor(scene, terrain, geo, { groundY }),
  ]);
  return { hazards, corridor, close,
    update(position) {
      const stops = corridor.update(position);
      if (!stops.length || document.querySelector('.mm-modal')) return;
      const stop = stops[0];
      card.querySelector('img').src = stop.photo_url;
      card.querySelector('img').alt = `Curiosity sol ${stop.sol} Navcam görüntüsü`;
      card.querySelector('figcaption').textContent = `Curiosity · sol ${stop.sol} · NASA/JPL-Caltech · ham Navcam`;
      card.hidden = false;
    },
  };
}
