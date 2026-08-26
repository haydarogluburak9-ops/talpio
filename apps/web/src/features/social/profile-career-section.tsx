'use client';

import type {
  SocialProfile,
  SocialProfileEducation,
  SocialProfileExperience,
  SocialProfileSkill,
} from '@talpio/types';
import { SocialProfileKind } from '@talpio/types';
import { Button, Input, cn } from '@talpio/ui';
import {
  ArrowRight,
  Briefcase,
  Gauge,
  GraduationCap,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';
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
      {isOwn ? <ProfileStrengthCard profile={profile} /> : null}
      <AboutCard profile={profile} isOwn={isOwn} />
      <ExperienceSection profile={profile} items={experiences} isOwn={isOwn} />
      <EducationSection profile={profile} items={education} isOwn={isOwn} />
      <SkillsSection profile={profile} items={skills} isOwn={isOwn} />
    </aside>
  );
}

/** @deprecated Use ProfileSidebar */
export const ProfileCareerSection = ProfileSidebar;

/**
 * Bölüm kimliği: her kart kendi rengini `.profile-tint-*` ile seçer, alttaki
 * parçalar rengi `--panel-tint` / `--panel-ink` belirteçlerinden devralır.
 */
type SectionTint = 'accent' | 'info' | 'success' | 'warning';

const TINT_CLASS: Record<SectionTint, string> = {
  accent: 'profile-tint-accent',
  info: 'profile-tint-info',
  success: 'profile-tint-success',
  warning: 'profile-tint-warning',
};

/** Profil gücü ölçütleri; hepsi tamamsa gösterge tümüyle gizlenir. */
function getProfileSteps(profile: SocialProfile) {
  return [
    { key: 'avatar', done: Boolean(profile.avatarUrl), label: t('social.profileStepAvatar') },
    {
      key: 'headline',
      done: Boolean(profile.headline?.trim()),
      label: t('social.profileStepHeadline'),
    },
    { key: 'about', done: Boolean(profile.bio?.trim()), label: t('social.profileStepAbout') },
    {
      key: 'experience',
      done: (profile.experiences ?? []).length > 0,
      label: t('social.profileStepExperience'),
    },
    {
      key: 'education',
      done: (profile.education ?? []).length > 0,
      label: t('social.profileStepEducation'),
    },
    {
      key: 'skills',
      done: (profile.skills ?? []).length >= 3,
      label: t('social.profileStepSkills'),
    },
  ];
}

function ProfileStrengthCard({ profile }: { profile: SocialProfile }) {
  const steps = getProfileSteps(profile);
  const nextStep = steps.find((step) => !step.done);

  // Tamamlanmış profilde ilerleme çubuğu gürültüdür.
  if (!nextStep) return null;

  const completed = steps.filter((step) => step.done).length;
  const percent = Math.round((completed / steps.length) * 100);

  return (
    <section className="profile-panel profile-tint-accent overflow-hidden px-4 pt-3.5 pb-4">
      <div className="flex items-center gap-2.5">
        <span
          className="profile-section-icon grid size-9 shrink-0 place-items-center rounded-xl"
          aria-hidden
        >
          <Gauge className="size-4.5" />
        </span>
        <h2 className="flex-1 text-[0.9375rem] font-semibold tracking-tight text-foreground">
          {t('social.profileStrengthTitle')}
        </h2>
        <span className="font-display text-base font-bold tabular-nums text-accent-700 dark:text-accent-300">
          {t('social.percentValue', { count: percent })}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('social.profileStrengthAria', { count: percent })}
        className="profile-meter-track mt-3 h-1.5 overflow-hidden rounded-full"
      >
        <span
          aria-hidden
          className="profile-meter-fill block h-full rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-foreground-muted">
        <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-accent-600 dark:text-accent-400" aria-hidden />
        <span>
          {t('social.profileStrengthNext')}:{' '}
          <span className="font-semibold text-foreground">{nextStep.label}</span>
        </span>
      </p>
    </section>
  );
}

function SidebarCard({
  title,
  icon,
  tint,
  count,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tint: SectionTint;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('profile-panel overflow-hidden', TINT_CLASS[tint])}>
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-3">
        <span
          className="profile-section-icon grid size-9 shrink-0 place-items-center rounded-xl"
          aria-hidden
        >
          {icon}
        </span>
        <h2 className="flex min-w-0 flex-1 items-center gap-1.5 text-[0.9375rem] font-semibold tracking-tight text-foreground">
          <span className="truncate">{title}</span>
          {count ? (
            <span className="profile-count-chip shrink-0 rounded-full px-1.5 py-px text-[0.6875rem] font-bold tabular-nums">
              {count}
            </span>
          ) : null}
        </h2>
        {action}
      </div>
      <div className="px-4 pb-4">{children}</div>
    </section>
  );
}

function SidebarAddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-8 shrink-0 place-items-center rounded-xl border border-border/70 bg-surface text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
    >
      <Plus className="size-4" aria-hidden />
    </button>
  );
}

