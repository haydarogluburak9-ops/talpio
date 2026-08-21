'use client';

import type {
  SocialProfile,
  SocialProfileEducation,
  SocialProfileExperience,
  SocialProfileSkill,
} from '@talpio/types';
import { SocialProfileKind } from '@talpio/types';
import { Button, Input, cn } from '@talpio/ui';
import { Briefcase, GraduationCap, Pencil, Plus, Sparkles, Trash2, UserRound } from 'lucide-react';
import { useState } from 'react';

import { getLocale, t } from '@/lib/i18n';

import { formatCareerPeriod } from './career-format';
import {
  useCreateEducation,
  useCreateExperience,
  useCreateSkill,
  useDeleteEducation,
  useDeleteExperience,
  useDeleteSkill,
  useUpdateEducation,
  useUpdateExperience,
  useUpdateSocialProfile,
} from './use-social';

export function ProfileSidebar({
  profile,
  isOwn,
}: {
  profile: SocialProfile;
  isOwn: boolean;
}) {
  if (profile.kind !== SocialProfileKind.PERSONAL) return null;

  const experiences = profile.experiences ?? [];
  const education = profile.education ?? [];
  const skills = profile.skills ?? [];
  const hasBio = Boolean(profile.bio?.trim());
  const hasContent =
    hasBio || experiences.length > 0 || education.length > 0 || skills.length > 0;

  if (!isOwn && !hasContent) return null;

  return (
    <aside className="flex flex-col gap-3">
      <AboutCard profile={profile} isOwn={isOwn} />
      <ExperienceSection profile={profile} items={experiences} isOwn={isOwn} />
      <EducationSection profile={profile} items={education} isOwn={isOwn} />
      <SkillsSection profile={profile} items={skills} isOwn={isOwn} />
    </aside>
  );
}

/** @deprecated Use ProfileSidebar */
export const ProfileCareerSection = ProfileSidebar;

function SidebarCard({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="social-panel overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="text-foreground-muted">{icon}</span>
          {title}
        </h2>
        {action}
      </div>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

function SidebarAddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-muted hover:text-accent-600"
    >
      <Plus className="size-3.5" aria-hidden />
      {label}
    </button>
  );
}

function AboutCard({ profile, isOwn }: { profile: SocialProfile; isOwn: boolean }) {
  const update = useUpdateSocialProfile();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(profile.bio ?? '');

  if (!isOwn && !profile.bio?.trim()) return null;

  return (
    <SidebarCard
      title={t('social.aboutTab')}
      icon={<UserRound className="size-4" aria-hidden />}
      action={
        isOwn ? (
          <button
            type="button"
            onClick={() => {
              setValue(profile.bio ?? '');
              setEditing((open) => !open);
            }}
            className="grid size-8 place-items-center rounded-lg text-foreground-muted hover:bg-surface-muted"
            aria-label={t('social.editAbout')}
          >
            <Pencil className="size-4" />
          </button>
        ) : null
      }
    >
      {editing ? (
        <div className="space-y-3">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent-500"
            placeholder={t('social.personalAboutEmpty')}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={update.isPending}
              onClick={() =>
                update.mutate(
                  { bio: value.trim() || null },
                  { onSuccess: () => setEditing(false) },
                )
              }
            >
              {t('common.save')}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      ) : profile.bio?.trim() ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{profile.bio}</p>
      ) : (
        <p className="text-sm text-foreground-muted">{t('social.personalAboutEmpty')}</p>
      )}
    </SidebarCard>
  );
}

