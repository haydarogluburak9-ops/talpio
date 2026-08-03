/**
 * Başlangıç hizmet kategorileri.
 *
 * Bu liste yalnızca ilk kurulumu tohumlar; kategoriler çalışma zamanında
 * veritabanından okunur ve admin panelinden yönetilir. Kod içinde hiçbir yerde
 * kategori adına göre dallanma yapılmaz.
 */
export interface SubcategorySeed {
  slug: string;
  name: string;
}

export interface CategorySeed {
  slug: string;
  name: string;
  description: string;
  iconKey: string;
  subcategories: SubcategorySeed[];
}

export const SERVICE_CATEGORIES: CategorySeed[] = [
  {
    slug: 'su-tesisati',
    name: 'Su tesisatı',
    description: 'Tıkanıklık açma, kaçak tespiti, musluk ve tesisat onarımı',
    iconKey: 'pipe',
    subcategories: [
      { slug: 'tikanik-acma', name: 'Tıkanıklık açma' },
      { slug: 'su-kacagi', name: 'Su kaçağı tespiti' },
      { slug: 'musluk-batarya', name: 'Musluk ve batarya' },
      { slug: 'petek-tesisat', name: 'Petek ve tesisat montajı' },
    ],
  },
  {
    slug: 'elektrik',
    name: 'Elektrik',
    description: 'Priz, anahtar, aydınlatma, sigorta ve elektrik tesisatı',
    iconKey: 'bolt',
    subcategories: [
      { slug: 'priz-anahtar', name: 'Priz ve anahtar' },
      { slug: 'aydinlatma', name: 'Aydınlatma montajı' },
      { slug: 'sigorta-pano', name: 'Sigorta ve pano' },
      { slug: 'elektrik-tesisati', name: 'Elektrik tesisatı' },
    ],
  },
  {
    slug: 'klima',
    name: 'Klima',
    description: 'Klima montajı, bakımı, gaz dolumu ve arıza onarımı',
    iconKey: 'wind',
    subcategories: [
      { slug: 'klima-montaj', name: 'Klima montajı' },
      { slug: 'klima-bakim', name: 'Klima bakımı' },
      { slug: 'gaz-dolumu', name: 'Gaz dolumu' },
    ],
  },
  {
    slug: 'kombi-isitma',
    name: 'Kombi ve ısıtma',
    description: 'Kombi bakımı, petek temizliği ve ısıtma sistemleri',
    iconKey: 'flame',
    subcategories: [
      { slug: 'kombi-bakim', name: 'Kombi bakımı' },
      { slug: 'kombi-ariza', name: 'Kombi arızası' },
      { slug: 'petek-temizligi', name: 'Petek temizliği' },
    ],
  },
  {
    slug: 'pvc-dograma',
    name: 'PVC ve doğrama',
    description: 'PVC pencere, kapı, sineklik ve cam balkon işleri',
    iconKey: 'window',
    subcategories: [
      { slug: 'pvc-pencere', name: 'PVC pencere' },
      { slug: 'sineklik', name: 'Sineklik' },
      { slug: 'cam-balkon', name: 'Cam balkon' },
      { slug: 'pvc-tamir', name: 'PVC tamiri' },
    ],
  },
  {
    slug: 'boya-badana',
    name: 'Boya ve badana',
    description: 'İç ve dış cephe boyası, alçı, saten ve dekoratif uygulamalar',
    iconKey: 'roller',
    subcategories: [
      { slug: 'ic-cephe', name: 'İç cephe boyası' },
      { slug: 'dis-cephe', name: 'Dış cephe boyası' },
      { slug: 'alci-saten', name: 'Alçı ve saten' },
      { slug: 'dekoratif-boya', name: 'Dekoratif boya' },
    ],
  },
  {
    slug: 'mobilya-marangoz',
    name: 'Mobilya ve marangozluk',
    description: 'Mobilya montajı, tamiri, ölçüye özel üretim ve dolap işleri',
    iconKey: 'hammer',
    subcategories: [
      { slug: 'mobilya-montaj', name: 'Mobilya montajı' },
      { slug: 'mobilya-tamir', name: 'Mobilya tamiri' },
      { slug: 'olcuye-ozel', name: 'Ölçüye özel üretim' },
      { slug: 'mutfak-dolabi', name: 'Mutfak dolabı' },
    ],
  },
  {
    slug: 'temizlik',
    name: 'Temizlik',
    description: 'Ev, ofis, inşaat sonrası ve koltuk yıkama hizmetleri',
    iconKey: 'sparkles',
    subcategories: [
      { slug: 'ev-temizligi', name: 'Ev temizliği' },
      { slug: 'ofis-temizligi', name: 'Ofis temizliği' },
      { slug: 'insaat-sonrasi', name: 'İnşaat sonrası temizlik' },
      { slug: 'koltuk-hali', name: 'Koltuk ve halı yıkama' },
    ],
  },
  {
    slug: 'nakliyat',
    name: 'Evden eve nakliyat',
    description: 'Şehir içi ve şehirler arası taşıma, asansörlü nakliyat',
    iconKey: 'truck',
    subcategories: [
      { slug: 'sehir-ici', name: 'Şehir içi nakliyat' },
      { slug: 'sehirler-arasi', name: 'Şehirler arası nakliyat' },
      { slug: 'asansorlu', name: 'Asansörlü taşıma' },
      { slug: 'esya-depolama', name: 'Eşya depolama' },
    ],
  },
  {
    slug: 'beyaz-esya-servisi',
    name: 'Beyaz eşya servisi',
    description: 'Buzdolabı, çamaşır makinesi, bulaşık makinesi ve fırın onarımı',
    iconKey: 'washer',
    subcategories: [
      { slug: 'buzdolabi', name: 'Buzdolabı' },
      { slug: 'camasir-makinesi', name: 'Çamaşır makinesi' },
      { slug: 'bulasik-makinesi', name: 'Bulaşık makinesi' },
      { slug: 'firin-ocak', name: 'Fırın ve ocak' },
    ],
  },
  {
    slug: 'cilingir',
    name: 'Çilingir',
    description: 'Kapı açma, kilit değişimi ve çelik kapı hizmetleri',
    iconKey: 'key',
    subcategories: [
      { slug: 'kapi-acma', name: 'Kapı açma' },
      { slug: 'kilit-degisimi', name: 'Kilit değişimi' },
      { slug: 'celik-kapi', name: 'Çelik kapı' },
      { slug: 'oto-cilingir', name: 'Oto çilingir' },
    ],
  },
  {
    slug: 'insaat-tadilat',
    name: 'İnşaat ve tadilat',
    description: 'Banyo ve mutfak yenileme, alçıpan, fayans ve zemin işleri',
    iconKey: 'building',
    subcategories: [
      { slug: 'banyo-yenileme', name: 'Banyo yenileme' },
      { slug: 'mutfak-yenileme', name: 'Mutfak yenileme' },
      { slug: 'alcipan', name: 'Alçıpan' },
      { slug: 'fayans-seramik', name: 'Fayans ve seramik' },
      { slug: 'zemin-kaplama', name: 'Zemin kaplama' },
    ],
  },
  {
    slug: 'bahce-isleri',
    name: 'Bahçe işleri',
    description: 'Peyzaj, çim bakımı, ağaç budama ve sulama sistemleri',
    iconKey: 'leaf',
    subcategories: [
      { slug: 'peyzaj', name: 'Peyzaj düzenleme' },
      { slug: 'cim-bakimi', name: 'Çim bakımı' },
      { slug: 'agac-budama', name: 'Ağaç budama' },
      { slug: 'sulama-sistemi', name: 'Sulama sistemi' },
    ],
  },
  {
    slug: 'kamera-guvenlik',
    name: 'Kamera ve güvenlik sistemleri',
    description: 'Güvenlik kamerası, alarm ve diyafon sistemleri kurulumu',
    iconKey: 'shield',
    subcategories: [
      { slug: 'guvenlik-kamerasi', name: 'Güvenlik kamerası' },
      { slug: 'alarm-sistemi', name: 'Alarm sistemi' },
      { slug: 'diyafon', name: 'Diyafon ve interkom' },
    ],
  },
  {
    slug: 'bilgisayar-teknik-servis',
    name: 'Bilgisayar ve teknik servis',
    description: 'Bilgisayar tamiri, ağ kurulumu, televizyon ve uydu sistemleri',
    iconKey: 'monitor',
    subcategories: [
      { slug: 'bilgisayar-tamiri', name: 'Bilgisayar tamiri' },
      { slug: 'ag-kurulumu', name: 'Ağ ve internet kurulumu' },
      { slug: 'televizyon-uydu', name: 'Televizyon ve uydu' },
      { slug: 'yazici-servisi', name: 'Yazıcı servisi' },
    ],
  },
];
