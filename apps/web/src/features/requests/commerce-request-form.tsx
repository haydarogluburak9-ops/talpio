'use client';

import { ApiError } from '@talpio/api-client';
import { RequestType } from '@talpio/types';
import { Button, Field, Input, Select, Textarea } from '@talpio/ui';
import { useEffect, useMemo, useState } from 'react';

import { useCategories, useCategoryAttributeSchema } from '@/features/catalog/use-categories';
import { useCities, useDistricts } from '@/features/catalog/use-locations';
import { useSocialProfile } from '@/features/social/use-social';
import { t } from '@/lib/i18n';

import {
  CategoryAttributeFields,
  findMissingAttributes,
  toSpecificationValues,
  type AttributeValues,
} from './category-attribute-fields';
import { useCreateCommerceRequest } from './use-requests';

const REQUEST_TYPE_OPTIONS: { value: RequestType; labelKey: string }[] = [
  { value: RequestType.PRODUCT_SUPPLY, labelKey: 'commerce.typeProductSupply' },
  { value: RequestType.WHOLESALE, labelKey: 'commerce.typeWholesale' },
  { value: RequestType.B2B_PURCHASE, labelKey: 'commerce.typeB2b' },
  { value: RequestType.SERVICE, labelKey: 'commerce.typeService' },
  { value: RequestType.MANUFACTURING, labelKey: 'commerce.typeManufacturing' },
  { value: RequestType.RENTAL, labelKey: 'commerce.typeRental' },
  { value: RequestType.LOGISTICS, labelKey: 'commerce.typeLogistics' },
  { value: RequestType.PROFESSIONAL_SERVICE, labelKey: 'commerce.typeProfessional' },
  { value: RequestType.CONSTRUCTION, labelKey: 'commerce.typeConstruction' },
  { value: RequestType.OTHER, labelKey: 'commerce.typeOther' },
];

