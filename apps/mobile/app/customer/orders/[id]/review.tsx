import { useLocalSearchParams } from 'expo-router';

import { ReviewFormScreen } from '@/features/reviews/review-form-screen';

export default function CreateReviewScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  return <ReviewFormScreen orderId={params.id ?? ''} />;
}
