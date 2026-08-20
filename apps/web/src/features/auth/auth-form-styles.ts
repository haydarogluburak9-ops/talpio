/** Instagram düzeninde, açık tema auth form stilleri. */
export const authInputClassName =
  'h-11 rounded-[10px] border border-[#DBDBDB] bg-white px-3 text-sm text-[#262626] placeholder:text-[#8E8E8E] focus:border-[#A8A8A8] focus:outline-none focus:ring-1 focus:ring-[#A8A8A8] disabled:opacity-60 aria-[invalid=true]:border-danger-500';

/** Kayıt formu — kompakt input, koyu temadan bağımsız beyaz kutu. */
export const authCompactInputClassName =
  'h-9 rounded-lg border border-[#DBDBDB] bg-white px-3 text-sm text-[#111827] placeholder:text-[#98A2B3] shadow-none focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200/50 disabled:opacity-60 aria-[invalid=true]:border-danger-500';

/** Auth form alanı — etiket ve ipuçları her zaman okunaklı. */
export const authFormLightScopeClassName =
  '[&_label]:text-[#344054] [&_p]:text-[#667085] [&_input:not([type=checkbox])]:border-[#DBDBDB] [&_input:not([type=checkbox])]:bg-white [&_input:not([type=checkbox])]:text-[#111827]';

export const authCheckboxClassName =
  'flex cursor-pointer items-start gap-2.5 rounded-lg border border-[#DBDBDB] bg-white px-3 py-2.5';

export const authPrimaryButtonClassName =
  'h-11 w-full rounded-[10px] bg-accent-500 text-sm font-semibold text-white transition-colors hover:bg-accent-600 disabled:cursor-default disabled:opacity-40';

export const authOutlineButtonClassName =
  'inline-flex h-11 w-full items-center justify-center rounded-[10px] border border-[#DBDBDB] bg-white text-sm font-semibold text-[#262626] transition-colors hover:bg-[#FAFAFA]';
