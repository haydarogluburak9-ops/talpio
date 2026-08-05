import { useLocalSearchParams } from 'expo-router';

import { ComplaintSubjectType } from '@ustapilot/types';

import { ComplaintFormScreen } from '@/features/support/complaint-form-screen';
import { useCurrentUser } from '@/features/auth/use-current-user';

function isSubjectType(value: string | undefined): value is ComplaintSubjectType {
  return (
    value === 'USER' ||
    value === 'JOB_REQUEST' ||
    value === 'OFFER' ||
    value === 'REVIEW' ||
    value === 'MESSAGE'
  );
}

export default function ProviderComplaintScreen() {
  const params = useLocalSearchParams<{ subjectType?: string; subjectId?: string }>();
  const user = useCurrentUser();
  const subjectType = isSubjectType(params.subjectType)
    ? params.subjectType
    : ComplaintSubjectType.USER;
  const subjectId = params.subjectId ?? user.data?.id ?? '';

  if (!subjectId) return null;

  return <ComplaintFormScreen subjectType={subjectType} subjectId={subjectId} />;
}
