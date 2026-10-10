import QRCode from 'qrcode';

export function equipmentUrl(equipmentId, base = location.origin + location.pathname) {
  return `${base}#/equipment/${encodeURIComponent(equipmentId)}`;
}

export function qrContainsOnlyId(url) {
  try {
    const hash = new URL(url, 'http://local').hash;
    return hash.startsWith('#/equipment/') && !/serial|service|note/i.test(url);
  } catch {
    return false;
  }
}

export function qrDataUrl(url) {
  return QRCode.toDataURL(url, { margin: 1, width: 360 });
}
