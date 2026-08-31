'use client';

import { ApiError } from '@talpio/api-client';
import { RequestType } from '@talpio/types';
import { Button, Field, Input, Textarea } from '@talpio/ui';
import { useMemo, useState } from 'react';

import { SearchSelect } from '@/components/search-select';
import { useCategories, useCategoryAttributeSchema } from '@/features/catalog/use-categories';
import { useCities, useDistricts } from '@/features/catalog/use-locations';
import { COMMERCE_BRANDS, commerceUnitOptions } from '@/features/requests/commerce-options';
import { useSocialProfile } from '@/features/social/use-social';
import { categoryName, getLocale, t } from '@/lib/i18n';

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

/**
 * Akıştaki ilandan taşınan nesnel alanlar. Miktar, teslim yeri ve açıklama
 * bilerek yoktur: onları ilandan kopyalamak satıcıya kendi reklam metnini
 * talep olarak geri gönderir.
 */
export interface RequestPrefill {
  categoryId?: string;
  subcategoryId?: string;
  productName?: string;
  unit?: string;
  brand?: string;
}

export function CommerceRequestForm({
  storeUsername,
  initialCategorySlug,
  prefill,
}: {
  storeUsername?: string;
  /** Kısayol bağlantılarının kategoriyi hazır seçmesi için. */
  initialCategorySlug?: string;
  prefill?: RequestPrefill;
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
    title: prefill?.productName ?? '',
    description: '',
    categoryId: prefill?.categoryId ?? '',
    categoryPicked: false,
    subcategoryId: prefill?.subcategoryId ?? '',
    districtId: '',
    quantity: '',
    unit: prefill?.unit ?? 'adet',
    brandPreference: prefill?.brand ?? '',
    deliveryLocation: '',
    deliveryDeadline: '',
  });

  // Kısayol yalnızca kullanıcı kendi seçimini yapana kadar geçerlidir.
  const shortcutCategoryId = useMemo(() => {
    if (!initialCategorySlug) return '';
    return (categories.data ?? []).find((c) => c.slug === initialCategorySlug)?.id ?? '';
  }, [categories.data, initialCategorySlug]);

  const store = storeProfile.data?.kind === 'BUSINESS' ? storeProfile.data : null;
  const targetBusinessId = store?.business?.businessId ?? null;
  const storeProfilePending = Boolean(storeUsername) && storeProfile.isPending;

  // Kullanıcı kendi seçimini yapana kadar sırayla mağazanın kategorisi ve
  // kısayolun kategorisi geçerlidir.
  const fallbackCategoryId = store?.business?.categories[0]?.id ?? shortcutCategoryId;
  const categoryId = form.categoryPicked || form.categoryId ? form.categoryId : fallbackCategoryId;

  const selectedCategory = useMemo(
    () => (categories.data ?? []).find((c) => c.id === categoryId),
    [categories.data, categoryId],
  );

  const subcategories = selectedCategory?.subcategories ?? [];

  const attributeSchema = useCategoryAttributeSchema(categoryId || undefined);
  const attributeFields = attributeSchema.data?.fields ?? [];
  const attributeSchemaPending = Boolean(categoryId) && attributeSchema.isPending;

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
        },
        // Bir mağazadan teklif isteniyorsa talep yalnızca ona gider; mağazasız
        // açılan talep eşleşen satıcılara ve takipçilere dağıtılır.
        ...(targetBusinessId ? { businessId: targetBusinessId } : {}),
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
          {prefill?.productName ? (
            <p className="mt-2 text-foreground-muted">
              {t('commerce.prefillHint', { product: prefill.productName })}
            </p>
          ) : null}
        </div>
      ) : null}
      <Field label={t('commerce.fieldType')} required>
        {(props) => (
          <SearchSelect
            id={props.id}
            value={form.requestType}
            onChange={(next) => setForm((f) => ({ ...f, requestType: next as RequestType }))}
            placeholder={t('commerce.selectPlaceholder')}
            required
            options={REQUEST_TYPE_OPTIONS.map((opt) => ({
              id: opt.value,
              label: t(opt.labelKey),
            }))}
          />
        )}
      </Field>

      <Field label={t('commerce.fieldCategory')} required>
        {(props) => (
          <SearchSelect
            id={props.id}
            value={categoryId}
            onChange={(next) => {
              setAttributeValues({});
              setAttributeErrors({});
              setForm((f) => ({
                ...f,
                categoryId: next,
                categoryPicked: true,
                subcategoryId: '',
              }));
            }}
            required
            placeholder={t('commerce.selectPlaceholder')}
            options={(categories.data ?? []).map((category) => ({
              id: category.id,
              label: categoryName(category),
            }))}
          />
        )}
      </Field>

      {subcategories.length > 0 ? (
        <Field label={t('commerce.fieldSubcategory')}>
          {(props) => (
            <SearchSelect
              id={props.id}
              value={form.subcategoryId}
              onChange={(next) => setForm((f) => ({ ...f, subcategoryId: next }))}
              placeholder={t('commerce.selectPlaceholder')}
              options={subcategories.map((sub) => ({
                id: sub.id,
                label: categoryName(sub),
              }))}
            />
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
            <SearchSelect
              id={props.id}
              value={form.unit}
              onChange={(next) => setForm((f) => ({ ...f, unit: next }))}
              allowCustom
              placeholder={t('commerce.selectPlaceholder')}
              options={commerceUnitOptions(getLocale())}
            />
          )}
        </Field>
        <Field label={t('commerce.fieldBrand')}>
          {(props) => (
            <SearchSelect
              id={props.id}
              value={form.brandPreference}
              onChange={(next) => setForm((f) => ({ ...f, brandPreference: next }))}
              allowCustom
              placeholder={t('commerce.brandPlaceholder')}
              options={COMMERCE_BRANDS.map((brand) => ({ id: brand, label: brand }))}
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
            <SearchSelect
              id={props.id}
              value={cityId}
              onChange={(next) => {
                setCityId(next);
                setForm((f) => ({ ...f, districtId: '' }));
              }}
              required
              placeholder={t('commerce.selectPlaceholder')}
              options={(cities.data ?? []).map((city) => ({ id: city.id, label: city.name }))}
            />
          )}
        </Field>
        <Field label={t('commerce.fieldDistrict')} required>
          {(props) => (
            <SearchSelect
              id={props.id}
              value={form.districtId}
              onChange={(next) => setForm((f) => ({ ...f, districtId: next }))}
              required
              disabled={!cityId}
              placeholder={t('commerce.selectPlaceholder')}
              emptyLabel={cityId ? undefined : t('job.selectCityFirst')}
              options={(districts.data ?? []).map((d) => ({ id: d.id, label: d.name }))}
            />
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
        disabled={
          create.isPending ||
          categories.isPending ||
          attributeSchemaPending ||
          // Mağaza kimliği gelmeden gönderilirse talep yanlışlıkla herkese açılır.
          storeProfilePending
        }
      >
        {create.isPending ? t('commerce.submitting') : t('commerce.submit')}
      </Button>
    </form>
  );
}