function ExperienceSection({
  profile,
  items,
  isOwn,
}: {
  profile: SocialProfile;
  items: SocialProfileExperience[];
  isOwn: boolean;
}) {
  const [editing, setEditing] = useState<SocialProfileExperience | 'new' | null>(null);
  const create = useCreateExperience(profile.username);
  const update = useUpdateExperience(profile.username);
  const remove = useDeleteExperience(profile.username);

  if (!isOwn && items.length === 0) return null;

  return (
    <SidebarCard
      title={t('social.experienceTitle')}
      icon={<Briefcase className="size-4" aria-hidden />}
      action={isOwn ? <SidebarAddButton label={t('social.addExperience')} onClick={() => setEditing('new')} /> : null}
    >
      {items.length === 0 ? (
        <p className="text-sm text-foreground-muted">{t('social.experienceEmpty')}</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((item) => (
            <li key={item.id} className="group relative py-3 first:pt-0 last:pb-0">
              <LinkedInCareerItem
                icon={<Briefcase className="size-4" aria-hidden />}
                title={item.title}
                subtitle={[item.company, item.locationText].filter(Boolean).join(' · ')}
                period={formatCareerPeriod(
                  item.startYear,
                  item.startMonth,
                  item.endYear,
                  item.endMonth,
                  item.isCurrent,
                  getLocale(),
                  t('social.present'),
                )}
                description={item.description}
                isOwn={isOwn}
                onEdit={() => setEditing(item)}
                onDelete={() => void remove.mutate(item.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {editing !== null ? (
        <ExperienceForm
          initial={editing === 'new' ? null : editing}
          busy={create.isPending || update.isPending}
          onClose={() => setEditing(null)}
          onSubmit={(values) => {
            if (editing === 'new') {
              create.mutate(values, { onSuccess: () => setEditing(null) });
            } else {
              update.mutate({ id: editing.id, body: values }, { onSuccess: () => setEditing(null) });
            }
          }}
        />
      ) : null}
    </SidebarCard>
  );
}

function EducationSection({
  profile,
  items,
  isOwn,
}: {
  profile: SocialProfile;
  items: SocialProfileEducation[];
  isOwn: boolean;
}) {
  const [editing, setEditing] = useState<SocialProfileEducation | 'new' | null>(null);
  const create = useCreateEducation(profile.username);
  const update = useUpdateEducation(profile.username);
  const remove = useDeleteEducation(profile.username);

  if (!isOwn && items.length === 0) return null;

  return (
    <SidebarCard
      title={t('social.educationTitle')}
      icon={<GraduationCap className="size-4" aria-hidden />}
      action={isOwn ? <SidebarAddButton label={t('social.addEducation')} onClick={() => setEditing('new')} /> : null}
    >
      {items.length === 0 ? (
        <p className="text-sm text-foreground-muted">{t('social.educationEmpty')}</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((item) => (
            <li key={item.id} className="group relative py-3 first:pt-0 last:pb-0">
              <LinkedInCareerItem
                icon={<GraduationCap className="size-4" aria-hidden />}
                title={item.school}
                subtitle={[item.degree, item.fieldOfStudy].filter(Boolean).join(' · ')}
                period={formatCareerPeriod(
                  item.startYear,
                  item.startMonth,
                  item.endYear,
                  item.endMonth,
                  item.isCurrent,
                  getLocale(),
                  t('social.present'),
                )}
                description={item.description}
                isOwn={isOwn}
                onEdit={() => setEditing(item)}
                onDelete={() => void remove.mutate(item.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {editing !== null ? (
        <EducationForm
          initial={editing === 'new' ? null : editing}
          busy={create.isPending || update.isPending}
          onClose={() => setEditing(null)}
          onSubmit={(values) => {
            if (editing === 'new') {
              create.mutate(values, { onSuccess: () => setEditing(null) });
            } else {
              update.mutate({ id: editing.id, body: values }, { onSuccess: () => setEditing(null) });
            }
          }}
        />
      ) : null}
    </SidebarCard>
  );
}

function SkillsSection({
  profile,
  items,
  isOwn,
}: {
  profile: SocialProfile;
  items: SocialProfileSkill[];
  isOwn: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const create = useCreateSkill(profile.username);
  const remove = useDeleteSkill(profile.username);

  if (!isOwn && items.length === 0) return null;

  return (
    <SidebarCard
      title={t('social.skillsTitle')}
      icon={<Sparkles className="size-4" aria-hidden />}
      action={
        isOwn ? <SidebarAddButton label={t('social.addSkill')} onClick={() => setAdding(true)} /> : null
      }
    >
      {items.length === 0 && !adding ? (
        <p className="text-sm text-foreground-muted">{t('social.skillsEmpty')}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-3 py-1 text-sm font-medium text-foreground',
                  isOwn && 'pr-1.5',
                )}
              >
                {item.name}
                {isOwn ? (
                  <button
                    type="button"
                    className="grid size-5 place-items-center rounded-full text-foreground-muted hover:bg-surface hover:text-danger-on-surface"
                    aria-label={t('common.delete')}
                    onClick={() => void remove.mutate(item.id)}
                  >
                    <Trash2 className="size-3" />
                  </button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = name.trim();
            if (!trimmed) return;
            create.mutate({ name: trimmed }, { onSuccess: () => {
              setName('');
              setAdding(false);
            } });
          }}
        >
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('social.skillPlaceholder')}
            aria-label={t('social.skillName')}
            className="h-9 flex-1"
          />
          <Button type="submit" size="sm" disabled={create.isPending || !name.trim()}>
            {t('common.save')}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
            {t('common.cancel')}
          </Button>
        </form>
      ) : null}
    </SidebarCard>
  );
}

function LinkedInCareerItem({
  icon,
  title,
  subtitle,
  period,
  description,
  isOwn,
  onEdit,
  onDelete,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  period: string;
  description?: string | null;
  isOwn: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-muted text-foreground-muted">
        {icon}
      </span>
      <div className="min-w-0 flex-1 pr-12">
        <p className="font-semibold text-foreground">{title}</p>
        {subtitle ? <p className="mt-0.5 text-sm text-foreground">{subtitle}</p> : null}
        <p className="mt-1 text-xs text-foreground-muted">{period}</p>
        {description ? (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground-muted">
            {description}
          </p>
        ) : null}
      </div>
      {isOwn ? (
        <div className="absolute right-0 top-2 flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
          <button
            type="button"
            className="grid size-8 place-items-center rounded-lg text-foreground-muted hover:bg-surface-muted"
            aria-label={t('common.edit')}
            onClick={onEdit}
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-lg text-danger-on-surface hover:bg-danger-surface"
            aria-label={t('common.delete')}
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ExperienceForm({
  initial,
  busy,
  onClose,
  onSubmit,
}: {
  initial: SocialProfileExperience | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: {
    company: string;
    title: string;
    locationText?: string;
    description?: string;
    startYear: number;
    startMonth?: number;
    endYear?: number | null;
    endMonth?: number | null;
    isCurrent: boolean;
  }) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [company, setCompany] = useState(initial?.company ?? '');
  const [locationText, setLocationText] = useState(initial?.locationText ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [startYear, setStartYear] = useState(String(initial?.startYear ?? new Date().getFullYear()));
  const [startMonth, setStartMonth] = useState(initial?.startMonth ? String(initial.startMonth) : '');
  const [endYear, setEndYear] = useState(initial?.endYear ? String(initial.endYear) : '');
  const [endMonth, setEndMonth] = useState(initial?.endMonth ? String(initial.endMonth) : '');
  const [isCurrent, setIsCurrent] = useState(initial?.isCurrent ?? false);

  return (
    <CareerFormShell title={initial ? t('social.editExperience') : t('social.addExperience')} onClose={onClose}>
      <FormField label={t('social.position')} value={title} onChange={setTitle} required />
      <FormField label={t('social.company')} value={company} onChange={setCompany} required />
      <FormField label={t('social.location')} value={locationText} onChange={setLocationText} />
      <DateFields
        startYear={startYear}
        startMonth={startMonth}
        endYear={endYear}
        endMonth={endMonth}
        isCurrent={isCurrent}
        onStartYear={setStartYear}
        onStartMonth={setStartMonth}
        onEndYear={setEndYear}
        onEndMonth={setEndMonth}
        onIsCurrent={setIsCurrent}
      />
      <label className="block text-sm">
        <span className="mb-1 block font-medium">{t('social.description')}</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
        />
      </label>
      <FormActions
        busy={busy}
        disabled={!title.trim() || !company.trim() || !startYear.trim()}
        onClose={onClose}
        onSave={() =>
          onSubmit({
            title: title.trim(),
            company: company.trim(),
            locationText: locationText.trim() || undefined,
            description: description.trim() || undefined,
            startYear: Number(startYear),
            startMonth: startMonth ? Number(startMonth) : undefined,
            endYear: isCurrent ? null : endYear ? Number(endYear) : null,
            endMonth: isCurrent ? null : endMonth ? Number(endMonth) : undefined,
            isCurrent,
          })
        }
      />
    </CareerFormShell>
  );
}

function EducationForm({
  initial,
  busy,
  onClose,
  onSubmit,
}: {
  initial: SocialProfileEducation | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: {
    school: string;
    degree?: string;
    fieldOfStudy?: string;
    description?: string;
    startYear: number;
    startMonth?: number;
    endYear?: number | null;
    endMonth?: number | null;
    isCurrent: boolean;
  }) => void;
}) {
  const [school, setSchool] = useState(initial?.school ?? '');
  const [degree, setDegree] = useState(initial?.degree ?? '');
  const [fieldOfStudy, setFieldOfStudy] = useState(initial?.fieldOfStudy ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [startYear, setStartYear] = useState(String(initial?.startYear ?? new Date().getFullYear()));
  const [startMonth, setStartMonth] = useState(initial?.startMonth ? String(initial.startMonth) : '');
  const [endYear, setEndYear] = useState(initial?.endYear ? String(initial.endYear) : '');
  const [endMonth, setEndMonth] = useState(initial?.endMonth ? String(initial.endMonth) : '');
  const [isCurrent, setIsCurrent] = useState(initial?.isCurrent ?? false);

  return (
    <CareerFormShell title={initial ? t('social.editEducation') : t('social.addEducation')} onClose={onClose}>
      <FormField label={t('social.school')} value={school} onChange={setSchool} required />
      <FormField label={t('social.degree')} value={degree} onChange={setDegree} />
      <FormField label={t('social.fieldOfStudy')} value={fieldOfStudy} onChange={setFieldOfStudy} />
      <DateFields
        startYear={startYear}
        startMonth={startMonth}
        endYear={endYear}
        endMonth={endMonth}
        isCurrent={isCurrent}
        onStartYear={setStartYear}
        onStartMonth={setStartMonth}
        onEndYear={setEndYear}
        onEndMonth={setEndMonth}
        onIsCurrent={setIsCurrent}
      />
      <label className="block text-sm">
        <span className="mb-1 block font-medium">{t('social.description')}</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
        />
      </label>
      <FormActions
        busy={busy}
        disabled={!school.trim() || !startYear.trim()}
        onClose={onClose}
        onSave={() =>
          onSubmit({
            school: school.trim(),
            degree: degree.trim() || undefined,
            fieldOfStudy: fieldOfStudy.trim() || undefined,
            description: description.trim() || undefined,
            startYear: Number(startYear),
            startMonth: startMonth ? Number(startMonth) : undefined,
            endYear: isCurrent ? null : endYear ? Number(endYear) : null,
            endMonth: isCurrent ? null : endMonth ? Number(endMonth) : undefined,
            isCurrent,
          })
        }
      />
    </CareerFormShell>
  );
}

function CareerFormShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" className="text-sm text-foreground-muted hover:text-foreground" onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <Input value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </label>
  );
}

function DateFields({
  startYear,
  startMonth,
  endYear,
  endMonth,
  isCurrent,
  onStartYear,
  onStartMonth,
  onEndYear,
  onEndMonth,
  onIsCurrent,
}: {
  startYear: string;
  startMonth: string;
  endYear: string;
  endMonth: string;
  isCurrent: boolean;
  onStartYear: (v: string) => void;
  onStartMonth: (v: string) => void;
  onEndYear: (v: string) => void;
  onEndMonth: (v: string) => void;
  onIsCurrent: (v: boolean) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border/70 p-3">
      <p className="text-sm font-medium">{t('social.dates')}</p>
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('social.startYear')} value={startYear} onChange={onStartYear} required />
        <FormField label={t('social.startMonth')} value={startMonth} onChange={onStartMonth} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isCurrent} onChange={(e) => onIsCurrent(e.target.checked)} />
        {t('social.currentRole')}
      </label>
      {!isCurrent ? (
        <div className="grid grid-cols-2 gap-3">
          <FormField label={t('social.endYear')} value={endYear} onChange={onEndYear} />
          <FormField label={t('social.endMonth')} value={endMonth} onChange={onEndMonth} />
        </div>
      ) : null}
    </div>
  );
}

function FormActions({
  busy,
  disabled,
  onClose,
  onSave,
}: {
  busy: boolean;
  disabled: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="outline" onClick={onClose}>
        {t('common.cancel')}
      </Button>
      <Button type="button" disabled={disabled || busy} isLoading={busy} onClick={onSave}>
        {t('common.save')}
      </Button>
    </div>
  );
}
