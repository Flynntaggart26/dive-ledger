import { equipmentToCsv, getServiceStatus, parseBackup, validateDive, validateEquipment, validateServiceEntry } from './domain.mjs';
import {
  barToPsi, bestMix, cToF, eadM, formatCountdown, fToC, ftToM, gasNeeded,
  modM, mToFt, ndlAirM, ndlNitroxM, ppo2, psiToBar, sacRate,
} from './divecalc.mjs';
import { newId, store } from './store.mjs';
import { defaultChecklist, stringsFor } from './i18n.mjs';
import { equipmentUrl, qrDataUrl } from './qr.mjs';

let lang = localStorage.getItem('dive-ledger-lang') || 'tr';
let S = stringsFor(lang);
let equipment = [];
let services = [];
let checklist = [];
let dives = [];

const $ = (id) => document.getElementById(id);

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function applyI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = S[el.dataset.i18n];
    if (typeof v === 'string') el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    const v = S[el.dataset.i18nPh];
    if (typeof v === 'string') el.placeholder = v;
  });
  $('lang-toggle').textContent = lang === 'tr' ? 'TR / EN' : 'EN / TR';
  $('lang-toggle').setAttribute('aria-label', lang === 'tr' ? 'Switch to English' : "Türkçe'ye geç");
}

function statusOf(item) {
  return getServiceStatus(item.nextServiceDate || '', todayKey(), 30);
}

function typeLabel(t) {
  return t === 'regulator' ? S.typeRegulator : t === 'cylinder' ? S.typeCylinder : t === 'computer' ? S.typeComputer : t === 'bcd' ? 'BCD' : S.typeOther;
}

async function load() {
  [equipment, services, checklist, dives] = await Promise.all([store.listEquipment(), store.listServices(), store.listChecklist(), store.listDives()]);
  if (!checklist.length) {
    checklist = defaultChecklist(lang).map((label, i) => ({ id: newId('check'), label, done: false, order: i }));
    for (const c of checklist) await store.putCheck(c);
  }
}