export function CommerceRequestForm({
  storeUsername,
  initialCategorySlug,
}: {
  storeUsername?: string;
  /** Kısayol bağlantılarının kategoriyi hazır seçmesi için. */
  initialCategorySlug?: string;
}) {
  const categories = useCategories({ withSubcategories: true });
  const cities = useCities();
  const create = useCreateCommerceRequest();
  const storeProfile = useSocialProfile(storeUsername ?? '');

  const [cityId, setCityId] = useState('');
  const districts = useDistricts(cityId || undefined);
  const [error, setError] = useState<string | null>(null);
  const [attributeValues, setAttributeValues] = useState<AttributeValues>({});
  const [attributeErrors, setAttributeErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    requestType: RequestType.PRODUCT_SUPPLY as RequestType,
    title: '',
    description: '',
    categoryId: '',
    categoryPicked: false,
    subcategoryId: '',
    districtId: '',
    quantity: '',
    unit: 'adet',
    brandPreference: '',
    deliveryLocation: '',
    deliveryDeadline: '',
  });

  // Kısayol yalnızca kullanıcı kendi seçimini yapana kadar geçerlidir.
  const shortcutCategoryId = useMemo(() => {
    if (!initialCategorySlug) return '';
    return (categories.data ?? []).find((c) => c.slug === initialCategorySlug)?.id ?? '';
  }, [categories.data, initialCategorySlug]);

  const categoryId = form.categoryPicked || form.categoryId ? form.categoryId : shortcutCategoryId;

  const selectedCategory = useMemo(
    () => (categories.data ?? []).find((c) => c.id === categoryId),
    [categories.data, categoryId],
  );

  const subcategories = selectedCategory?.subcategories ?? [];
  const store = storeProfile.data?.kind === 'BUSINESS' ? storeProfile.data : null;

  const attributeSchema = useCategoryAttributeSchema(categoryId || undefined);
  const attributeFields = attributeSchema.data?.fields ?? [];
  const attributeSchemaPending = Boolean(categoryId) && attributeSchema.isPending;

  useEffect(() => {
    const firstCategory = store?.business?.categories[0]?.id;
    if (!firstCategory) return;
    setForm((current) =>
      current.categoryId ? current : { ...current, categoryId: firstCategory },
    );
  }, [store?.business?.categories]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setAttributeErrors({});

    if (
      !form.title.trim() ||
      form.title.trim().length < 5 ||
      !form.description.trim() ||
      form.description.trim().length < 10 ||
      !categoryId ||
      !cityId ||
      !form.districtId ||
      !form.deliveryLocation.trim()
    ) {
      setError(t('commerce.requiredFields'));
      return;
    }

    const missingAttributes = findMissingAttributes(attributeFields, attributeValues);
    if (missingAttributes.length > 0) {
      setAttributeErrors(
        Object.fromEntries(missingAttributes.map((key) => [key, t('commerce.attributeRequired')])),
      );
      setError(t('commerce.attributeMissing'));
      return;
    }

    try {
      await create.mutateAsync({
        requestType: form.requestType,
        title: form.title.trim(),
        description: form.description.trim(),
        categoryId,
        subcategoryId: form.subcategoryId || undefined,
        quantity: form.quantity || undefined,
        unit: form.unit || undefined,
        deliveryCityId: cityId,
        deliveryDistrictId: form.districtId,
        deliveryAddressText: form.deliveryLocation.trim(),
        deliveryDeadline: form.deliveryDeadline
          ? new Date(`${form.deliveryDeadline}T12:00:00`).toISOString()
          : undefined,
        specifications: {
          brandPreference: form.brandPreference || undefined,
          quantity: form.quantity || undefined,
          unit: form.unit || undefined,
          ...toSpecificationValues(attributeFields, attributeValues),
          ...(storeUsername ? { preferredSellerUsername: storeUsername } : {}),
        },
        publish: true,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('commerce.createFailed'));
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="flex max-w-xl flex-col gap-4">
      {store ? (
        <div className="rounded-xl border border-accent-500/30 bg-accent-500/10 px-4 py-3 text-sm">
          <p className="font-semibold text-brand-900 dark:text-foreground">
            {t('social.quoteForStore', { name: store.displayName })}
          </p>
          <p className="mt-1 text-foreground-muted">{t('social.quoteForStoreHint')}</p>
        </div>
      ) : null}
      <Field label={t('commerce.fieldType')} required>
        {(props) => (
          <Select
            {...props}
            value={form.requestType}
            onChange={(e) =>
              setForm((f) => ({ ...f, requestType: e.target.value as RequestType }))
            }
          >
            {REQUEST_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label={t('commerce.fieldCategory')} required>
        {(props) => (
          <Select
            {...props}
            value={categoryId}
            onChange={(e) => {
              // Alan şeması kategoriye bağlıdır; önceki kategorinin cevapları taşınmaz.
              setAttributeValues({});
              setAttributeErrors({});
              setForm((f) => ({
                ...f,
                categoryId: e.target.value,
                categoryPicked: true,
                subcategoryId: '',
              }));
            }}
            required
          >
            <option value="">{t('commerce.selectPlaceholder')}</option>
            {(categories.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {subcategories.length > 0 ? (
        <Field label={t('commerce.fieldSubcategory')}>
          {(props) => (
            <Select
              {...props}
              value={form.subcategoryId}
              onChange={(e) => setForm((f) => ({ ...f, subcategoryId: e.target.value }))}
            >
              <option value="">{t('commerce.selectPlaceholder')}</option>
              {subcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      ) : null}

      <Field label={t('commerce.fieldTitle')} required>
        {(props) => (
          <Input
            {...props}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder={t('commerce.titlePlaceholder')}
            required
            minLength={5}
          />
        )}
      </Field>

      <Field label={t('commerce.fieldDescription')} required>
        {(props) => (
          <Textarea
            {...props}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={4}
            placeholder={t('commerce.descriptionPlaceholder')}
            required
            minLength={10}
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('commerce.fieldQuantity')}>
          {(props) => (
            <Input
              {...props}
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            />
          )}
        </Field>
        <Field label={t('commerce.fieldUnit')}>
          {(props) => (
            <Select
              {...props}
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            >
              <option value="adet">{t('commerce.unitPiece')}</option>
              <option value="kg">{t('commerce.unitKg')}</option>
              <option value="litre">{t('commerce.unitLitre')}</option>
              <option value="paket">{t('commerce.unitPack')}</option>
              <option value="metre">{t('commerce.unitMeter')}</option>
            </Select>
          )}
        </Field>
        <Field label={t('commerce.fieldBrand')}>
          {(props) => (
            <Input
              {...props}
              value={form.brandPreference}
              onChange={(e) => setForm((f) => ({ ...f, brandPreference: e.target.value }))}
            />
          )}
        </Field>
      </div>

      <CategoryAttributeFields
        fields={attributeFields}
        values={attributeValues}
        errors={attributeErrors}
        onChange={(key, value) => {
          setAttributeValues((current) => ({ ...current, [key]: value }));
          setAttributeErrors((current) => {
            if (!current[key]) return current;
            const next = { ...current };
            delete next[key];
            return next;
          });
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('commerce.fieldCity')} required>
          {(props) => (
            <Select
              {...props}
              value={cityId}
              onChange={(e) => {
                setCityId(e.target.value);
                setForm((f) => ({ ...f, districtId: '' }));
              }}
              required
            >
              <option value="">{t('commerce.selectPlaceholder')}</option>
              {(cities.data ?? []).map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t('commerce.fieldDistrict')} required>
          {(props) => (
            <Select
              {...props}
              value={form.districtId}
              onChange={(e) => setForm((f) => ({ ...f, districtId: e.target.value }))}
              required
            >
              <option value="">{t('commerce.selectPlaceholder')}</option>
              {(districts.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <Field label={t('commerce.fieldDelivery')} required>
        {(props) => (
          <Input
            {...props}
            value={form.deliveryLocation}
            onChange={(e) => setForm((f) => ({ ...f, deliveryLocation: e.target.value }))}
            placeholder={t('commerce.addressPlaceholder')}
            required
          />
        )}
      </Field>

      <Field label={t('commerce.fieldDeadline')}>
        {(props) => (
          <Input
            {...props}
            type="date"
            value={form.deliveryDeadline}
            onChange={(e) => setForm((f) => ({ ...f, deliveryDeadline: e.target.value }))}
          />
        )}
      </Field>

      {error ? <p className="text-sm text-danger-500">{error}</p> : null}

      <Button
        type="submit"
        disabled={create.isPending || categories.isPending || attributeSchemaPending}
      >
        {create.isPending ? t('commerce.submitting') : t('commerce.submit')}
      </Button>
    </form>
  );
}
