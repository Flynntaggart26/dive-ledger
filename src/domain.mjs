export const EQUIPMENT_TYPES = Object.freeze(['regulator', 'bcd', 'cylinder', 'computer', 'other']);
export const BACKUP_FORMAT = 'dive-ledger-backup';
export const BACKUP_VERSION = 1;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function dayNumber(value) {
  const [year, month, day] = value.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
}

export function getServiceStatus(nextServiceDate, today, reminderDays = 30) {
  if (!nextServiceDate) return 'unset';
  if (!isDateKey(nextServiceDate) || !isDateKey(today) || !Number.isFinite(reminderDays) || reminderDays < 0) return 'invalid';
  const daysUntilDue = dayNumber(nextServiceDate) - dayNumber(today);
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= reminderDays) return 'soon';
  return 'current';
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateEquipment(input = {}) {
  const value = {
    ...input,
    id: cleanText(input.id),
    type: cleanText(input.type),
    name: cleanText(input.name),
    brand: cleanText(input.brand),
    model: cleanText(input.model),
    serialNumber: cleanText(input.serialNumber),
    purchaseDate: cleanText(input.purchaseDate),
    lastServiceDate: cleanText(input.lastServiceDate),
    nextServiceDate: cleanText(input.nextServiceDate),
    notes: cleanText(input.notes),
  };
  const errors = {};

  if (!value.name) errors.name = 'required';
  if (!EQUIPMENT_TYPES.includes(value.type)) errors.type = 'invalid';
  for (const key of ['purchaseDate', 'lastServiceDate', 'nextServiceDate']) {
    if (value[key] && !isDateKey(value[key])) errors[key] = 'invalid';
  }

  return { value, errors };
}

export function validateServiceEntry(input = {}) {
  const value = {
    ...input,
    equipmentId: cleanText(input.equipmentId),
    serviceDate: cleanText(input.serviceDate),
    serviceProvider: cleanText(input.serviceProvider),
    description: cleanText(input.description),
    nextServiceDate: cleanText(input.nextServiceDate),
    notes: cleanText(input.notes),
  };
  const errors = {};

  if (!value.equipmentId) errors.equipmentId = 'required';
  if (!isDateKey(value.serviceDate)) errors.serviceDate = 'invalid';
  if (!value.description) errors.description = 'required';
  if (value.nextServiceDate && !isDateKey(value.nextServiceDate)) errors.nextServiceDate = 'invalid';

  return { value, errors };
}

const EQUIPMENT_CSV_FIELDS = [
  ['Type', 'type'], ['Name', 'name'], ['Brand', 'brand'], ['Model', 'model'],
  ['Serial number', 'serialNumber'], ['Purchase date', 'purchaseDate'], ['Next service date', 'nextServiceDate'], ['Notes', 'notes'],
];

function quoteCsv(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export function equipmentToCsv(equipment) {
  const header = EQUIPMENT_CSV_FIELDS.map(([label]) => label).join(',');
  const rows = equipment.map((item) => EQUIPMENT_CSV_FIELDS.map(([, field]) => quoteCsv(item[field])).join(','));
  return [header, ...rows].join('\n');
}

export function parseBackup(jsonText) {
  let document;
  try {
    document = JSON.parse(jsonText);
  } catch {
    throw new Error('Backup is not valid JSON.');
  }

  if (document?.format !== BACKUP_FORMAT || document?.version !== BACKUP_VERSION) {
    throw new Error('Backup format or version is not supported.');
  }
  if (!document.data || !Array.isArray(document.data.equipment) || !Array.isArray(document.data.serviceEntries) || !Array.isArray(document.data.checklist)) {
    throw new Error('Backup data is incomplete.');
  }
  if (document.data.equipment.some((item) => !item?.id || Object.keys(validateEquipment(item).errors).length)) {
    throw new Error('Backup contains invalid equipment.');
  }
  if (document.data.serviceEntries.some((entry) => !entry?.id || Object.keys(validateServiceEntry(entry).errors).length)) {
    throw new Error('Backup contains invalid service entries.');
  }
  if (document.data.checklist.some((item) => !item?.id || typeof item.label !== 'string' || typeof item.done !== 'boolean')) {
    throw new Error('Backup contains invalid checklist items.');
  }

  return document;
}
