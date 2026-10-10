const STRINGS = {
  tr: {
    tagline: 'Ekipman Servis Defteri',
    navDashboard: 'Panel', navEquipment: 'Ekipman', navChecklist: 'Kontrol', navBackup: 'Yedek',
    dashboardTitle: 'Servis paneli',
    dashboardLede: 'Kullanıcının girdiği bakım tarihleri burada gruplanır. Uygulama üretici aralığı uydurmaz.',
    attentionTitle: 'İlgilenilmesi gerekenler', gotoChecklist: 'Dalış öncesi listeye git →',
    equipmentTitle: 'Ekipmanlar', equipmentLede: 'Regülatör, BCD, tüp, bilgisayar ve diğer ekipmanlar.',
    addEquipment: '+ Ekipman ekle', searchPh: 'Ara: ad, marka, seri no…', filterAll: 'Tümü',
    typeRegulator: 'Regülatör', typeCylinder: 'Tüp', typeComputer: 'Bilgisayar', typeOther: 'Diğer',
    showArchived: 'Arşivlenenleri göster', equipmentEmpty: 'Henüz ekipman yok. İlk kaydını ekle.',
    checklistTitle: 'Dalış öncesi kontrol', checklistLede: 'Liste cihaza kaydedilir. Maddeleri düzenleyebilirsin.',
    addCheckItem: '+ Madde', resetChecklist: 'Sıfırla',
    backupTitle: 'Yedekleme', backupLede: 'Veriler yalnızca bu cihazda durur. JSON ile yedekle, başka cihaza taşı.',
    exportJson: 'JSON indir', exportCsv: 'CSV indir', importJson: 'JSON içe aktar',
    backupNote: 'İçe aktarma mevcut verilerin üzerine yazar. Önce JSON indir.',
    eqDialogTitle: 'Ekipman', svcDialogTitle: 'Servis kaydı',
    fType: 'Tür', fName: 'Ad *', fBrand: 'Marka', fModel: 'Model', fSerial: 'Seri no',
    fPurchase: 'Alım tarihi', fNext: 'Sonraki servis (sen girersin)', fNotes: 'Notlar',
    fSvcDate: 'Servis tarihi *', fSvcNext: 'Sonraki servis', fSvcProvider: 'Servis noktası', fSvcDesc: 'Yapılan işlem *',
    cancel: 'Vazgeç', save: 'Kaydet', close: 'Kapat', svcHistory: 'Servis geçmişi',
    qrNote: 'QR yalnızca opak ekipman kimliği içerir. Aynı tarayıcı profilinde açılır.',
    addService: '+ Servis ekle', print: 'Yazdır',
    overdue: 'gecikmiş', soon: 'yaklaşan', current: 'güncel', unset: 'tarih yok',
    total: 'Toplam', archived: 'Arşivli',
  },
  en: {
    tagline: 'Gear Service Log',
    navDashboard: 'Dashboard', navEquipment: 'Gear', navChecklist: 'Checklist', navBackup: 'Backup',
    dashboardTitle: 'Service dashboard',
    dashboardLede: 'Dates you enter are grouped here. The app never invents manufacturer intervals.',
    attentionTitle: 'Needs attention', gotoChecklist: 'Go to pre-dive checklist →',
    equipmentTitle: 'Equipment', equipmentLede: 'Regulators, BCDs, cylinders, computers and other gear.',
    addEquipment: '+ Add gear', searchPh: 'Search: name, brand, serial…', filterAll: 'All',
    typeRegulator: 'Regulator', typeCylinder: 'Cylinder', typeComputer: 'Computer', typeOther: 'Other',
    showArchived: 'Show archived', equipmentEmpty: 'No gear yet. Add your first record.',
    checklistTitle: 'Pre-dive checklist', checklistLede: 'Stored on this device. You can edit items.',
    addCheckItem: '+ Item', resetChecklist: 'Reset',
    backupTitle: 'Backup', backupLede: 'Data stays on this device. Export JSON and move it yourself.',
    exportJson: 'Download JSON', exportCsv: 'Download CSV', importJson: 'Import JSON',
    backupNote: 'Import overwrites current data. Download JSON first.',
    eqDialogTitle: 'Equipment', svcDialogTitle: 'Service record',
    fType: 'Type', fName: 'Name *', fBrand: 'Brand', fModel: 'Model', fSerial: 'Serial no.',
    fPurchase: 'Purchase date', fNext: 'Next service (you enter it)', fNotes: 'Notes',
    fSvcDate: 'Service date *', fSvcNext: 'Next service', fSvcProvider: 'Service provider', fSvcDesc: 'Work done *',
    cancel: 'Cancel', save: 'Save', close: 'Close', svcHistory: 'Service history',
    qrNote: 'QR contains only the opaque gear ID. It opens in the same browser profile.',
    addService: '+ Add service', print: 'Print',
    overdue: 'overdue', soon: 'due soon', current: 'current', unset: 'no date',
    total: 'Total', archived: 'Archived',
  },
};

export function stringsFor(lang) {
  return STRINGS[lang === 'en' ? 'en' : 'tr'];
}

export function defaultChecklist(lang) {
  if (lang === 'en') {
    return ['Cylinder pressure and valve', 'Regulator breathes on both second stages', 'BCD inflates and dumps', 'Computer/personal plan ready', 'Mask, fins, exposure suit'];
  }
  return ['Tüp basıncı ve vana', 'Regülatör iki ikinci kademede nefes veriyor', 'BCD şişiyor ve tahliye çalışıyor', 'Bilgisayar/kişisel plan hazır', 'Maske, palet, elbise'];
}
