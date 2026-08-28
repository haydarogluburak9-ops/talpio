-- Ana akış ve hikâye şeridi sorgularının tam filtresini karşılayan indeksler.
--
-- Feed sorgusu `kind` ile süzüp `created_at` ile sıralıyor, hikâye şeridi ise
-- `visibility` ile süzüp `created_at` ile sıralıyor. Bu kolon çiftleri için
-- indeks olmadığında planlayıcı tabloyu tarayıp sıralamak zorunda kalıyor ve
-- kayıt sayısı arttıkça akışın açılışı gecikiyordu.
CREATE INDEX IF NOT EXISTS "feed_items_kind_created_at_idx" ON "feed_items" ("kind", "created_at");

CREATE INDEX IF NOT EXISTS "posts_visibility_created_at_idx" ON "posts" ("visibility", "created_at");
