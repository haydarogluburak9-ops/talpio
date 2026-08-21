import { MessageType, type MessagePreview } from '@talpio/types';

export function formatMessagePreview(
  preview: MessagePreview | null | undefined,
  currentUserId: string,
  t: (key: string) => string,
): string {
  if (!preview) return t('messaging.threadEmpty');

  const prefix = preview.senderId === currentUserId ? `${t('messaging.previewYou')}: ` : '';

  if (preview.type === MessageType.VOICE) {
    return `${prefix}${t('messaging.voiceMessage')}`;
  }
  if (preview.type === MessageType.IMAGE) {
    return `${prefix}${t('messaging.previewPhoto')}`;
  }
  if (preview.type === MessageType.FILE) {
    return `${prefix}${t('messaging.previewFile')}`;
  }

  return `${prefix}${preview.body?.trim() || t('messaging.threadEmpty')}`;
}