function renderStats() {
  const active = equipment.filter((e) => e.status !== 'archived');
  const counts = { overdue: 0, soon: 0, current: 0, unset: 0 };
  for (const e of active) counts[statusOf(e)] = (counts[statusOf(e)] || 0) + 1;
  $('stat-grid').innerHTML = `
    <div class="stat total"><b>${active.length}</b><span>${S.total}</span><small>${lang === 'tr' ? 'kayıtlı ekipman' : 'registered items'}</small></div>
    <div class="stat overdue"><b>${counts.overdue}</b><span>${S.overdue}</span><small>${lang === 'tr' ? 'tarih geçti' : 'past due date'}</small></div>
    <div class="stat soon"><b>${counts.soon}</b><span>${S.soon}</span><small>${lang === 'tr' ? '30 gün içinde' : 'within 30 days'}</small></div>
    <div class="stat neutral"><b>${counts.unset}</b><span>${S.unset}</span><small>${lang === 'tr' ? 'tarih girilmedi' : 'no date entered'}</small></div>`;
  $('hero-overdue').textContent = String(counts.overdue);
  $('hero-soon').textContent = String(counts.soon);
  $('hero-overdue-label').textContent = S.overdue;
  $('hero-soon-label').textContent = S.soon;
  $('hero-line').textContent = lang === 'tr'
    ? 'Regülatörden tüpe — her ekipmanın bakım hikâyesi tek defterde.'
    : 'From regulator to cylinder — every item’s service story in one logbook.';
  const attention = active
    .filter((e) => ['overdue', 'soon'].includes(statusOf(e)))
    .sort((a, b) => (a.nextServiceDate || '').localeCompare(b.nextServiceDate || ''));
  $('attention-list').innerHTML = attention.length
    ? attention.map((e) => {
      const st = statusOf(e);
      return `<li class="${st === 'overdue' ? 'is-overdue' : ''}"><strong>${escapeHtml(e.name)}</strong> <span class="badge ${st}"><span class="dot"></span>${e.nextServiceDate} · ${S[st]}</span><br><span class="meta">${escapeHtml(e.brand || '')} ${escapeHtml(e.model || '')}</span></li>`;
    }).join('')
    : `<li>${lang === 'tr' ? 'Yaklaşan servis yok. Tarihleri ekipman kartından gir.' : 'No upcoming service. Set dates on gear cards.'}</li>`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderEquipment() {
  const q = ($('search').value || '').toLowerCase();
  const tf = $('type-filter').value;
  const showA = $('show-archived').checked;
  const list = equipment
    .filter((e) => (showA ? true : e.status !== 'archived'))
    .filter((e) => (tf === 'all' ? true : e.type === tf))
    .filter((e) => `${e.name} ${e.brand} ${e.model} ${e.serialNumber}`.toLowerCase().includes(q))
    .sort((a, b) => (a.nextServiceDate || '9999').localeCompare(b.nextServiceDate || '9999'));
  $('equipment-empty').hidden = list.length > 0;
  $('equipment-grid').innerHTML = list.map((e) => {
    const st = statusOf(e);
    const icon = e.type === 'regulator' ? '◉' : e.type === 'bcd' ? '▣' : e.type === 'cylinder' ? '▮' : e.type === 'computer' ? '◈' : '○';
    return `<article class="card is-${st}">
      <div class="card-top"><span class="type-chip">${icon} ${typeLabel(e.type)}</span> <span class="badge ${st}"><span class="dot"></span>${e.nextServiceDate || '—'} · ${S[st]}</span></div>
      <strong class="card-name">${escapeHtml(e.name)}</strong>
      ${e.serialNumber ? `<span class="serial">SN ${escapeHtml(e.serialNumber)}</span>` : ''}
      <span class="meta">${escapeHtml([e.brand, e.model].filter(Boolean).join(' · ') || '—')}</span>
      <div class="row">
        <button data-open="${e.id}" class="ghost-btn">${lang === 'tr' ? 'Aç' : 'Open'}</button>
        <button data-edit="${e.id}" class="ghost-btn">${lang === 'tr' ? 'Düzenle' : 'Edit'}</button>
        <button data-arch="${e.id}" class="ghost-btn">${e.status === 'archived' ? (lang === 'tr' ? 'Geri al' : 'Restore') : (lang === 'tr' ? 'Arşivle' : 'Archive')}</button>
      </div>
    </article>`;
  }).join('');
}

function renderChecklist() {
  $('checklist').innerHTML = [...checklist].sort((a, b) => a.order - b.order).map((c) => `
    <li><label class="checkline"><input type="checkbox" data-check="${c.id}" ${c.done ? 'checked' : ''} /> <span>${escapeHtml(c.label)}</span></label></li>`).join('');
}

function renderAll() {
  applyI18n();
  renderStats();
  renderEquipment();
  renderChecklist();
  renderTools();
  renderDives();
}

function switchView(name) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('is-active', t.dataset.view === name));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('is-active', v.id === `view-${name}`));
}
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => switchView(t.dataset.view)));
$('goto-checklist').addEventListener('click', () => switchView('checklist'));

$('lang-toggle').addEventListener('click', () => {
  lang = lang === 'tr' ? 'en' : 'tr';
  localStorage.setItem('dive-ledger-lang', lang);
  S = stringsFor(lang);
  renderAll();
});