/** Boş bölüm: gri cümle yerine kesikli çerçeveli, tek dokunuşluk davet. */
function SectionEmptyState({
  icon,
  hint,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  hint: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAction}
      className="profile-empty-cta flex w-full flex-col items-center gap-2 rounded-2xl px-4 py-4 text-center"
    >
      <span
        className="profile-section-icon grid size-10 place-items-center rounded-xl"
        aria-hidden
      >
        {icon}
      </span>
      <span className="text-xs leading-relaxed text-foreground-muted">{hint}</span>
      <span className="profile-empty-action inline-flex items-center gap-1 text-[0.8125rem] font-semibold">
        <Plus className="size-3.5" aria-hidden />
        {actionLabel}
      </span>
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
      tint="info"
      icon={<UserRound className="size-4.5" aria-hidden />}
      action={
        isOwn ? (
          <button
            type="button"
            onClick={() => {
              setValue(profile.bio ?? '');
              setEditing((open) => !open);
            }}
            className="grid size-8 shrink-0 place-items-center rounded-xl border border-border/70 bg-surface text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
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
        <SectionEmptyState
          icon={<UserRound className="size-5" aria-hidden />}
          hint={t('social.aboutEmptyHint')}
          actionLabel={t('social.addAbout')}
          onAction={() => {
            setValue(profile.bio ?? '');
            setEditing(true);
          }}
        />
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
      tint="accent"
      count={items.length}
      icon={<Briefcase className="size-4.5" aria-hidden />}
      action={isOwn ? <SidebarAddButton label={t('social.addExperience')} onClick={() => setEditing('new')} /> : null}
    >
      {items.length === 0 ? (
        <SectionEmptyState
          icon={<Briefcase className="size-5" aria-hidden />}
          hint={t('social.experienceEmptyHint')}
          actionLabel={t('social.addExperience')}
          onAction={() => setEditing('new')}
        />
      ) : (
        <ol className="space-y-0">
          {items.map((item, index) => (
            <li key={item.id} className="group relative">
              <CareerTimelineItem
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
                isLast={index === items.length - 1}
                onEdit={() => setEditing(item)}
                onDelete={() => void remove.mutate(item.id)}
              />
            </li>
          ))}
        </ol>
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
      tint="success"
      count={items.length}
      icon={<GraduationCap className="size-4.5" aria-hidden />}
      action={isOwn ? <SidebarAddButton label={t('social.addEducation')} onClick={() => setEditing('new')} /> : null}
    >
      {items.length === 0 ? (
        <SectionEmptyState
          icon={<GraduationCap className="size-5" aria-hidden />}
          hint={t('social.educationEmptyHint')}
          actionLabel={t('social.addEducation')}
          onAction={() => setEditing('new')}
        />
      ) : (
        <ol className="space-y-0">
          {items.map((item, index) => (
            <li key={item.id} className="group relative">
              <CareerTimelineItem
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
                isLast={index === items.length - 1}
                onEdit={() => setEditing(item)}
                onDelete={() => void remove.mutate(item.id)}
              />
            </li>
          ))}
        </ol>
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
      tint="warning"
      count={items.length}
      icon={<Sparkles className="size-4.5" aria-hidden />}
      action={
        isOwn ? <SidebarAddButton label={t('social.addSkill')} onClick={() => setAdding(true)} /> : null
      }
    >
      {items.length === 0 && !adding ? (
        <SectionEmptyState
          icon={<Sparkles className="size-5" aria-hidden />}
          hint={t('social.skillsEmptyHint')}
          actionLabel={t('social.addSkill')}
          onAction={() => setAdding(true)}
        />
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li key={item.id}>
              <span
                className={cn(
                  'profile-skill-chip inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.8125rem] font-semibold text-foreground',
                  isOwn && 'pr-1',
                )}
              >
                {item.name}
                {isOwn ? (
                  <button
                    type="button"
                    className="grid size-5 place-items-center rounded-full text-foreground-muted transition-colors hover:bg-danger-surface hover:text-danger-on-surface"
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

/**
 * Zaman çizelgesi kaydı: solda kare rozet, rozetten aşağı inen bağlayıcı çizgi,
 * sağda başlık → alt başlık → tarih tipografi hiyerarşisi.
 */
function CareerTimelineItem({
  icon,
  title,
  subtitle,
  period,
  description,
  isOwn,
  isLast,
  onEdit,
  onDelete,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  period: string;
  description?: string | null;
  isOwn: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className="profile-timeline-badge grid size-9 shrink-0 place-items-center rounded-xl"
          aria-hidden
        >
          {icon}
        </span>
        {!isLast ? (
          <span aria-hidden className="profile-timeline-line mt-1.5 w-px flex-1 rounded-full" />
        ) : null}
      </div>
      <div className={cn('min-w-0 flex-1', isLast ? 'pb-0.5' : 'pb-4')}>
        {/* Dar sütunda yalnızca başlık satırı düzenle/sil için yer bırakır. */}
        <p
          className={cn(
            'text-[0.9375rem] leading-snug font-semibold text-foreground',
            isOwn && 'pr-11',
          )}
        >
          {title}
        </p>
        {subtitle ? (
          <p className="mt-0.5 text-sm leading-snug text-foreground">{subtitle}</p>
        ) : null}
        <p className="mt-1.5 text-[0.6875rem] font-semibold tracking-[0.06em] text-foreground-muted uppercase">
          {period}
        </p>
        {description ? (
          <p className="mt-2 whitespace-pre-wrap text-[0.8125rem] leading-relaxed text-foreground-muted">
            {description}
          </p>
        ) : null}
      </div>
      {isOwn ? (
        <div className="absolute top-0 right-0 flex gap-0.5 rounded-xl bg-surface p-0.5 opacity-100 ring-1 ring-border transition-opacity sm:opacity-0 sm:shadow-md sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          <button
            type="button"
            className="grid size-8 place-items-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            aria-label={t('common.edit')}
            onClick={onEdit}
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-lg text-danger-on-surface transition-colors hover:bg-danger-surface"
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
