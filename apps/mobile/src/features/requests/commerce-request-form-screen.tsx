import { useMemo, useState } from 'react';

import { ApiError } from '@talpio/api-client';
import { RequestType } from '@talpio/types';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { FormField } from '@/components/form-field';
import { OptionPicker } from '@/components/option-picker';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { useCategories, useCategoryAttributeSchema } from '@/features/catalog/use-categories';
import { useCities, useDistricts } from '@/features/catalog/use-locations';
import { useSocialProfile } from '@/features/social/use-social';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

import {
  CategoryAttributeFields,
  findMissingAttributes,
  toSpecificationValues,
  type AttributeValues,
} from './category-attribute-fields';
import { useCreateCommerceRequest } from './use-requests';

const TYPE_KEYS: { value: RequestType; key: string }[] = [
  { value: RequestType.PRODUCT_SUPPLY, key: 'commerce.typeProductSupply' },
  { value: RequestType.WHOLESALE, key: 'commerce.typeWholesale' },
  { value: RequestType.B2B_PURCHASE, key: 'commerce.typeB2b' },
  { value: RequestType.SERVICE, key: 'commerce.typeService' },
  { value: RequestType.MANUFACTURING, key: 'commerce.typeManufacturing' },
  { value: RequestType.RENTAL, key: 'commerce.typeRental' },
  { value: RequestType.LOGISTICS, key: 'commerce.typeLogistics' },
  { value: RequestType.PROFESSIONAL_SERVICE, key: 'commerce.typeProfessional' },
  { value: RequestType.CONSTRUCTION, key: 'commerce.typeConstruction' },
  { value: RequestType.OTHER, key: 'commerce.typeOther' },
];

