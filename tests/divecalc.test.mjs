import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bestMix,
  cToF,
  eadM,
  fToC,
  formatCountdown,
  ftToM,
  gasNeeded,
  modM,
  mToFt,
  barToPsi,
  ndlAirM,
  ndlNitroxM,
  ppo2,
  psiToBar,
  sacRate,
} from '../src/divecalc.mjs';

// Hand-checked against US Navy Diving Manual Rev 7 Table 9-7
// (via navsea PDF + two corroborating Table 9-7 transcriptions)
// and standard nitrox formulas (MOD/EAD/ppO2) corroborated by
// TDI, NOAA, Advenway and PADI-manual-based references.

test('MOD rounds down to the safe side (EAN32@1.4 -> 33 m)', () => {
  assert.equal(modM(0.32, 1.4), 33);
  assert.equal(modM(0.36, 1.4), 28);
  assert.equal(modM(0.21, 1.4), 56);
  assert.equal(modM(0.32, 1.6), 40);
});

test('ppO2 at depth follows FO2 x ATA (EAN32@30 m -> 1.28)', () => {
  assert.equal(ppo2(0.32, 30), 1.28);
  assert.equal(ppo2(0.21, 0), 0.21);
});

test('EAD rounds up to the conservative side (EAN32@30 m -> 25 m)', () => {
  assert.equal(eadM(0.32, 30), 25);
  assert.equal(eadM(0.21, 30), 30);
});

test('best mix never exceeds the ppO2 ceiling (30 m @1.4 -> EAN35)', () => {
  assert.equal(bestMix(1.4, 30), 35);
  assert.ok(ppo2(bestMix(1.4, 30) / 100, 30) <= 1.4);
});

test('air NDL lookup rounds depth up to the next USN table entry', () => {
  assert.deepEqual(ndlAirM(30), { tableDepthM: 31, tableDepthFsw: 100, ndlMin: 25, unlimited: false });
  assert.deepEqual(ndlAirM(18), { tableDepthM: 19, tableDepthFsw: 60, ndlMin: 63, unlimited: false });
  assert.deepEqual(ndlAirM(40), { tableDepthM: 43, tableDepthFsw: 140, ndlMin: 10, unlimited: false });
  const shallow = ndlAirM(3);
  assert.equal(shallow.unlimited, true);
  assert.equal(shallow.tableDepthFsw, 10);
});

test('nitrox NDL uses EAD and refuses dives above the ppO2 ceiling', () => {
  const ok = ndlNitroxM(0.32, 30, 1.4);
  assert.equal(ok.eadM, 25);
  assert.equal(ok.tableDepthFsw, 90);
  assert.equal(ok.ndlMin, 33);
  const bad = ndlNitroxM(0.4, 40, 1.4);
  assert.equal(bad.error, 'ppO2-exceeded');
  assert.ok(bad.ppo2 > 1.4);
});

test('SAC and gas planning use surface-equivalent litres', () => {
  assert.equal(sacRate({ usedBar: 100, cylLitres: 12, depthM: 20, minutes: 30 }), 13.3);
  assert.equal(gasNeeded({ sac: 15, depthM: 20, minutes: 30 }), 1350);
});

test('unit converters match standard factors', () => {
  assert.equal(mToFt(10), 32.8);
  assert.equal(ftToM(33), 10.1);
  assert.equal(barToPsi(200), 2900.8);
  assert.equal(psiToBar(3000), 206.8);
  assert.equal(cToF(20), 68);
  assert.equal(fToC(68), 20);
});

test('countdown formatter pads minutes and seconds', () => {
  assert.equal(formatCountdown(180), '03:00');
  assert.equal(formatCountdown(65), '01:05');
  assert.equal(formatCountdown(0), '00:00');
});
