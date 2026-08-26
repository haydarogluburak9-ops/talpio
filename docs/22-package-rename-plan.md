# @ustapilot → @talpio paket yeniden adlandırma

**Durum:** Uygulandı (2026-08-13).

Workspace paketleri `@talpio/*`. Expo slug/scheme `talpio`, bundle `com.talpio.app`.
WorkOrder kaynağı `TALPIO`.

Yerel Docker volume’ları eski `ustapilot` kullanıcısıyla oluşturulduysa
`docker compose down -v` sonrası `docker compose up -d` gerekir; mevcut `.env`
değerleri duruyorsa volume ile uyum korunur.
