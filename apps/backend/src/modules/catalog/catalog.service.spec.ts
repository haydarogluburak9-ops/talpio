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
      { key: 'packagingType', label: 'Ambalaj', type: 'enum', options: ['Varil'] },
      { key: 'tolerance', label: 'Tolerans', type: 'decimal', unit: '%' },
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
