import { AppException } from '@common/errors/app.exception';

import { CatalogService } from './catalog.service';

describe('CatalogService.getCategoryAttributeSchema', () => {
  const prisma = {
    serviceCategory: { findFirst: jest.fn() },
    attributeSchema: { findFirst: jest.fn() },
  };

  const service = new CatalogService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.serviceCategory.findFirst.mockResolvedValue({ id: 'cat-1' });
  });

  it('kategori yoksa NOT_FOUND fırlatır', async () => {
    prisma.serviceCategory.findFirst.mockResolvedValue(null);
    await expect(service.getCategoryAttributeSchema('yok')).rejects.toBeInstanceOf(AppException);
  });

  it('şema tanımlı değilse boş alan listesi döner', async () => {
    prisma.attributeSchema.findFirst.mockResolvedValue(null);

    await expect(service.getCategoryAttributeSchema('cat-1')).resolves.toEqual({
      categoryId: 'cat-1',
      version: null,
      fields: [],
    });
  });

  it('id veya slug ile aranır', async () => {
    prisma.attributeSchema.findFirst.mockResolvedValue(null);
    await service.getCategoryAttributeSchema('madeni-yag-kimya');

    expect(prisma.serviceCategory.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ id: 'madeni-yag-kimya' }, { slug: 'madeni-yag-kimya' }],
        }),
      }),
    );
  });

  it('geçerli alanları döndürür, tanınmayanları eler', async () => {
    prisma.attributeSchema.findFirst.mockResolvedValue({
      version: 2,
      schema: {
        version: 2,
        fields: [
          { key: 'viscosity', label: 'Viskozite', type: 'string', required: true },
          { key: 'packagingType', label: 'Ambalaj', type: 'enum', options: ['Varil', 42] },
          { key: 'tolerance', label: 'Tolerans', type: 'decimal', unit: '%' },
          { key: 'bad', label: 'Desteklenmeyen', type: 'multiselect' },
          { key: 'missingLabel', type: 'string' },
          'çöp',
        ],
      },
    });

    const result = await service.getCategoryAttributeSchema('cat-1');

    expect(result.version).toBe(2);
    expect(result.fields).toEqual([
      { key: 'viscosity', label: 'Viskozite', type: 'string', required: true },
      {
        key: 'packagingType',
        label: 'Ambalaj',
        type: 'enum',
        options: [{ value: 'Varil', label: 'Varil' }],
      },
      { key: 'tolerance', label: 'Tolerans', type: 'decimal', unit: '%' },
    ]);
  });

  it('çok dilli metinleri olduğu gibi taşır', async () => {
    prisma.attributeSchema.findFirst.mockResolvedValue({
      version: 3,
      schema: {
        version: 3,
        fields: [
          {
            key: 'minShelfLifeDays',
            label: { tr: 'Asgari raf ömrü', en: 'Minimum shelf life' },
            type: 'number',
            required: true,
            unit: { tr: 'gün', en: 'days' },
            description: { tr: 'Teslimattan itibaren', en: 'From the delivery date' },
          },
          {
            key: 'packagingType',
            label: { tr: 'Ambalaj', en: 'Packaging' },
            type: 'enum',
            options: [{ value: 'case', label: { tr: 'Koli', en: 'Case' } }],
          },
        ],
      },
    });

    const result = await service.getCategoryAttributeSchema('cat-1');

    expect(result.fields).toEqual([
      {
        key: 'minShelfLifeDays',
        label: { tr: 'Asgari raf ömrü', en: 'Minimum shelf life' },
        type: 'number',
        required: true,
        unit: { tr: 'gün', en: 'days' },
        description: { tr: 'Teslimattan itibaren', en: 'From the delivery date' },
      },
      {
        key: 'packagingType',
        label: { tr: 'Ambalaj', en: 'Packaging' },
        type: 'enum',
        options: [{ value: 'case', label: { tr: 'Koli', en: 'Case' } }],
      },
    ]);
  });

  it('düz string ve çok dilli biçim aynı şemada birlikte bulunabilir', async () => {
    prisma.attributeSchema.findFirst.mockResolvedValue({
      version: 1,
      schema: {
        version: 1,
        fields: [
          { key: 'legacy', label: 'Viskozite', type: 'string', description: 'Örn. 5W-30' },
          { key: 'modern', label: { tr: 'Ambalaj', en: 'Packaging' }, type: 'string' },
        ],
      },
    });

    const result = await service.getCategoryAttributeSchema('cat-1');

    expect(result.fields).toEqual([
      { key: 'legacy', label: 'Viskozite', type: 'string', description: 'Örn. 5W-30' },
      { key: 'modern', label: { tr: 'Ambalaj', en: 'Packaging' }, type: 'string' },
    ]);
  });

  it('bozuk çok dilli değerleri eler', async () => {
    prisma.attributeSchema.findFirst.mockResolvedValue({
      version: 1,
      schema: {
        version: 1,
        fields: [
          { key: 'emptyLabel', label: {}, type: 'string' },
          { key: 'nonStringLabel', label: { tr: 42, en: null }, type: 'string' },
          { key: 'arrayLabel', label: ['Ambalaj'], type: 'string' },
          {
            key: 'partial',
            label: { tr: 'Ambalaj', en: '', de: 7 },
            type: 'string',
            unit: {},
            description: { en: null },
          },
        ],
      },
    });

    const result = await service.getCategoryAttributeSchema('cat-1');

    // Kullanılabilir tek dil kalsa da alan ayakta kalır; boş ve string olmayan
    // diller ile tamamen boşalan unit/description atılır.
    expect(result.fields).toEqual([{ key: 'partial', label: { tr: 'Ambalaj' }, type: 'string' }]);
  });

  it('seçeneklerde eski ve yeni biçimi birlikte kabul eder', async () => {
    prisma.attributeSchema.findFirst.mockResolvedValue({
      version: 1,
      schema: {
        version: 1,
        fields: [
          {
            key: 'packagingType',
            label: 'Ambalaj',
            type: 'enum',
            options: [
              'Varil',
              { value: 'pail', label: { tr: 'Bidon', en: 'Pail' } },
              { value: 'ibc' },
              { label: { tr: 'Değersiz' } },
              { value: '', label: 'Boş' },
              null,
            ],
          },
        ],
      },
    });

    const result = await service.getCategoryAttributeSchema('cat-1');

    expect(result.fields[0]?.options).toEqual([
      { value: 'Varil', label: 'Varil' },
      { value: 'pail', label: { tr: 'Bidon', en: 'Pail' } },
      // Etiketi bozuk seçenek elenmez; değerin kendisi etiket olur.
      { value: 'ibc', label: 'ibc' },
    ]);
  });

  it('şema bozuksa boş döner ve hata fırlatmaz', async () => {
    prisma.attributeSchema.findFirst.mockResolvedValue({
      version: 1,
      schema: { fields: 'yanlış' },
    });

    await expect(service.getCategoryAttributeSchema('cat-1')).resolves.toEqual({
      categoryId: 'cat-1',
      version: null,
      fields: [],
    });
  });
});
