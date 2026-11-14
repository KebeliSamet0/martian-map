// e2e JSON çıktısını Markdown rapora çevirir: node report.mjs <json> <dal> <sha> <çıkışKodu> <log>
import { readFileSync, existsSync } from 'node:fs';
const [json, branch, sha, code, log] = process.argv.slice(2);
const out = [`# QA raporu: ${branch} (${sha})`, '', `Tarih: ${new Date().toISOString()} · çıkış kodu: ${code}`, ''];
if (!existsSync(json)) {
  out.push('**e2e sonuç üretmedi** (çökme ya da kurulum hatası). Log sonu:', '```', readFileSync(log, 'utf8').split('\n').slice(-15).join('\n'), '```');
} else {
  const { results } = JSON.parse(readFileSync(json, 'utf8'));
  for (const r of results) {
    out.push(`## ${r.mission}`, '', '| Adım | Sonuç | süre ms | FPS | Not / hata | Kare |', '|---|---|---|---|---|---|');
    for (const s of r.steps) out.push(`| ${s.name} | ${s.ok ? 'OK' : '**FAIL**'} | ${s.ms} | ${s.fps ?? '—'} | ${s.note.replace(/\|/g, '/').slice(0, 110)} | ${s.frame ?? ''} |`);
    out.push('', r.errors.length ? `Konsol hataları: ${r.errors.map(e => '`' + e.slice(0, 100) + '`').join(', ')}` : 'Konsol hatası: yok', '');
  }
}
console.log(out.join('\n'));
