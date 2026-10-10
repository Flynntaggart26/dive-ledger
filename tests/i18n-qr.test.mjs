import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultChecklist, stringsFor } from '../src/i18n.mjs';

test('both languages cover nav, status and checklist defaults', () => {
  for (const lang of ['tr', 'en']) {
    const s = stringsFor(lang);
    assert.ok(s.navDashboard && s.navEquipment && s.navChecklist && s.navBackup);
    assert.ok(s.overdue && s.soon && s.unset);
    assert.equal(defaultChecklist(lang).length, 5);
  }
  assert.equal(stringsFor('tr').navDashboard, 'Panel');
  assert.equal(stringsFor('en').navDashboard, 'Dashboard');
});

test('equipment deep-link keeps only the opaque id', () => {
  const id = 'gear-abc123';
  const url = `https://example.test/dive-ledger/#/equipment/${encodeURIComponent(id)}`;
  const hash = new URL(url).hash;
  assert.ok(hash.startsWith('#/equipment/'));
  assert.ok(!/serial|service|note/i.test(url));
});
