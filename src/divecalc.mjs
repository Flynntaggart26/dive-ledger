// Dive planning math — pure functions, no DOM.
// Formulas: MOD = 10 * (ppO2/FO2 - 1); ppO2 = FO2 * (D/10 + 1);
// EAD = (D + 10) * (FN2/0.79) - 10 (metres, seawater).
// Conservative rounding: MOD down, EAD up, ppO2 display up.
// NDL data: US Navy Diving Manual Rev 7, Table 9-7 (air, fsw -> minutes).
// Metric handling: convert m -> fsw, then use the NEXT table depth
// at or below... (i.e. the next deeper listed depth), and report it.

const M_TO_FSW = 3.28084;
const FSW_TO_M = 0.3048;
const BAR_TO_PSI = 14.5038;

// [depth fsw, no-stop limit minutes]; null = unlimited.
const USN_NDL = Object.freeze([
  [10, null], [15, null], [20, null],
  [25, 1102], [30, 371], [35, 232], [40, 163], [45, 125],
  [50, 92], [55, 74], [60, 63], [70, 48], [80, 39], [90, 33],
  [100, 25], [110, 20], [120, 15], [130, 12], [140, 10],
  [150, 8], [160, 7], [170, 6], [180, 6], [190, 5],
]);

const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;

export function ata(depthM) {
  return depthM / 10 + 1;
}

/** Oxygen partial pressure (bar) at depth for a given FO2 fraction. */
export function ppo2(fo2, depthM) {
  return r2(fo2 * ata(depthM));
}

/** Maximum operating depth in whole metres, rounded DOWN (safe side). */
export function modM(fo2, ppO2max = 1.4) {
  return Math.max(0, Math.floor((ppO2max / fo2 - 1) * 10 + 1e-9));
}

/** Equivalent air depth in whole metres, rounded UP (conservative). */
export function eadM(fo2, depthM) {
  const exact = (depthM + 10) * ((1 - fo2) / 0.79) - 10;
  return Math.ceil(exact - 1e-9);
}

/** Richest whole-% O2 mix whose ppO2 stays within the ceiling at depth. */
export function bestMix(ppO2max, depthM) {
  return Math.floor((ppO2max / ata(depthM)) * 100 + 1e-9);
}

function tableEntry(fsw) {
  return USN_NDL.find(([d]) => d >= fsw - 1e-9) || null;
}

/** Air NDL for a metric depth. Conservative: next deeper USN entry. */
export function ndlAirM(depthM) {
  if (!Number.isFinite(depthM) || depthM < 0 || depthM > 60) return { error: 'out-of-range' };
  const entry = tableEntry(depthM * M_TO_FSW);
  if (!entry) return { error: 'beyond-table' };
  const [fsw, ndl] = entry;
  return {
    tableDepthM: Math.ceil(fsw * FSW_TO_M - 1e-9),
    tableDepthFsw: fsw,
    ndlMin: ndl,
    unlimited: ndl === null,
  };
}

/** Nitrox NDL via EAD; refuses dives above the ppO2 ceiling. */
export function ndlNitroxM(fo2, depthM, ppO2max = 1.4) {
  if (!Number.isFinite(fo2) || fo2 < 0.21 || fo2 > 1) return { error: 'bad-mix' };
  const p = ppo2(fo2, depthM);
  if (p > ppO2max + 1e-9) return { error: 'ppO2-exceeded', ppo2: p };
  const ead = eadM(fo2, depthM);
  const entry = tableEntry(ead * M_TO_FSW);
  if (!entry) return { error: 'beyond-table', eadM: ead, ppo2: p };
  const [fsw, ndl] = entry;
  return {
    eadM: ead,
    ppo2: p,
    tableDepthM: Math.ceil(fsw * FSW_TO_M - 1e-9),
    tableDepthFsw: fsw,
    ndlMin: ndl,
    unlimited: ndl === null,
  };
}

/** Surface-equivalent gas use in L/min. */
export function sacRate({ usedBar, cylLitres, depthM, minutes }) {
  return r1((usedBar * cylLitres) / (ata(depthM) * minutes));
}

/** Gas needed in litres for a planned exposure. */
export function gasNeeded({ sac, depthM, minutes }) {
  return Math.round(sac * ata(depthM) * minutes);
}

export const mToFt = (m) => r1(m * M_TO_FSW);
export const ftToM = (ft) => r1(ft * FSW_TO_M);
export const barToPsi = (bar) => r1(bar * BAR_TO_PSI);
export const psiToBar = (psi) => r1(psi / BAR_TO_PSI);
export const cToF = (c) => r1((c * 9) / 5 + 32);
export const fToC = (f) => r1(((f - 32) * 5) / 9);

export function formatCountdown(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