export function CommerceRequestFormScreen({
  /** Mağaza profilindeki "Teklif iste" düğmesinden gelindiğinde dolu olur. */
  storeUsername,
}: {
  storeUsername?: string;
}) {
  const { t, categoryName } = useI18n();
  const categories = useCategories({ withSubcategories: true });
  const cities = useCities();
  const create = useCreateCommerceRequest();
  const storeProfile = useSocialProfile(storeUsername ?? '');

  const [cityId, setCityId] = useState<string | null>(null);
  const districts = useDistricts(cityId);
  const [error, setError] = useState<string | null>(null);
  const [attributeValues, setAttributeValues] = useState<AttributeValues>({});
  const [attributeErrors, setAttributeErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    requestType: RequestType.PRODUCT_SUPPLY as RequestType,
    title: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    districtId: '',
    quantity: '',
    unit: 'adet',
    brandPreference: '',
    deliveryLocation: '',
    deliveryDeadline: '',
  });

  const store = storeProfile.data?.kind === 'BUSINESS' ? storeProfile.data : null;
  const targetBusinessId = store?.business?.businessId ?? null;
  const storeProfilePending = Boolean(storeUsername) && storeProfile.isPending;
  // Mağazadan gelindiğinde kategori hazır seçilir; kullanıcının seçimi bunu ezer.
  const categoryId = form.categoryId || store?.business?.categories[0]?.id || '';

  const selectedCategory = useMemo(
    () => (categories.data ?? []).find((item) => item.id === categoryId),
    [categories.data, categoryId],
  );
  const subcategories = selectedCategory?.subcategories ?? [];

  const attributeSchema = useCategoryAttributeSchema(categoryId || undefined);
  const attributeFields = attributeSchema.data?.fields ?? [];
  const attributeSchemaPending = Boolean(categoryId) && attributeSchema.isPending;

  async function onSubmit() {
    setError(null);
    setAttributeErrors({});
    if (
      form.title.trim().length < 5 ||
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
    <Screen>
      <Text variant="title">{t('commerce.createTitle')}</Text>
      <Text variant="caption" tone="muted" style={{ marginBottom: spacing.md }}>
        {t('commerce.createDescription')}
      </Text>

      {store ? (
        <Card style={{ marginBottom: spacing.md }}>
          <Text variant="bodyStrong">
            {t('social.quoteForStore', { name: store.displayName })}
          </Text>
          <Text variant="caption" tone="muted">
            {t('social.quoteForStoreHint')}
          </Text>
        </Card>
      ) : null}

      <OptionPicker
        label={t('commerce.fieldType')}
        options={TYPE_KEYS.map((item) => ({ id: item.value, name: t(item.key) }))}
        selectedId={form.requestType}
        onSelect={(id) => setForm((current) => ({ ...current, requestType: id as RequestType }))}
        emptyLabel={t('commerce.selectPlaceholder')}
      />
      <OptionPicker
        label={t('commerce.fieldCategory')}
        options={(categories.data ?? []).map((item) => ({
          id: item.id,
          name: categoryName(item),
        }))}
        selectedId={categoryId || null}
        onSelect={(id) => {
          // Alan şeması kategoriye bağlıdır; önceki kategorinin cevapları taşınmaz.
          setAttributeValues({});
          setAttributeErrors({});
          setForm((current) => ({ ...current, categoryId: id, subcategoryId: '' }));
        }}
        emptyLabel={t('commerce.selectPlaceholder')}
        searchable
      />
      {subcategories.length > 0 ? (
        <OptionPicker
          label={t('commerce.fieldSubcategory')}
          options={subcategories.map((item) => ({
            id: item.id,
            name: categoryName(item),
          }))}
          selectedId={form.subcategoryId || null}
          onSelect={(id) => setForm((current) => ({ ...current, subcategoryId: id }))}
          emptyLabel={t('commerce.selectPlaceholder')}
        />
      ) : null}
      <FormField
        label={t('commerce.fieldTitle')}
        value={form.title}
        onChangeText={(title) => setForm((current) => ({ ...current, title }))}
        placeholder={t('commerce.titlePlaceholder')}
      />
      <FormField
        label={t('commerce.fieldDescription')}
        value={form.description}
        onChangeText={(description) => setForm((current) => ({ ...current, description }))}
        placeholder={t('commerce.descriptionPlaceholder')}
        multiline
      />
      <FormField
        label={t('commerce.fieldQuantity')}
        value={form.quantity}
        onChangeText={(quantity) => setForm((current) => ({ ...current, quantity }))}
      />
      <FormField
        label={t('commerce.fieldBrand')}
        value={form.brandPreference}
        onChangeText={(brandPreference) => setForm((current) => ({ ...current, brandPreference }))}
      />
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
      <OptionPicker
        label={t('commerce.fieldCity')}
        options={(cities.data ?? []).map((item) => ({ id: item.id, name: item.name }))}
        selectedId={cityId}
        onSelect={(id) => {
          setCityId(id);
          setForm((current) => ({ ...current, districtId: '' }));
        }}
        emptyLabel={t('commerce.selectPlaceholder')}
        searchable
      />
      <OptionPicker
        label={t('commerce.fieldDistrict')}
        options={(districts.data ?? []).map((item) => ({ id: item.id, name: item.name }))}
        selectedId={form.districtId || null}
        onSelect={(id) => setForm((current) => ({ ...current, districtId: id }))}
        emptyLabel={t('commerce.selectPlaceholder')}
        disabled={!cityId}
      />
      <FormField
        label={t('commerce.fieldDelivery')}
        value={form.deliveryLocation}
        onChangeText={(deliveryLocation) =>
          setForm((current) => ({ ...current, deliveryLocation }))
        }
        placeholder={t('commerce.addressPlaceholder')}
      />
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
      <Button
        label={create.isPending ? t('commerce.submitting') : t('commerce.submit')}
        loading={create.isPending}
        // Mağaza kimliği gelmeden gönderilirse talep yanlışlıkla herkese açılır.
        disabled={categories.isPending || attributeSchemaPending || storeProfilePending}
        block
        onPress={() => void onSubmit()}
      />
    </Screen>
  );
}