// Equipment form
$('add-equipment').addEventListener('click', () => {
  $('equipment-form').reset();
  $('eq-id').value = '';
  $('eq-errors').textContent = '';
  $('equipment-dialog').showModal();
});
$('equipment-grid').addEventListener('click', async (ev) => {
  const open = ev.target.closest('[data-open]');
  const edit = ev.target.closest('[data-edit]');
  const arch = ev.target.closest('[data-arch]');
  if (edit) {
    const e = equipment.find((x) => x.id === edit.dataset.edit);
    $('eq-id').value = e.id; $('eq-type').value = e.type; $('eq-name').value = e.name;
    $('eq-brand').value = e.brand || ''; $('eq-model').value = e.model || '';
    $('eq-serial').value = e.serialNumber || ''; $('eq-purchase').value = e.purchaseDate || '';
    $('eq-next').value = e.nextServiceDate || ''; $('eq-notes').value = e.notes || '';
    $('eq-errors').textContent = '';
    $('equipment-dialog').showModal();
  } else if (arch) {
    const e = equipment.find((x) => x.id === arch.dataset.arch);
    e.status = e.status === 'archived' ? 'active' : 'archived';
    e.updatedAt = new Date().toISOString();
    await store.putEquipment(e);
    await refresh();
  } else if (open) {
    openDetail(open.dataset.open);
  }
});
$('eq-save').addEventListener('click', async (ev) => {
  ev.preventDefault();
  const input = {
    id: $('eq-id').value || newId('gear'),
    type: $('eq-type').value, name: $('eq-name').value,
    brand: $('eq-brand').value, model: $('eq-model').value,
    serialNumber: $('eq-serial').value, purchaseDate: $('eq-purchase').value,
    nextServiceDate: $('eq-next').value, notes: $('eq-notes').value,
  };
  const { value, errors } = validateEquipment(input);
  if (Object.keys(errors).length) {
    $('eq-errors').textContent = Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join(' · ');
    return;
  }
  const existing = equipment.find((x) => x.id === value.id);
  await store.putEquipment({
    ...value, lastServiceDate: existing?.lastServiceDate || '',
    status: existing?.status || 'active',
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  $('equipment-dialog').close();
  await refresh();
});

// Detail + QR + services
let detailId = null;
async function openDetail(id) {
  detailId = id;
  const e = equipment.find((x) => x.id === id);
  if (!e) return;
  $('detail-title').textContent = e.name;
  $('detail-body').innerHTML = `<p class="meta mono">${escapeHtml(e.serialNumber || '')}</p>
    <p>${escapeHtml(e.brand || '')} ${escapeHtml(e.model || '')} · ${typeLabel(e.type)}</p>
    <p><span class="badge ${statusOf(e)}">${e.nextServiceDate || '—'} · ${S[statusOf(e)]}</span></p>
    ${e.notes ? `<p>${escapeHtml(e.notes)}</p>` : ''}`;
  const list = (await store.servicesFor(id)).sort((a, b) => b.serviceDate.localeCompare(a.serviceDate));
  $('detail-services').innerHTML = list.length
    ? list.map((s) => `<li><strong>${escapeHtml(s.serviceDate)}</strong> — ${escapeHtml(s.description)}<br><span class="meta">${escapeHtml(s.serviceProvider || '')} ${escapeHtml(s.notes || '')}</span></li>`).join('')
    : `<li>${lang === 'tr' ? 'Servis kaydı yok.' : 'No service records.'}</li>`;
  const url = equipmentUrl(id);
  $('detail-qr-url').textContent = url;
  try {
    $('detail-qr').src = await qrDataUrl(url);
  } catch {
    $('detail-qr').removeAttribute('src');
  }
  $('detail-dialog').showModal();
  if (location.hash !== `#/equipment/${encodeURIComponent(id)}`) history.replaceState(null, '', `#/equipment/${encodeURIComponent(id)}`);
}
$('detail-close').addEventListener('click', () => { $('detail-dialog').close(); history.replaceState(null, '', location.pathname); });
$('detail-add-service').addEventListener('click', () => {
  $('service-form').reset();
  $('svc-equipment-id').value = detailId;
  $('svc-errors').textContent = '';
  $('service-dialog').showModal();
});
$('detail-print').addEventListener('click', () => window.print());
$('svc-save').addEventListener('click', async (ev) => {
  ev.preventDefault();
  const input = {
    id: newId('svc'), equipmentId: $('svc-equipment-id').value,
    serviceDate: $('svc-date').value, serviceProvider: $('svc-provider').value,
    description: $('svc-desc').value, nextServiceDate: $('svc-next').value, notes: $('svc-notes').value,
  };
  const { value, errors } = validateServiceEntry(input);
  if (Object.keys(errors).length) {
    $('svc-errors').textContent = Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join(' · ');
    return;
  }
  await store.putService({ ...value, createdAt: new Date().toISOString() });
  if (value.nextServiceDate) {
    const e = equipment.find((x) => x.id === value.equipmentId);
    if (e) {
      e.nextServiceDate = value.nextServiceDate;
      e.lastServiceDate = value.serviceDate;
      e.updatedAt = new Date().toISOString();
      await store.putEquipment(e);
    }
  }
  $('service-dialog').close();
  await refresh();
  openDetail(value.equipmentId);
});

// Checklist
$('checklist').addEventListener('change', async (ev) => {
  const box = ev.target.closest('[data-check]');
  if (!box) return;
  const item = checklist.find((x) => x.id === box.dataset.check);
  item.done = box.checked;
  await store.putCheck(item);
});
$('reset-checklist').addEventListener('click', async () => {
  for (const c of checklist) { c.done = false; await store.putCheck(c); }
  renderChecklist();
});
$('add-check-item').addEventListener('click', async () => {
  const label = prompt(lang === 'tr' ? 'Madde metni:' : 'Item text:');
  if (!label?.trim()) return;
  const item = { id: newId('check'), label: label.trim(), done: false, order: checklist.length };
  checklist.push(item);
  await store.putCheck(item);
  renderChecklist();
});

// Search/filter
$('search').addEventListener('input', renderEquipment);
$('type-filter').addEventListener('change', renderEquipment);
$('show-archived').addEventListener('change', renderEquipment);

// Backup
function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
$('export-json').addEventListener('click', async () => {
  const doc = { format: 'dive-ledger-backup', version: 1, exportedAt: new Date().toISOString(), data: { equipment, serviceEntries: services, checklist, dives } };
  download(`dive-ledger-${todayKey()}.json`, JSON.stringify(doc, null, 2), 'application/json');
});
$('export-csv').addEventListener('click', () => {
  download(`dive-ledger-${todayKey()}.csv`, equipmentToCsv(equipment.filter((e) => e.status !== 'archived')), 'text/csv');
});
$('import-json').addEventListener('change', async (ev) => {
  const file = ev.target.files?.[0];
  if (!file) return;
  try {
    const doc = parseBackup(await file.text());
    if (!confirm(lang === 'tr' ? 'Mevcut veriler silinip içe aktarılan yüklensin mi?' : 'Replace current data with the import?')) return;
    await store.replaceAll(doc.data);
    await refresh();
    $('backup-status').textContent = lang === 'tr' ? 'İçe aktarma tamam.' : 'Import complete.';
  } catch (err) {
    $('backup-status').textContent = String(err.message || err);
  }
  ev.target.value = '';
});

async function refresh() {
  [equipment, services, checklist, dives] = await Promise.all([store.listEquipment(), store.listServices(), store.listChecklist(), store.listDives()]);
  renderAll();
}

// ---------------- Dive tools ----------------

const num = (id, fallback = 0) => {
  const v = Number($(id).value);
  return Number.isFinite(v) ? v : fallback;
};

function resultRow(label, value, warn = false) {
  return `<div class="result-row${warn ? ' is-warn' : ''}"><dt>${escapeHtml(label)}</dt><dd>${value}</dd></div>`;
}

function renderNitrox() {
  const o2 = num('nx-o2', 32);
  const depth = num('nx-depth', 0);
  const ceil = num('nx-ceil', 1.4);
  if (o2 < 21 || o2 > 100 || !Number.isFinite(depth) || depth < 0) {
    $('nx-results').innerHTML = resultRow('—', escapeHtml(S.badMix), true);
    return;
  }
  const fo2 = o2 / 100;
  const p = ppo2(fo2, depth);
  const over = p > ceil + 1e-9;
  const ead = eadM(fo2, depth);
  const ndl = ndlNitroxM(fo2, depth, ceil);
  $('nx-results').innerHTML =
    resultRow(`${S.modLabel} @${ceil} bar`, `<b>${modM(fo2, ceil)} m</b>`) +
    resultRow(S.ppo2Label, `<b>${p.toFixed(2)} bar</b>`, over) +
    (over ? resultRow('⚠', escapeHtml(S.ppO2Exceeded), true) : '') +
    resultRow(S.eadLabel, `<b>${ead} m</b>`) +
    resultRow(S.bestMixLabel, `<b>EAN${bestMix(ceil, depth)}</b>`) +
    resultRow(S.nitroxNdlLabel, ndl.error
      ? escapeHtml(ndl.error === 'ppO2-exceeded' ? S.ppO2Exceeded : S.beyondTable)
      : (ndl.unlimited ? S.unlimitedLabel : `<b>${ndl.ndlMin} dk</b> (EAD ${ndl.eadM} m → ${ndl.tableDepthM} m)`));
}

function renderNdl() {
  const depth = num('ndl-depth', 0);
  const r = ndlAirM(depth);
  $('ndl-results').innerHTML = r.error
    ? resultRow('—', escapeHtml(r.error === 'beyond-table' ? S.beyondTable : S.outOfRange), true)
    : resultRow(S.tableDepthLabel, `<b>${r.tableDepthM} m</b> (${r.tableDepthFsw} ft)`) +
      resultRow(S.ndlResultLabel, r.unlimited ? S.unlimitedLabel : `<b>${r.ndlMin} dk</b>`);
}

function renderSac() {
  const s = sacRate({ usedBar: num('sac-bar'), cylLitres: num('sac-cyl', 12), depthM: num('sac-depth'), minutes: num('sac-min', 1) });
  const need = gasNeeded({ sac: s, depthM: num('sac-depth'), minutes: num('sac-min', 1) });
  $('sac-results').innerHTML =
    resultRow(`${S.sacResultLabel} (L/dk)`, `<b>${s}</b>`) +
    resultRow(S.gasNeededLabel, `<b>${need} L</b>`) +
    resultRow(S.thirdsLabel, `<b>${Math.ceil(need / 3)} L</b>`);
}

function renderConv() {
  const v = num('conv-value');
  const kind = $('conv-kind').value;
  let out = '';
  if (kind === 'depth') out = resultRow(`${v} m`, `<b>${mToFt(v)} ft</b>`) + resultRow(`${v} ft`, `<b>${ftToM(v)} m</b>`);
  else if (kind === 'pressure') out = resultRow(`${v} bar`, `<b>${barToPsi(v)} psi</b>`) + resultRow(`${v} psi`, `<b>${psiToBar(v)} bar</b>`);
  else out = resultRow(`${v} °C`, `<b>${cToF(v)} °F</b>`) + resultRow(`${v} °F`, `<b>${fToC(v)} °C</b>`);
  $('conv-results').innerHTML = out;
}

function renderTools() {
  renderNitrox();
  renderNdl();
  renderSac();
  renderConv();
  paintTimer();
}

for (const id of ['nx-o2', 'nx-depth', 'nx-ceil']) $(id).addEventListener('input', renderNitrox);
$('ndl-depth').addEventListener('input', renderNdl);
for (const id of ['sac-bar', 'sac-cyl', 'sac-depth', 'sac-min']) $(id).addEventListener('input', renderSac);
for (const id of ['conv-value', 'conv-kind']) $(id).addEventListener('input', renderConv);

// Safety-stop timer (timestamp-based so background throttling can't cheat it)
let timerTotal = 180;
let timerLeft = 180;
let timerId = null;
let timerEndAt = 0;

function paintTimer() {
  $('timer-display').textContent = formatCountdown(timerLeft);
  $('timer-display').classList.toggle('is-done', timerLeft <= 0);
  $('timer-bar-fill').style.width = `${timerTotal ? (100 * (timerTotal - timerLeft)) / timerTotal : 0}%`;
  $('timer-toggle').innerHTML = timerId
    ? `<span>${escapeHtml(S.timerPause)}</span>`
    : `<span>▶ ${escapeHtml(S.timerStart)}</span>`;
}

function beep(times = 3) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    let t = ctx.currentTime;
    for (let i = 0; i < times; i += 1) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.stop(t + 0.3);
      t += 0.4;
    }
  } catch { /* audio unavailable — visual alert still shows */ }
}

