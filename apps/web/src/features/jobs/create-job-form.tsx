'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@ustapilot/api-client';
import { JobSize, JobTimeSlot } from '@ustapilot/types';
import { Button, Card, CardContent, CardHeader, CardTitle, Field, Input, Select, Textarea } from '@ustapilot/ui';
import {
  createJobRequestSchema,
  type CreateJobRequestInput,
  type CreateJobRequestPayload,
} from '@ustapilot/validation';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { useCategories } from '@/features/catalog/use-categories';
import { useCities, useDistricts } from '@/features/catalog/use-locations';
import { PhotoUploader } from '@/features/files/photo-uploader';
import { t } from '@/lib/i18n';

import { useCreateJob } from './use-jobs';

const SIZE_OPTIONS = [
  { value: JobSize.UNKNOWN, label: 'Emin değilim' },
  { value: JobSize.SMALL, label: 'Küçük (birkaç saat)' },
  { value: JobSize.MEDIUM, label: 'Orta (bir gün)' },
  { value: JobSize.LARGE, label: 'Büyük (birden fazla gün)' },
] as const;

const TIME_SLOT_OPTIONS = [
  { value: JobTimeSlot.FLEXIBLE, label: 'Fark etmez' },
  { value: JobTimeSlot.MORNING, label: 'Sabah' },
  { value: JobTimeSlot.AFTERNOON, label: 'Öğleden sonra' },
  { value: JobTimeSlot.EVENING, label: 'Akşam' },
] as const;

/** Kullanıcı lirayı girer, sözleşme kuruş bekler. */
function liraToMinor(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : Number.NaN;
}

/**
 * Tarih alanı yalnızca gün verir. Yerel öğle vaktine sabitlenir; gece yarısı
 * kullanılsaydı saat dilimi kayması talebi bir gün öne veya arkaya alabilirdi.
 */
function dayToIsoDateTime(value: string): string | undefined {
  if (value === '') return undefined;
  return new Date(`${value}T12:00:00`).toISOString();
}

