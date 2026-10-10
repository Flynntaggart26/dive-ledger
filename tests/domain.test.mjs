import test from 'node:test';
import assert from 'node:assert/strict';
import {
  equipmentToCsv,
  getServiceStatus,
  parseBackup,
  validateDive,
  validateEquipment,
  validateServiceEntry,
} from '../src/domain.mjs';

const validEquipment = {
  id: 'gear-1',
  type: 'regulator',
  name: 'Primary regulator',
  brand: 'Aqua',
  model: 'A1',
  serialNumber: 'ZX-9',
  purchaseDate: '2024-05-11',
  nextServiceDate: '2026-11-08',
  notes: '',
};

test('service status uses UTC date boundaries and leaves unset dates explicit', () => {
  assert.equal(getServiceStatus('', '2026-10-08'), 'unset');
  assert.equal(getServiceStatus('2026-10-07', '2026-10-08'), 'overdue');
  assert.equal(getServiceStatus('2026-10-08', '2026-10-08'), 'soon');
  assert.equal(getServiceStatus('2026-11-07', '2026-10-08'), 'soon');
  assert.equal(getServiceStatus('2026-11-08', '2026-10-08'), 'current');
});

test('equipment validation trims fields and preserves a valid service record', () => {
  const result = validateEquipment({ ...validEquipment, name: '  Primary regulator  ', serialNumber: ' ZX-9 ' });

  assert.deepEqual(result.errors, {});
  assert.equal(result.value.name, 'Primary regulator');
  assert.equal(result.value.serialNumber, 'ZX-9');
  assert.equal(result.value.nextServiceDate, '2026-11-08');
});

test('equipment validation rejects missing names, unsupported types, and impossible dates', () => {
  const result = validateEquipment({ type: 'parachute', name: ' ', purchaseDate: '2026-02-30' });

  assert.equal(result.errors.name, 'required');
  assert.equal(result.errors.type, 'invalid');
  assert.equal(result.errors.purchaseDate, 'invalid');
});

test('service entry requires a real service date and a description', () => {
  const invalid = validateServiceEntry({ equipmentId: 'gear-1', serviceDate: '2026-02-30', description: '' });
  const valid = validateServiceEntry({ equipmentId: 'gear-1', serviceDate: '2026-03-04', description: 'Annual regulator service' });

  assert.equal(invalid.errors.serviceDate, 'invalid');
  assert.equal(invalid.errors.description, 'required');
  assert.deepEqual(valid.errors, {});
  assert.equal(valid.value.description, 'Annual regulator service');
});

test('equipment CSV quotes commas and embedded double quotes', () => {
  const csv = equipmentToCsv([{ ...validEquipment, name: 'First, stage', serialNumber: 'ZX-"9"' }]);

  assert.equal(csv, 'Type,Name,Brand,Model,Serial number,Purchase date,Next service date,Notes\n"regulator","First, stage","Aqua","A1","ZX-""9""","2024-05-11","2026-11-08",""');
});

test('dive log validation requires a real date and sane depth/time', () => {
  const bad = validateDive({ id: 'd1', date: '2026-02-30', depthM: -5, timeMin: 'x' });
  const good = validateDive({ id: 'd1', date: '2026-06-04', site: 'Kaş', depthM: 22, timeMin: 45, mix: 'EAN32' });

  assert.equal(bad.errors.date, 'invalid');
  assert.equal(bad.errors.depthM, 'invalid');
  assert.equal(bad.errors.timeMin, 'invalid');
  assert.deepEqual(good.errors, {});
});

test('backup parser accepts the supported format and rejects malformed or unknown versions', () => {
  const document = {
    format: 'dive-ledger-backup',
    version: 1,
    exportedAt: '2026-10-08T12:00:00.000Z',
    data: { equipment: [validEquipment], serviceEntries: [], checklist: [] },
  };

  assert.deepEqual(parseBackup(JSON.stringify(document)), { ...document, data: { ...document.data, dives: [] } });
  assert.throws(() => parseBackup('{bad json'), /JSON/);
  assert.throws(() => parseBackup(JSON.stringify({ ...document, version: 99 })), /format or version/);
});
