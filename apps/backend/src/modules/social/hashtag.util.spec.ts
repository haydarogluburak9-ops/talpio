import { extractHashtags, extractMentions, normalizeHashtag } from './hashtag.util';

describe('hashtag.util', () => {
  it('#gaziantep ve #madeniyağ çıkarır, tekrarları tekilleştirir', () => {
    const tags = extractHashtags('Bugün #Gaziantep #madeniyağ ve tekrar #gaziantep kampanya');
    expect(tags.map((t) => t.slug)).toEqual(['gaziantep', 'madeniyağ']);
  });

  it('gönderi başına en fazla 8 hashtag alır', () => {
    const body = Array.from({ length: 12 }, (_, i) => `#tag${i}`).join(' ');
    expect(extractHashtags(body)).toHaveLength(8);
  });

  it('@mention kullanıcı adlarını çıkarır', () => {
    expect(extractMentions('Merhaba @ElifYag ve @burak @elifYag')).toEqual(['elifyag', 'burak']);
  });

  it('geçersiz kısa etiketi atar', () => {
    expect(normalizeHashtag('#x')).toBeNull();
    expect(normalizeHashtag('#indirim')).toEqual({ slug: 'indirim', display: 'indirim' });
  });
});