export function CreateJobForm() {
  const categories = useCategories({ withSubcategories: true });
  const cities = useCities();
  const createJob = useCreateJob();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    // Üçüncü tip parametresi şemanın çıkışıdır; `handleSubmit` varsayılanları
    // uygulanmış, dönüştürülmüş değerleri verir ve gövde el ile çevrilmez.
  } = useForm<CreateJobRequestInput, unknown, CreateJobRequestPayload>({
    resolver: zodResolver(createJobRequestSchema),
    defaultValues: {
      title: '',
      description: '',
      isUrgent: false,
      inspectionRequired: false,
      size: JobSize.UNKNOWN,
      preferredTimeSlot: JobTimeSlot.FLEXIBLE,
      attachmentFileIds: [],
      address: { cityId: '', districtId: '' },
    },
  });

  const selectedCategoryId = useWatch({ control, name: 'categoryId' });
  const selectedCityId = useWatch({ control, name: 'address.cityId' });
  const districts = useDistricts(selectedCityId || undefined);

  const subcategories =
    categories.data?.find((category) => category.id === selectedCategoryId)?.subcategories ?? [];

  const onSubmit = handleSubmit((values) => {
    createJob.mutate({ ...values, publish: true });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      {createJob.isError ? (
        <p role="alert" className="rounded-[--radius-control] bg-danger-surface p-3 text-sm text-danger-on-surface">
          {createJob.error instanceof ApiError
            ? createJob.error.message
            : 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.'}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('job.stepCategory')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Hizmet kategorisi" required error={errors.categoryId?.message}>
            {(props) => (
              <Select {...props} {...register('categoryId')} disabled={categories.isPending}>
                <option value="">{t('common.selectPlaceholder')}</option>
                {categories.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            label="Alt kategori"
            hint={subcategories.length === 0 ? 'Önce kategori seçin' : t('common.optional')}
            error={errors.subcategoryId?.message}
          >
            {(props) => (
              <Select
                {...props}
                {...register('subcategoryId', {
                  // Boş seçim hiç gönderilmez; "" bir UUID değildir.
                  setValueAs: (value: string) => (value === '' ? undefined : value),
                })}
                disabled={subcategories.length === 0}
              >
                <option value="">{t('common.selectPlaceholder')}</option>
                {subcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('job.stepDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field label={t('job.title')} required error={errors.title?.message}>
            {(props) => (
              <Input {...props} {...register('title')} placeholder="Örn. Mutfak musluğu damlatıyor" />
            )}
          </Field>

          <Field
            label={t('job.description')}
            required
            hint="Sorunu ne kadar ayrıntılı anlatırsanız teklifler o kadar isabetli olur."
            error={errors.description?.message}
          >
            {(props) => (
              <Textarea
                {...props}
                {...register('description')}
                rows={5}
                placeholder="Ne zaman başladı, daha önce müdahale edildi mi, ulaşmak için özel bir durum var mı?"
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="İşin büyüklüğü" error={errors.size?.message}>
              {(props) => (
                <Select {...props} {...register('size')}>
                  {SIZE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field
              label={t('job.budget')}
              hint="İsteğe bağlı. TL cinsinden yaklaşık bir rakam yazabilirsiniz."
              error={errors.budgetMinor?.message}
            >
              {(props) => (
                <Input
                  {...props}
                  {...register('budgetMinor', { setValueAs: liraToMinor })}
                  type="number"
                  min={0}
                  step={10}
                  inputMode="decimal"
                  placeholder="1500"
                />
              )}
            </Field>
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" {...register('isUrgent')} className="size-4" />
              {t('job.urgent')}
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" {...register('inspectionRequired')} className="size-4" />
              {t('job.inspectionRequired')}
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" {...register('materialsIncluded')} className="size-4" />
              {t('job.materialsIncluded')}
            </label>
          </div>

          <Field label={t('upload.photosLabel')} hint={t('upload.photosHint')}>
            {() => (
              <Controller
                control={control}
                name="attachmentFileIds"
                render={({ field }) => (
                  <PhotoUploader value={field.value ?? []} onChange={field.onChange} />
                )}
              />
            )}
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('job.stepLocation')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Şehir" required error={errors.address?.cityId?.message}>
              {(props) => (
                <Select {...props} {...register('address.cityId')} disabled={cities.isPending}>
                  <option value="">{t('common.selectPlaceholder')}</option>
                  {cities.data?.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field
              label="İlçe"
              required
              hint={selectedCityId ? undefined : 'Önce şehir seçin'}
              error={errors.address?.districtId?.message}
            >
              {(props) => (
                <Select
                  {...props}
                  {...register('address.districtId')}
                  disabled={!selectedCityId || districts.isPending}
                >
                  <option value="">{t('common.selectPlaceholder')}</option>
                  {districts.data?.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          <Field
            label="Açık adres"
            hint="İsteğe bağlı. Yalnızca teklifini kabul ettiğiniz ustayla paylaşılır."
            error={errors.address?.addressLine?.message}
          >
            {(props) => (
              <Input
                {...props}
                {...register('address.addressLine', {
                  setValueAs: (value: string) => (value.trim() === '' ? undefined : value),
                })}
                placeholder="Mahalle, cadde, bina ve daire no"
              />
            )}
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('job.stepSchedule')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Tercih ettiğiniz gün" error={errors.preferredDate?.message}>
            {(props) => (
              <Input
                {...props}
                {...register('preferredDate', { setValueAs: dayToIsoDateTime })}
                type="date"
              />
            )}
          </Field>

          <Field label="Tercih ettiğiniz zaman" error={errors.preferredTimeSlot?.message}>
            {(props) => (
              <Select {...props} {...register('preferredTimeSlot')}>
                {TIME_SLOT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" disabled={createJob.isPending}>
        {createJob.isPending ? 'Talebiniz yayınlanıyor…' : t('job.publish')}
      </Button>
    </form>
  );
}