function stopTimer(finished = false) {
  clearInterval(timerId);
  timerId = null;
  if (finished) {
    timerLeft = 0;
    $('timer-status').textContent = S.timerDone;
    beep();
  }
  paintTimer();
}

$('timer-toggle').addEventListener('click', () => {
  if (timerId) {
    timerLeft = Math.max(0, Math.round((timerEndAt - Date.now()) / 1000));
    stopTimer();
    return;
  }
  if (timerLeft <= 0) timerLeft = timerTotal;
  $('timer-status').textContent = '';
  timerEndAt = Date.now() + timerLeft * 1000;
  timerId = setInterval(() => {
    timerLeft = Math.max(0, Math.round((timerEndAt - Date.now()) / 1000));
    paintTimer();
    if (timerLeft <= 0) stopTimer(true);
  }, 200);
  paintTimer();
});
$('timer-reset').addEventListener('click', () => {
  stopTimer();
  timerLeft = timerTotal;
  $('timer-status').textContent = '';
  paintTimer();
});
document.querySelectorAll('[data-timer-preset]').forEach((b) => b.addEventListener('click', () => {
  stopTimer();
  timerTotal = Number(b.dataset.timerPreset);
  timerLeft = timerTotal;
  $('timer-custom').value = String(timerTotal);
  $('timer-status').textContent = '';
  paintTimer();
}));
$('timer-custom').addEventListener('input', () => {
  stopTimer();
  timerTotal = Math.min(3600, Math.max(5, Math.round(Number($('timer-custom').value) || 180)));
  timerLeft = timerTotal;
  $('timer-status').textContent = '';
  paintTimer();
});

