'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@talpio/api-client';
import { minorUnitFactor } from '@talpio/config';
import { JobSize, JobTimeSlot } from '@talpio/types';
import { Button, Card, CardContent, CardHeader, CardTitle, Field, Input, Select, Textarea } from '@talpio/ui';
import {
  createJobRequestSchema,
  type CreateJobRequestInput,
  type CreateJobRequestPayload,
} from '@talpio/validation';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { useCategories } from '@/features/catalog/use-categories';
import { useMyCurrency } from '@/features/currency/use-currency';
import { useCities, useDistricts } from '@/features/catalog/use-locations';
import { PhotoUploader } from '@/features/files/photo-uploader';
import { categoryName, t } from '@/lib/i18n';

import { useCreateJob } from './use-jobs';

const SIZE_OPTIONS = [
  JobSize.UNKNOWN,
  JobSize.SMALL,
  JobSize.MEDIUM,
  JobSize.LARGE,
] as const;

const TIME_SLOT_OPTIONS = [
  JobTimeSlot.FLEXIBLE,
  JobTimeSlot.MORNING,
  JobTimeSlot.AFTERNOON,
  JobTimeSlot.EVENING,
] as const;

/**
 * Kullanıcı tam birimi girer, sözleşme alt birimi bekler.
 *
 * Çarpan para birimine bağlı: yen'de kuruş yok, dinar'da üç basamak var. Sabit
 * 100 bu para birimlerinde tutarı yüz kat kaydırıyordu.
 */
function majorToMinor(value: string, currency: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? Math.round(parsed * minorUnitFactor(currency)) : Number.NaN;
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
  const currency = useMyCurrency();

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
            : t('auth.networkError')}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('job.stepCategory')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={t('job.category')} required error={errors.categoryId?.message}>
            {(props) => (
              <Select {...props} {...register('categoryId')} disabled={categories.isPending}>
                <option value="">{t('common.selectPlaceholder')}</option>
                {categories.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {categoryName(category)}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            label={t('job.subcategory')}
            hint={
              subcategories.length === 0 ? t('job.selectCategoryFirst') : t('common.optional')
            }
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
                    {categoryName(subcategory)}
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
              <Input {...props} {...register('title')} placeholder={t('job.titlePlaceholder')} />
            )}
          </Field>

          <Field
            label={t('job.description')}
            required
            hint={t('job.descriptionHint')}
            error={errors.description?.message}
          >
            {(props) => (
              <Textarea
                {...props}
                {...register('description')}
                rows={5}
                placeholder={t('job.descriptionPlaceholder')}
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('job.size')} error={errors.size?.message}>
              {(props) => (
                <Select {...props} {...register('size')}>
                  {SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {t(`jobSize.${size}`)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field
              label={t('job.budget')}
              hint={t('job.budgetHint')}
              error={errors.budgetMinor?.message}
            >
              {(props) => (
                <Input
                  {...props}
                  {...register('budgetMinor', {
                    setValueAs: (value: string) => majorToMinor(value, currency),
                  })}
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
            <Field label={t('job.city')} required error={errors.address?.cityId?.message}>
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
              label={t('job.district')}
              required
              hint={selectedCityId ? undefined : t('job.selectCityFirst')}
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
            label={t('job.addressLine')}
            hint={t('job.addressLineHint')}
            error={errors.address?.addressLine?.message}
          >
            {(props) => (
              <Input
                {...props}
                {...register('address.addressLine', {
                  setValueAs: (value: string) => (value.trim() === '' ? undefined : value),
                })}
                placeholder={t('job.addressLinePlaceholder')}
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
          <Field label={t('job.preferredDay')} error={errors.preferredDate?.message}>
            {(props) => (
              <Input
                {...props}
                {...register('preferredDate', { setValueAs: dayToIsoDateTime })}
                type="date"
              />
            )}
          </Field>

          <Field label={t('job.preferredTime')} error={errors.preferredTimeSlot?.message}>
            {(props) => (
              <Select {...props} {...register('preferredTimeSlot')}>
                {TIME_SLOT_OPTIONS.map((slot) => (
                  <option key={slot} value={slot}>
                    {t(`jobTimeSlot.${slot}`)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" disabled={createJob.isPending}>
        {createJob.isPending ? t('job.publishing') : t('job.publish')}
      </Button>
    </form>
  );
}
