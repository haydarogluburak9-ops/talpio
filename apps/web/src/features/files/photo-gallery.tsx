/** Talep veya teklifteki ürün fotoğrafları. Yoksa bölüm gizlenir. */
export function PhotoGallery({
  photos,
  label,
}: {
  photos?: Array<{ id: string; url: string }> | null;
  label?: string;
}) {
  if (!photos?.length) return null;

  return (
    <div className="space-y-2">
      {label ? <p className="text-xs font-medium text-foreground-muted">{label}</p> : null}
      <ul className="flex flex-wrap gap-2">
        {photos.map((photo) => (
          <li key={photo.id}>
            {/* Nesne deposu görselleri Next Image yapılandırması dışında. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt=""
              className="size-24 rounded-lg object-cover ring-1 ring-border"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