// Dive logbook
function renderDives() {
  const list = [...dives].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  $('dive-empty').hidden = list.length > 0;
  $('dive-list').innerHTML = list.map((d) => `
    <li><strong>${escapeHtml(d.date)}</strong> — ${escapeHtml(d.site || '—')} · ${d.depthM} m · ${d.timeMin} ${S.minShort} · ${escapeHtml(d.mix || (lang === 'tr' ? 'Hava' : 'Air'))}
    ${d.notes ? `<br><span class="meta">${escapeHtml(d.notes)}</span>` : ''}
    <br><button class="ghost-btn" data-dive-del="${d.id}">${escapeHtml(S.diveDelete)}</button></li>`).join('');
}

$('add-dive').addEventListener('click', () => {
  $('dive-form').reset();
  $('dive-id').value = '';
  $('dive-errors').textContent = '';
  $('dive-dialog').showModal();
});
$('dive-save').addEventListener('click', async (ev) => {
  ev.preventDefault();
  const input = {
    id: $('dive-id').value || newId('dive'),
    date: $('dive-date').value, site: $('dive-site').value,
    depthM: Number($('dive-depth').value), timeMin: Number($('dive-time').value),
    mix: $('dive-mix').value, notes: $('dive-notes').value,
  };
  const { value, errors } = validateDive(input);
  if (Object.keys(errors).length) {
    $('dive-errors').textContent = Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join(' · ');
    return;
  }
  await store.putDive({ ...value, createdAt: new Date().toISOString() });
  $('dive-dialog').close();
  await refresh();
});
$('dive-list').addEventListener('click', async (ev) => {
  const btn = ev.target.closest('[data-dive-del]');
  if (!btn) return;
  if (!confirm(lang === 'tr' ? 'Bu dalış kaydı silinsin mi?' : 'Delete this dive?')) return;
  await store.deleteDive(btn.dataset.diveDel);
  await refresh();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(
    () => { $('sw-status').textContent = 'sw: on'; },
    () => { $('sw-status').textContent = 'sw: off'; },
  );
}

await load();
renderAll();
if (location.hash.startsWith('#/equipment/')) {
  const id = decodeURIComponent(location.hash.replace('#/equipment/', ''));
  if (id) openDetail(id);
}
