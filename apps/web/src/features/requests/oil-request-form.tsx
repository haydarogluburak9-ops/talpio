'use client';

import { ApiError } from '@talpio/api-client';
import { RequestType } from '@talpio/types';
import { Button, Field, Input, Select, Textarea } from '@talpio/ui';
import { useMemo, useState } from 'react';

import { useCategories } from '@/features/catalog/use-categories';
import { useCities, useDistricts } from '@/features/catalog/use-locations';

import { useCreateCommerceRequest } from './use-requests';

export function OilRequestForm() {
  const categories = useCategories({ withSubcategories: true });
  const cities = useCities();
  const create = useCreateCommerceRequest();

  const oilCategory = useMemo(
    () => categories.data?.find((c) => c.slug === 'madeni-yag'),
    [categories.data],
  );

  const [cityId, setCityId] = useState('');
  const districts = useDistricts(cityId || undefined);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: 'Madeni yağ tedarik talebi',
    description: '',
    subcategoryId: '',
    districtId: '',
    productType: 'motor-yagi',
    brandPreference: '',
    viscosity: '',
    packagingType: 'varil',
    quantity: '',
    unit: 'litre',
    deliveryLocation: '',
    deliveryDeadline: '',
    invoiceRequired: true,
    alternativeBrandAllowed: true,
  });

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!oilCategory) {
      setError('Madeni yağ kategorisi henüz yüklenmedi. Seed çalıştırıldığından emin olun.');
      return;
    }
    if (!cityId || !form.districtId || !form.deliveryLocation.trim() || !form.quantity || !form.viscosity) {
      setError('Viskozite, miktar, şehir, ilçe ve teslimat adresi zorunludur.');
      return;
    }

    try {
      await create.mutateAsync({
        requestType: RequestType.PRODUCT_SUPPLY,
        title: form.title,
        description:
          form.description ||
          `${form.viscosity} viskoziteli ${form.productType} tedarik talebi (${form.quantity} ${form.unit}).`,
        categoryId: oilCategory.id,
        subcategoryId: form.subcategoryId || undefined,
        quantity: form.quantity,
        unit: form.unit,
        deliveryCityId: cityId,
        deliveryDistrictId: form.districtId,
        deliveryAddressText: form.deliveryLocation.trim(),
        deliveryDeadline: form.deliveryDeadline
          ? new Date(`${form.deliveryDeadline}T12:00:00`).toISOString()
          : undefined,
        specifications: {
          productType: form.productType,
          brandPreference: form.brandPreference || undefined,
          viscosity: form.viscosity,
          packagingType: form.packagingType,
          quantity: form.quantity,
          unit: form.unit,
          deliveryLocation: form.deliveryLocation.trim(),
          deliveryDeadline: form.deliveryDeadline || undefined,
          invoiceRequired: form.invoiceRequired,
          alternativeBrandAllowed: form.alternativeBrandAllowed,
        },
        publish: true,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Talep oluşturulamadı.');
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="flex max-w-xl flex-col gap-4">
      <Field label="Başlık" required>
        {(props) => (
          <Input
            {...props}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        )}
      </Field>

      <Field label="Açıklama">
        {(props) => (
          <Textarea
            {...props}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="Tedarik ihtiyacınızı kısaca yazın"
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ürün tipi">
          {(props) => (
            <Select
              {...props}
              value={form.productType}
              onChange={(e) => setForm((f) => ({ ...f, productType: e.target.value }))}
            >
              <option value="motor-yagi">Motor yağı</option>
              <option value="hidrolik-yag">Hidrolik yağ</option>
              <option value="disli-yagi">Dişli yağı</option>
              <option value="endustriyel-yag">Endüstriyel yağ</option>
              <option value="transmisyon-yagi">Transmisyon yağı</option>
            </Select>
          )}
        </Field>
        <Field label="Viskozite" required>
          {(props) => (
            <Input
              {...props}
              value={form.viscosity}
              onChange={(e) => setForm((f) => ({ ...f, viscosity: e.target.value }))}
              placeholder="örn. 5W-30"
              required
            />
          )}
        </Field>
        <Field label="Marka tercihi">
          {(props) => (
            <Input
              {...props}
              value={form.brandPreference}
              onChange={(e) => setForm((f) => ({ ...f, brandPreference: e.target.value }))}
            />
          )}
        </Field>
        <Field label="Ambalaj">
          {(props) => (
            <Select
              {...props}
              value={form.packagingType}
              onChange={(e) => setForm((f) => ({ ...f, packagingType: e.target.value }))}
            >
              <option value="varil">Varil</option>
              <option value="bidon">Bidon</option>
              <option value="ibc">IBC</option>
              <option value="dokme">Dökme</option>
            </Select>
          )}
        </Field>
        <Field label="Miktar" required>
          {(props) => (
            <Input
              {...props}
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              required
            />
          )}
        </Field>
        <Field label="Birim">
          {(props) => (
            <Select
              {...props}
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            >
              <option value="litre">Litre</option>
              <option value="kg">Kg</option>
              <option value="varil">Varil</option>
              <option value="adet">Adet</option>
            </Select>
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Şehir" required>
          {(props) => (
            <Select
              {...props}
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              required
            >
              <option value="">Seçiniz</option>
              {(cities.data ?? []).map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="İlçe" required>
          {(props) => (
            <Select
              {...props}
              value={form.districtId}
              onChange={(e) => setForm((f) => ({ ...f, districtId: e.target.value }))}
              required
            >
              <option value="">Seçiniz</option>
              {(districts.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <Field label="Teslimat adresi / lokasyon" required>
        {(props) => (
          <Input
            {...props}
            value={form.deliveryLocation}
            onChange={(e) => setForm((f) => ({ ...f, deliveryLocation: e.target.value }))}
            placeholder="Mahalle, sokak veya açık adres"
            required
          />
        )}
      </Field>

      <Field label="Teslim tarihi">
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

      <Button type="submit" disabled={create.isPending || !oilCategory}>
        {create.isPending ? 'Gönderiliyor…' : 'Talebi yayınla'}
      </Button>
    </form>
  );
}
