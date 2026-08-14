-- ==========================================================
-- DEMO DATA: Zoe Catalog
-- Ejecutar en Supabase Dashboard → SQL Editor
-- Todo es editable/eliminable desde /admin sin tocar código.
-- Seguro de re-ejecutar: sale sin cambios si ya existe.
-- ==========================================================

DO $$
DECLARE
  store_a       uuid;
  store_b       uuid;
  brand_zoe     uuid;
  brand_urban   uuid;
  cat_zapatos   uuid;
  cat_tenis     uuid;
  cat_tacones   uuid;
  cat_botas     uuid;
  cat_sandalias uuid;
  cat_baletas   uuid;
  cat_morrales  uuid;
  prod  uuid;
  opt_c uuid;
  opt_t uuid;
  ov_c1 uuid; ov_c2 uuid;
  ov_s1 uuid; ov_s2 uuid; ov_s3 uuid;
  v     uuid;
BEGIN
  -- Idempotency: salir si el demo ya fue cargado
  IF EXISTS (SELECT 1 FROM products WHERE slug = 'tenis-clasico-blanco') THEN
    RAISE NOTICE 'Demo data ya existe. Saliendo sin cambios.';
    RETURN;
  END IF;

  -- Stores: crear una tienda demo si la tabla está vacía
  SELECT id INTO store_a FROM stores ORDER BY created_at LIMIT 1;
  IF store_a IS NULL THEN
    store_a := gen_random_uuid();
    INSERT INTO stores(id,name,slug,code,address,active)
      VALUES(store_a,'Tienda Principal','tienda-principal','MAIN','Caracas, Venezuela',true);
  END IF;
  SELECT id INTO store_b FROM stores ORDER BY created_at OFFSET 1 LIMIT 1;
  IF store_b IS NULL THEN store_b := store_a; END IF;

  -- ── BRANDS ──────────────────────────────────────────────────────────────
  INSERT INTO brands (id,name,slug,description,active)
    VALUES (gen_random_uuid(),'Zoe Collection','zoe-collection','Línea exclusiva de calzado femenino venezolano.',true)
    ON CONFLICT (slug) DO NOTHING;
  SELECT id INTO brand_zoe FROM brands WHERE slug='zoe-collection';

  INSERT INTO brands (id,name,slug,description,active)
    VALUES (gen_random_uuid(),'Urban Step','urban-step','Calzado urbano y casual para la mujer moderna.',true)
    ON CONFLICT (slug) DO NOTHING;
  SELECT id INTO brand_urban FROM brands WHERE slug='urban-step';

  -- ── CATEGORIES ──────────────────────────────────────────────────────────
  INSERT INTO categories (id,name,slug,description,active,"order")
    VALUES (gen_random_uuid(),'Zapatos de Mujer','zapatos-de-mujer','Toda nuestra colección de calzado femenino.',true,10)
    ON CONFLICT (slug) DO NOTHING;
  SELECT id INTO cat_zapatos FROM categories WHERE slug='zapatos-de-mujer';

  INSERT INTO categories (id,name,slug,description,image_url,parent_id,active,"order")
    VALUES (gen_random_uuid(),'Tenis y Sneakers','tenis-y-sneakers','Sneakers casuales para cada ocasión.',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80',cat_zapatos,true,11)
    ON CONFLICT (slug) DO NOTHING;
  SELECT id INTO cat_tenis FROM categories WHERE slug='tenis-y-sneakers';

  INSERT INTO categories (id,name,slug,description,image_url,parent_id,active,"order")
    VALUES (gen_random_uuid(),'Tacones y Stilettos','tacones-y-stilettos','Elegancia en cada paso.',
      'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600&q=80',cat_zapatos,true,12)
    ON CONFLICT (slug) DO NOTHING;
  SELECT id INTO cat_tacones FROM categories WHERE slug='tacones-y-stilettos';

  INSERT INTO categories (id,name,slug,description,image_url,parent_id,active,"order")
    VALUES (gen_random_uuid(),'Botas y Botines','botas-y-botines','Para cada temporada con estilo.',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=80',cat_zapatos,true,13)
    ON CONFLICT (slug) DO NOTHING;
  SELECT id INTO cat_botas FROM categories WHERE slug='botas-y-botines';

  INSERT INTO categories (id,name,slug,description,image_url,parent_id,active,"order")
    VALUES (gen_random_uuid(),'Sandalias','sandalias-mujer','Frescura y estilo para cada día.',
      'https://images.unsplash.com/photo-1617015074763-06d82f3dc8b0?w=600&q=80',cat_zapatos,true,14)
    ON CONFLICT (slug) DO NOTHING;
  SELECT id INTO cat_sandalias FROM categories WHERE slug='sandalias-mujer';

  INSERT INTO categories (id,name,slug,description,image_url,parent_id,active,"order")
    VALUES (gen_random_uuid(),'Baletas y Flats','baletas-y-flats','Comodidad sin sacrificar estilo.',
      'https://images.unsplash.com/photo-1554188248-986adbb73be4?w=600&q=80',cat_zapatos,true,15)
    ON CONFLICT (slug) DO NOTHING;
  SELECT id INTO cat_baletas FROM categories WHERE slug='baletas-y-flats';

  INSERT INTO categories (id,name,slug,description,image_url,active,"order")
    VALUES (gen_random_uuid(),'Morrales y Carteras','morrales-y-carteras','Accesorios que completan tu look.',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80',true,20)
    ON CONFLICT (slug) DO NOTHING;
  SELECT id INTO cat_morrales FROM categories WHERE slug='morrales-y-carteras';

  -- ════════════════════════════════════════════════════════════════════════
  -- ZAPATOS (P01–P10)
  -- ════════════════════════════════════════════════════════════════════════

  -- ── P01: Tenis Clásico Blanco ────────────────────────────────────────────
  prod:=gen_random_uuid();
  INSERT INTO products(id,name,slug,brand_id,category_id,gender,description_short,description,material,tags,status,"is_new",is_featured,is_bestseller,seo_title,seo_description)
  VALUES(prod,'Tenis Clásico Blanco','tenis-clasico-blanco',brand_zoe,cat_tenis,'mujer',
    'El clásico infalible. Comodidad y estilo en blanco puro para cualquier look.',
    'Diseñado para la mujer activa que no sacrifica estilo. La suela antideslizante y el forro interior acolchado hacen de este tenis tu compañero ideal del día a día. Combina con cualquier outfit.',
    'Cuero sintético premium · suela EVA antideslizante',ARRAY['tenis','blanco','casual','nuevo'],
    'published',true,true,false,'Tenis Clásico Blanco | Zoe Collection','El tenis blanco favorito de temporada. Comodidad en cuero sintético premium. Envío a todo Venezuela.')
  ON CONFLICT(slug) DO NOTHING;
  IF FOUND THEN
    INSERT INTO product_images(id,product_id,url,alt_text,"order",is_primary)VALUES
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80','Tenis Clásico Blanco vista frontal',1,true),
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80','Tenis Clásico Blanco vista lateral',2,false);
    opt_c:=gen_random_uuid(); opt_t:=gen_random_uuid();
    INSERT INTO product_options(id,product_id,name,"order")VALUES(opt_c,prod,'Color',1),(opt_t,prod,'Talla',2);
    ov_c1:=gen_random_uuid(); ov_c2:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_c1,opt_c,'Blanco','{"hex":"#F5F5F5"}'),(ov_c2,opt_c,'Negro','{"hex":"#1A1A1A"}');
    ov_s1:=gen_random_uuid(); ov_s2:=gen_random_uuid(); ov_s3:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_s1,opt_t,'36','{}'),(ov_s2,opt_t,'37','{}'),(ov_s3,opt_t,'38','{}');
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TCB-BL36',42,55,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,12),(gen_random_uuid(),v,store_b,8)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TCB-BL37',42,55,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,15),(gen_random_uuid(),v,store_b,10)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TCB-BL38',42,55,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,9),(gen_random_uuid(),v,store_b,6)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TCB-NE36',42,55,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,10),(gen_random_uuid(),v,store_b,7)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TCB-NE37',42,55,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,14),(gen_random_uuid(),v,store_b,9)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TCB-NE38',42,55,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,8),(gen_random_uuid(),v,store_b,5)ON CONFLICT(variant_id,store_id)DO NOTHING;
  END IF;

  -- ── P02: Sneaker Urban Rosa ───────────────────────────────────────────────
  prod:=gen_random_uuid();
  INSERT INTO products(id,name,slug,brand_id,category_id,gender,description_short,description,material,tags,status,"is_new",is_featured,is_bestseller,seo_title,seo_description)
  VALUES(prod,'Sneaker Urban Rosa','sneaker-urban-rosa',brand_urban,cat_tenis,'mujer',
    'Estilo urbano en rosa. El sneaker que convierte cada calle en pasarela.',
    'La Urban Rosa es el statement piece que toda fashionista necesita. Su suela chunky ligera y el tejido transpirable la hacen perfecta para largas jornadas sin sacrificar comodidad.',
    'Tela mesh transpirable · suela chunky ligera',ARRAY['sneaker','rosa','urbano','nuevo','colorido'],
    'published',true,false,false,'Sneaker Urban Rosa | Urban Step','Sneaker rosa urbano de Urban Step. Estilo y comodidad para la mujer moderna.')
  ON CONFLICT(slug) DO NOTHING;
  IF FOUND THEN
    INSERT INTO product_images(id,product_id,url,alt_text,"order",is_primary)VALUES
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80','Sneaker Urban Rosa vista frontal',1,true),
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1595950653106-bde9a197f850?w=800&q=80','Sneaker Urban Rosa detalle',2,false);
    opt_c:=gen_random_uuid(); opt_t:=gen_random_uuid();
    INSERT INTO product_options(id,product_id,name,"order")VALUES(opt_c,prod,'Color',1),(opt_t,prod,'Talla',2);
    ov_c1:=gen_random_uuid(); ov_c2:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_c1,opt_c,'Rosa','{"hex":"#F4A7B9"}'),(ov_c2,opt_c,'Lila','{"hex":"#C8A2C8"}');
    ov_s1:=gen_random_uuid(); ov_s2:=gen_random_uuid(); ov_s3:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_s1,opt_t,'36','{}'),(ov_s2,opt_t,'37','{}'),(ov_s3,opt_t,'38','{}');
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-SUR-RO36',38,50,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,8),(gen_random_uuid(),v,store_b,5)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-SUR-RO37',38,50,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,11),(gen_random_uuid(),v,store_b,7)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-SUR-RO38',38,50,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,6),(gen_random_uuid(),v,store_b,4)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-SUR-LI36',38,50,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,7),(gen_random_uuid(),v,store_b,4)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-SUR-LI37',38,50,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,9),(gen_random_uuid(),v,store_b,6)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-SUR-LI38',38,50,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,5),(gen_random_uuid(),v,store_b,3)ON CONFLICT(variant_id,store_id)DO NOTHING;
  END IF;

  -- ── P03: Tenis Chunky Beige ───────────────────────────────────────────────
  prod:=gen_random_uuid();
  INSERT INTO products(id,name,slug,brand_id,category_id,gender,description_short,description,material,tags,status,"is_new",is_featured,is_bestseller,seo_title,seo_description)
  VALUES(prod,'Tenis Chunky Beige','tenis-chunky-beige',brand_urban,cat_tenis,'mujer',
    'La tendencia chunky que arrasa. Plataforma pronunciada y estilo 90s en tono beige neutro.',
    'Los chunky sneakers que dominan las tendencias mundiales ahora en un color beige que combina con todo tu guardarropa. La plataforma gruesa añade altura y actitud a cada look.',
    'Cuero sintético texturizado · suela chunky 5cm',ARRAY['chunky','beige','plataforma','tendencia','bestseller'],
    'published',false,true,true,'Tenis Chunky Beige | Urban Step','Chunky sneakers en beige neutro. La tendencia que arrasa en Venezuela.')
  ON CONFLICT(slug) DO NOTHING;
  IF FOUND THEN
    INSERT INTO product_images(id,product_id,url,alt_text,"order",is_primary)VALUES
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1595950653106-bde9a197f850?w=800&q=80','Tenis Chunky Beige',1,true),
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80','Tenis Chunky Beige detalle suela',2,false);
    opt_c:=gen_random_uuid(); opt_t:=gen_random_uuid();
    INSERT INTO product_options(id,product_id,name,"order")VALUES(opt_c,prod,'Color',1),(opt_t,prod,'Talla',2);
    ov_c1:=gen_random_uuid(); ov_c2:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_c1,opt_c,'Beige','{"hex":"#D4B896"}'),(ov_c2,opt_c,'Blanco','{"hex":"#F5F5F5"}');
    ov_s1:=gen_random_uuid(); ov_s2:=gen_random_uuid(); ov_s3:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_s1,opt_t,'36','{}'),(ov_s2,opt_t,'37','{}'),(ov_s3,opt_t,'38','{}');
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-TCH-BE36',55,72,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,10),(gen_random_uuid(),v,store_b,6)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-TCH-BE37',55,72,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,13),(gen_random_uuid(),v,store_b,8)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-TCH-BE38',55,72,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,7),(gen_random_uuid(),v,store_b,5)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-TCH-BL36',55,72,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,8),(gen_random_uuid(),v,store_b,4)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-TCH-BL37',55,72,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,11),(gen_random_uuid(),v,store_b,7)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-TCH-BL38',55,72,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,6),(gen_random_uuid(),v,store_b,3)ON CONFLICT(variant_id,store_id)DO NOTHING;
  END IF;

  -- ── P04: Botín Chelsea Negro ──────────────────────────────────────────────
  prod:=gen_random_uuid();
  INSERT INTO products(id,name,slug,brand_id,category_id,gender,description_short,description,material,tags,status,"is_new",is_featured,is_bestseller,seo_title,seo_description)
  VALUES(prod,'Botín Chelsea Negro','botin-chelsea-negro',brand_zoe,cat_botas,'mujer',
    'El botín Chelsea que nunca pasa de moda. Cuero genuino, elásticos laterales y puntera redondeada.',
    'Un clásico del calzado femenino reinventado por Zoe Collection. Los elásticos laterales facilitan la colocación y el cuero de alta calidad garantiza durabilidad sin sacrificar elegancia. Perfecto para el trabajo y el día a día.',
    'Cuero genuino · suela de goma · forro en cuero',ARRAY['botín','chelsea','negro','clásico','elegante'],
    'published',false,true,false,'Botín Chelsea Negro | Zoe Collection','Botín Chelsea de cuero genuino. El clásico que nunca pasa de moda. Envío a todo Venezuela.')
  ON CONFLICT(slug) DO NOTHING;
  IF FOUND THEN
    INSERT INTO product_images(id,product_id,url,alt_text,"order",is_primary)VALUES
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80','Botín Chelsea Negro',1,true),
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80','Botín Chelsea Negro lifestyle',2,false);
    opt_c:=gen_random_uuid(); opt_t:=gen_random_uuid();
    INSERT INTO product_options(id,product_id,name,"order")VALUES(opt_c,prod,'Color',1),(opt_t,prod,'Talla',2);
    ov_c1:=gen_random_uuid(); ov_c2:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_c1,opt_c,'Negro','{"hex":"#1A1A1A"}'),(ov_c2,opt_c,'Café','{"hex":"#6F4E37"}');
    ov_s1:=gen_random_uuid(); ov_s2:=gen_random_uuid(); ov_s3:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_s1,opt_t,'36','{}'),(ov_s2,opt_t,'37','{}'),(ov_s3,opt_t,'38','{}');
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-BCH-NE36',65,85,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,8),(gen_random_uuid(),v,store_b,5)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-BCH-NE37',65,85,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,10),(gen_random_uuid(),v,store_b,6)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-BCH-NE38',65,85,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,7),(gen_random_uuid(),v,store_b,4)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-BCH-CA36',65,85,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,6),(gen_random_uuid(),v,store_b,3)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-BCH-CA37',65,85,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,8),(gen_random_uuid(),v,store_b,4)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-BCH-CA38',65,85,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,5),(gen_random_uuid(),v,store_b,3)ON CONFLICT(variant_id,store_id)DO NOTHING;
  END IF;

  -- ── P05: Botín Vaquero Café ───────────────────────────────────────────────
  prod:=gen_random_uuid();
  INSERT INTO products(id,name,slug,brand_id,category_id,gender,description_short,description,material,tags,status,"is_new",is_featured,is_bestseller,seo_title,seo_description)
  VALUES(prod,'Botín Vaquero Café','botin-vaquero-cafe',brand_zoe,cat_botas,'mujer',
    'Western vibes en calzado femenino. Botín de inspiración vaquera con detalle bordado.',
    'La fusión perfecta entre el estilo vaquero y la elegancia femenina. Las costuras decorativas y la puntera afilada le dan carácter a cualquier outfit. Cuero genuino con forro suave al tacto.',
    'Cuero genuino · suela western · puntera afilada',ARRAY['botín','vaquero','café','western','nuevo'],
    'published',true,false,false,'Botín Vaquero Café | Zoe Collection','Botín de inspiración vaquera en cuero genuino café. Western style para la mujer venezolana.')
  ON CONFLICT(slug) DO NOTHING;
  IF FOUND THEN
    INSERT INTO product_images(id,product_id,url,alt_text,"order",is_primary)VALUES
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1596703427568-9c5e17a78f23?w=800&q=80','Botín Vaquero Café',1,true),
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80','Botín Vaquero Café lifestyle',2,false);
    opt_c:=gen_random_uuid(); opt_t:=gen_random_uuid();
    INSERT INTO product_options(id,product_id,name,"order")VALUES(opt_c,prod,'Color',1),(opt_t,prod,'Talla',2);
    ov_c1:=gen_random_uuid(); ov_c2:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_c1,opt_c,'Café','{"hex":"#6F4E37"}'),(ov_c2,opt_c,'Negro','{"hex":"#1A1A1A"}');
    ov_s1:=gen_random_uuid(); ov_s2:=gen_random_uuid(); ov_s3:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_s1,opt_t,'36','{}'),(ov_s2,opt_t,'37','{}'),(ov_s3,opt_t,'38','{}');
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-BVQ-CA36',75,95,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,6),(gen_random_uuid(),v,store_b,3)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-BVQ-CA37',75,95,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,8),(gen_random_uuid(),v,store_b,5)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-BVQ-CA38',75,95,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,5),(gen_random_uuid(),v,store_b,2)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-BVQ-NE36',75,95,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,7),(gen_random_uuid(),v,store_b,4)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-BVQ-NE37',75,95,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,9),(gen_random_uuid(),v,store_b,5)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-BVQ-NE38',75,95,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,4),(gen_random_uuid(),v,store_b,2)ON CONFLICT(variant_id,store_id)DO NOTHING;
  END IF;

  -- ── P06: Tacón Fino Nude ──────────────────────────────────────────────────
  prod:=gen_random_uuid();
  INSERT INTO products(id,name,slug,brand_id,category_id,gender,description_short,description,material,tags,status,"is_new",is_featured,is_bestseller,seo_title,seo_description)
  VALUES(prod,'Tacón Fino Nude','tacon-fino-nude',brand_zoe,cat_tacones,'mujer',
    'La elegancia definitiva. Tacón de aguja en nude que estiliza y alarga la pierna.',
    'Diseñado para la mujer que quiere causar impresión. El color nude se funde con el tono de piel creando la ilusión de piernas interminables. Tacón de 8cm con plataforma interior de 1cm para mayor comodidad.',
    'Cuero sintético satinado · tacón de aguja 8cm',ARRAY['tacón','nude','elegante','stiletto','ocasión especial'],
    'published',false,true,false,'Tacón Fino Nude | Zoe Collection','Tacón de aguja en nude. Elegancia venezolana para cada ocasión especial.')
  ON CONFLICT(slug) DO NOTHING;
  IF FOUND THEN
    INSERT INTO product_images(id,product_id,url,alt_text,"order",is_primary)VALUES
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&q=80','Tacón Fino Nude',1,true),
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80','Tacón Fino Nude lifestyle',2,false);
    opt_c:=gen_random_uuid(); opt_t:=gen_random_uuid();
    INSERT INTO product_options(id,product_id,name,"order")VALUES(opt_c,prod,'Color',1),(opt_t,prod,'Talla',2);
    ov_c1:=gen_random_uuid(); ov_c2:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_c1,opt_c,'Nude','{"hex":"#E8CDB0"}'),(ov_c2,opt_c,'Negro','{"hex":"#1A1A1A"}');
    ov_s1:=gen_random_uuid(); ov_s2:=gen_random_uuid(); ov_s3:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_s1,opt_t,'36','{}'),(ov_s2,opt_t,'37','{}'),(ov_s3,opt_t,'38','{}');
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TFN-NU36',55,70,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,9),(gen_random_uuid(),v,store_b,5)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TFN-NU37',55,70,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,12),(gen_random_uuid(),v,store_b,7)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TFN-NU38',55,70,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,7),(gen_random_uuid(),v,store_b,4)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TFN-NE36',55,70,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,10),(gen_random_uuid(),v,store_b,6)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TFN-NE37',55,70,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,13),(gen_random_uuid(),v,store_b,8)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TFN-NE38',55,70,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,8),(gen_random_uuid(),v,store_b,5)ON CONFLICT(variant_id,store_id)DO NOTHING;
  END IF;

  -- ── P07: Tacón Block Rojo ─────────────────────────────────────────────────
  prod:=gen_random_uuid();
  INSERT INTO products(id,name,slug,brand_id,category_id,gender,description_short,description,material,tags,status,"is_new",is_featured,is_bestseller,seo_title,seo_description)
  VALUES(prod,'Tacón Block Rojo','tacon-block-rojo',brand_zoe,cat_tacones,'mujer',
    'El tacón block que combina comodidad con actitud. Rojo apasionado para las que se atreven.',
    'El tacón block es la versión cómoda del tacón de aguja: misma altura, mucho más estabilidad. En rojo intenso para las mujeres que no pasan desapercibidas. Perfecto para salidas nocturnas y eventos especiales.',
    'Cuero sintético mate · tacón block 7cm',ARRAY['tacón','rojo','block','llamativo','nuevo'],
    'published',true,false,false,'Tacón Block Rojo | Zoe Collection','Tacón block en rojo intenso. Comodidad y actitud para la noche venezolana.')
  ON CONFLICT(slug) DO NOTHING;
  IF FOUND THEN
    INSERT INTO product_images(id,product_id,url,alt_text,"order",is_primary)VALUES
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&q=80','Tacón Block Rojo',1,true),
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80','Tacón Block Rojo lifestyle',2,false);
    opt_c:=gen_random_uuid(); opt_t:=gen_random_uuid();
    INSERT INTO product_options(id,product_id,name,"order")VALUES(opt_c,prod,'Color',1),(opt_t,prod,'Talla',2);
    ov_c1:=gen_random_uuid(); ov_c2:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_c1,opt_c,'Rojo','{"hex":"#C0392B"}'),(ov_c2,opt_c,'Negro','{"hex":"#1A1A1A"}');
    ov_s1:=gen_random_uuid(); ov_s2:=gen_random_uuid(); ov_s3:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_s1,opt_t,'36','{}'),(ov_s2,opt_t,'37','{}'),(ov_s3,opt_t,'38','{}');
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TBR-RO36',48,65,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,7),(gen_random_uuid(),v,store_b,4)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TBR-RO37',48,65,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,9),(gen_random_uuid(),v,store_b,5)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TBR-RO38',48,65,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,5),(gen_random_uuid(),v,store_b,3)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TBR-NE36',48,65,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,8),(gen_random_uuid(),v,store_b,4)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TBR-NE37',48,65,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,10),(gen_random_uuid(),v,store_b,6)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TBR-NE38',48,65,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,6),(gen_random_uuid(),v,store_b,3)ON CONFLICT(variant_id,store_id)DO NOTHING;
  END IF;

  -- ── P08: Sandalia Trenzada Camel ──────────────────────────────────────────
  prod:=gen_random_uuid();
  INSERT INTO products(id,name,slug,brand_id,category_id,gender,description_short,description,material,tags,status,"is_new",is_featured,is_bestseller,seo_title,seo_description)
  VALUES(prod,'Sandalia Trenzada Camel','sandalia-trenzada-camel',brand_zoe,cat_sandalias,'mujer',
    'La sandalia boho-chic de la temporada. Tiras trenzadas en cuero camel para un look natural.',
    'Inspirada en las tendencias mediterráneas, la Sandalia Trenzada Camel es el complemento perfecto para looks de playa, tarde de compras o cenas al aire libre. Las tiras trenzadas artesanalmente garantizan un ajuste perfecto y un estilo único.',
    'Cuero genuino trenzado · suela de cuero',ARRAY['sandalia','camel','trenzada','boho','bestseller','verano'],
    'published',false,false,true,'Sandalia Trenzada Camel | Zoe Collection','Sandalia boho-chic de cuero trenzado en camel. La más vendida de la temporada.')
  ON CONFLICT(slug) DO NOTHING;
  IF FOUND THEN
    INSERT INTO product_images(id,product_id,url,alt_text,"order",is_primary)VALUES
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1617015074763-06d82f3dc8b0?w=800&q=80','Sandalia Trenzada Camel',1,true),
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80','Sandalia Trenzada Camel lifestyle',2,false);
    opt_c:=gen_random_uuid(); opt_t:=gen_random_uuid();
    INSERT INTO product_options(id,product_id,name,"order")VALUES(opt_c,prod,'Color',1),(opt_t,prod,'Talla',2);
    ov_c1:=gen_random_uuid(); ov_c2:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_c1,opt_c,'Camel','{"hex":"#C19A6B"}'),(ov_c2,opt_c,'Negro','{"hex":"#1A1A1A"}');
    ov_s1:=gen_random_uuid(); ov_s2:=gen_random_uuid(); ov_s3:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_s1,opt_t,'36','{}'),(ov_s2,opt_t,'37','{}'),(ov_s3,opt_t,'38','{}');
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-STC-CA36',35,45,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,14),(gen_random_uuid(),v,store_b,9)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-STC-CA37',35,45,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,18),(gen_random_uuid(),v,store_b,12)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-STC-CA38',35,45,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,10),(gen_random_uuid(),v,store_b,7)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-STC-NE36',35,45,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,12),(gen_random_uuid(),v,store_b,8)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-STC-NE37',35,45,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,15),(gen_random_uuid(),v,store_b,10)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-STC-NE38',35,45,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,9),(gen_random_uuid(),v,store_b,6)ON CONFLICT(variant_id,store_id)DO NOTHING;
  END IF;

  -- ── P09: Sandalia con Plataforma Blanca ───────────────────────────────────
  prod:=gen_random_uuid();
  INSERT INTO products(id,name,slug,brand_id,category_id,gender,description_short,description,material,tags,status,"is_new",is_featured,is_bestseller,seo_title,seo_description)
  VALUES(prod,'Sandalia Plataforma Blanca','sandalia-plataforma-blanca',brand_urban,cat_sandalias,'mujer',
    'Altura sin esfuerzo. Plataforma de 5cm que eleva tu look con máxima comodidad.',
    'La sandalia de plataforma es el calzado definitivo del verano: añade altura sin la incomodidad del tacón de aguja. La correa al tobillo asegura el pie y la suela de plataforma amortigua cada paso.',
    'Cuero sintético · plataforma 5cm · correa al tobillo',ARRAY['sandalia','plataforma','blanca','verano','nuevo'],
    'published',true,false,false,'Sandalia Plataforma Blanca | Urban Step','Sandalia de plataforma en blanco. Altura y comodidad para el verano venezolano.')
  ON CONFLICT(slug) DO NOTHING;
  IF FOUND THEN
    INSERT INTO product_images(id,product_id,url,alt_text,"order",is_primary)VALUES
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1512025316832-8658f04f2e6e?w=800&q=80','Sandalia Plataforma Blanca',1,true),
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80','Sandalia Plataforma Blanca lifestyle',2,false);
    opt_c:=gen_random_uuid(); opt_t:=gen_random_uuid();
    INSERT INTO product_options(id,product_id,name,"order")VALUES(opt_c,prod,'Color',1),(opt_t,prod,'Talla',2);
    ov_c1:=gen_random_uuid(); ov_c2:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_c1,opt_c,'Blanco','{"hex":"#F5F5F5"}'),(ov_c2,opt_c,'Negro','{"hex":"#1A1A1A"}');
    ov_s1:=gen_random_uuid(); ov_s2:=gen_random_uuid(); ov_s3:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_s1,opt_t,'36','{}'),(ov_s2,opt_t,'37','{}'),(ov_s3,opt_t,'38','{}');
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-SPB-BL36',42,55,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,10),(gen_random_uuid(),v,store_b,6)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-SPB-BL37',42,55,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,13),(gen_random_uuid(),v,store_b,8)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-SPB-BL38',42,55,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,7),(gen_random_uuid(),v,store_b,4)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-SPB-NE36',42,55,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,9),(gen_random_uuid(),v,store_b,5)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-SPB-NE37',42,55,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,11),(gen_random_uuid(),v,store_b,7)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-SPB-NE38',42,55,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,6),(gen_random_uuid(),v,store_b,3)ON CONFLICT(variant_id,store_id)DO NOTHING;
  END IF;

  -- ── P10: Baleta Negra Básica ──────────────────────────────────────────────
  prod:=gen_random_uuid();
  INSERT INTO products(id,name,slug,brand_id,category_id,gender,description_short,description,material,tags,status,"is_new",is_featured,is_bestseller,seo_title,seo_description)
  VALUES(prod,'Baleta Negra Básica','baleta-negra-basica',brand_zoe,cat_baletas,'mujer',
    'La básica imprescindible. Baleta negra que va con absolutamente todo en tu guardarropa.',
    'Toda mujer necesita una baleta negra perfecta. Esta es la de Zoe: forro interior en gamuza para máxima comodidad, suela antideslizante y cuero suave que se adapta al pie desde el primer uso. Un básico que nunca pasa de moda.',
    'Cuero genuino · forro en gamuza · suela antideslizante',ARRAY['baleta','negro','básico','cómodo','clásico','bestseller'],
    'published',false,false,true,'Baleta Negra Básica | Zoe Collection','La baleta negra perfecta. Cuero genuino con forro en gamuza. La más vendida de Zoe.')
  ON CONFLICT(slug) DO NOTHING;
  IF FOUND THEN
    INSERT INTO product_images(id,product_id,url,alt_text,"order",is_primary)VALUES
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1554188248-986adbb73be4?w=800&q=80','Baleta Negra Básica',1,true),
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80','Baleta Negra Básica lifestyle',2,false);
    opt_c:=gen_random_uuid(); opt_t:=gen_random_uuid();
    INSERT INTO product_options(id,product_id,name,"order")VALUES(opt_c,prod,'Color',1),(opt_t,prod,'Talla',2);
    ov_c1:=gen_random_uuid(); ov_c2:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_c1,opt_c,'Negro','{"hex":"#1A1A1A"}'),(ov_c2,opt_c,'Nude','{"hex":"#E8CDB0"}');
    ov_s1:=gen_random_uuid(); ov_s2:=gen_random_uuid(); ov_s3:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_s1,opt_t,'36','{}'),(ov_s2,opt_t,'37','{}'),(ov_s3,opt_t,'38','{}');
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-BNB-NE36',28,38,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,16),(gen_random_uuid(),v,store_b,11)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-BNB-NE37',28,38,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,20),(gen_random_uuid(),v,store_b,14)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-BNB-NE38',28,38,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,13),(gen_random_uuid(),v,store_b,9)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-BNB-NU36',28,38,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,12),(gen_random_uuid(),v,store_b,8)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-BNB-NU37',28,38,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,15),(gen_random_uuid(),v,store_b,10)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-BNB-NU38',28,38,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2),(v,ov_s3); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,9),(gen_random_uuid(),v,store_b,6)ON CONFLICT(variant_id,store_id)DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════════════════════════════════
  -- MORRALES Y CARTERAS (P11–P13) — solo Color, sin Talla
  -- ════════════════════════════════════════════════════════════════════════

  -- ── P11: Morral Urbano Negro ──────────────────────────────────────────────
  prod:=gen_random_uuid();
  INSERT INTO products(id,name,slug,brand_id,category_id,gender,description_short,description,material,tags,status,"is_new",is_featured,is_bestseller,seo_title,seo_description)
  VALUES(prod,'Morral Urbano Negro','morral-urbano-negro',brand_urban,cat_morrales,'mujer',
    'El morral que lo carga todo con estilo. Compartimentos inteligentes para la mujer activa.',
    'Diseñado para la mujer en movimiento: compartimento para laptop 15", bolsillo frontal organizador, correas acolchadas ajustables y material resistente al agua. Todo lo que necesitas, siempre a la mano.',
    'Cuero sintético resistente al agua · forro interior en tela',ARRAY['morral','negro','urbano','práctico','nuevo'],
    'published',true,false,false,'Morral Urbano Negro | Urban Step','Morral negro con compartimentos inteligentes para laptop. El compañero de la mujer activa.')
  ON CONFLICT(slug) DO NOTHING;
  IF FOUND THEN
    INSERT INTO product_images(id,product_id,url,alt_text,"order",is_primary)VALUES
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80','Morral Urbano Negro',1,true),
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80','Morral Urbano Negro detalle',2,false);
    opt_c:=gen_random_uuid();
    INSERT INTO product_options(id,product_id,name,"order")VALUES(opt_c,prod,'Color',1);
    ov_c1:=gen_random_uuid(); ov_c2:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_c1,opt_c,'Negro','{"hex":"#1A1A1A"}'),(ov_c2,opt_c,'Café','{"hex":"#6F4E37"}');
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-MUN-NE',45,60,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,10),(gen_random_uuid(),v,store_b,6)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'URB-MUN-CA',45,60,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,7),(gen_random_uuid(),v,store_b,4)ON CONFLICT(variant_id,store_id)DO NOTHING;
  END IF;

  -- ── P12: Cartera Mini Rosa ────────────────────────────────────────────────
  prod:=gen_random_uuid();
  INSERT INTO products(id,name,slug,brand_id,category_id,gender,description_short,description,material,tags,status,"is_new",is_featured,is_bestseller,seo_title,seo_description)
  VALUES(prod,'Cartera Mini Rosa','cartera-mini-rosa',brand_zoe,cat_morrales,'mujer',
    'Pequeña pero poderosa. La cartera mini que cabe en cualquier occasion y hace juego con todo.',
    'La Cartera Mini Rosa es el accesorio it de la temporada. Su cadena dorada ajustable permite usarla como crossbody o clutch. Interior forrado con bolsillo para tarjetas y compartimento principal con cierre magnético.',
    'Cuero sintético · cadena dorada · forro satinado',ARRAY['cartera','rosa','mini','crossbody','cadena','tendencia'],
    'published',false,true,false,'Cartera Mini Rosa | Zoe Collection','Cartera mini en rosa con cadena dorada. El accesorio it de la temporada venezolana.')
  ON CONFLICT(slug) DO NOTHING;
  IF FOUND THEN
    INSERT INTO product_images(id,product_id,url,alt_text,"order",is_primary)VALUES
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80','Cartera Mini Rosa',1,true),
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80','Cartera Mini Rosa lifestyle',2,false);
    opt_c:=gen_random_uuid();
    INSERT INTO product_options(id,product_id,name,"order")VALUES(opt_c,prod,'Color',1);
    ov_c1:=gen_random_uuid(); ov_c2:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_c1,opt_c,'Rosa','{"hex":"#F4A7B9"}'),(ov_c2,opt_c,'Nude','{"hex":"#E8CDB0"}');
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-CMR-RO',35,48,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,12),(gen_random_uuid(),v,store_b,8)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-CMR-NU',35,48,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,9),(gen_random_uuid(),v,store_b,5)ON CONFLICT(variant_id,store_id)DO NOTHING;
  END IF;

  -- ── P13: Tote Bag Camel ───────────────────────────────────────────────────
  prod:=gen_random_uuid();
  INSERT INTO products(id,name,slug,brand_id,category_id,gender,description_short,description,material,tags,status,"is_new",is_featured,is_bestseller,seo_title,seo_description)
  VALUES(prod,'Tote Bag Camel','tote-bag-camel',brand_zoe,cat_morrales,'mujer',
    'El tote bag que lo carga todo. Spacioso, resistente y con el camel neutro que combina con todo.',
    'Un tote bag generoso que se adapta a tu ritmo de vida: mercado, trabajo, playa o universidad. Las asas reforzadas soportan hasta 10kg y el bolsillo interior con cierre mantiene tus objetos de valor seguros.',
    'Cuero sintético vegan · asas reforzadas · bolsillo interior con cierre',ARRAY['tote','camel','espacioso','versátil','bestseller'],
    'published',false,false,true,'Tote Bag Camel | Zoe Collection','Tote bag camel en cuero vegan. El más vendido: espacioso, resistente y versátil.')
  ON CONFLICT(slug) DO NOTHING;
  IF FOUND THEN
    INSERT INTO product_images(id,product_id,url,alt_text,"order",is_primary)VALUES
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80','Tote Bag Camel',1,true),
      (gen_random_uuid(),prod,'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80','Tote Bag Camel detalle',2,false);
    opt_c:=gen_random_uuid();
    INSERT INTO product_options(id,product_id,name,"order")VALUES(opt_c,prod,'Color',1);
    ov_c1:=gen_random_uuid(); ov_c2:=gen_random_uuid();
    INSERT INTO product_option_values(id,option_id,value,extra)VALUES(ov_c1,opt_c,'Camel','{"hex":"#C19A6B"}'),(ov_c2,opt_c,'Negro','{"hex":"#1A1A1A"}');
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TBC-CA',38,50,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c1); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,13),(gen_random_uuid(),v,store_b,9)ON CONFLICT(variant_id,store_id)DO NOTHING;
    v:=gen_random_uuid(); INSERT INTO product_variants(id,product_id,sku,price_usd,compare_at_price_usd,status)VALUES(v,prod,'ZOE-TBC-NE',38,50,'active'); INSERT INTO variant_option_values(variant_id,option_value_id)VALUES(v,ov_c2); INSERT INTO inventory(id,variant_id,store_id,quantity_on_hand)VALUES(gen_random_uuid(),v,store_a,10),(gen_random_uuid(),v,store_b,7)ON CONFLICT(variant_id,store_id)DO NOTHING;
  END IF;

  -- ════════════════════════════════════════════════════════════════════════
  -- BANNERS (editables desde /admin/marketing/banners)
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO banners(id,name,image_desktop_url,image_mobile_url,headline,copy,cta_label,cta_url,position,priority,active)
  VALUES
    (gen_random_uuid(),'Nueva Colección 2026',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80',
      'Nueva Colección 2026',
      'Los estilos que definen la temporada. Zapatos, morrales y carteras con envío a todo Venezuela.',
      'Ver colección','catalogo','home',100,true),
    (gen_random_uuid(),'Colección Especial',
      'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=1600&q=80',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80',
      'Colección Especial',
      'Camina a tu manera.',
      'Descubrir','catalogo','home',90,true),
    (gen_random_uuid(),'Oferta Temporada — Hasta 40% Off',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',
      'Hasta 40% de descuento',
      'Aprovecha los mejores precios en tenis, sandalias, botas y accesorios.',
      'Ver ofertas','catalogo','home',80,false),
    (gen_random_uuid(),'Morrales y Carteras',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1600&q=80',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80',
      'Morrales & Carteras',
      'Accesorios que completan cualquier look. Cuero genuino y sintético en los colores de temporada.',
      'Ver accesorios','categoria/morrales-y-carteras','home',60,false);

  -- ════════════════════════════════════════════════════════════════════════
  -- HOME SECTIONS (editables desde /admin/marketing/home)
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO home_sections(id,type,title,subtitle,config,"order",active)
  VALUES
    (gen_random_uuid(),'hero','Bienvenida a Zoe','Tu destino de moda femenina en Venezuela',
      '{"imageUrl":"https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=80","ctaLabel":"Explorar catálogo","ctaUrl":"/catalogo"}'::jsonb,
      1,true),
    (gen_random_uuid(),'banner',null,null,
      '{"position":"home"}'::jsonb,
      2,true),
    (gen_random_uuid(),'categories','Compra por categoría','Encuentra tu estilo perfecto',
      '{"limit":8}'::jsonb,
      3,true),
    (gen_random_uuid(),'product_slider','Destacados de temporada',null,
      '{"mode":"featured","limit":8}'::jsonb,
      4,true),
    (gen_random_uuid(),'product_slider','Nuevas llegadas',null,
      '{"mode":"new","limit":8}'::jsonb,
      5,true),
    (gen_random_uuid(),'product_slider','Los más vendidos',null,
      '{"mode":"bestseller","limit":8}'::jsonb,
      6,true),
    (gen_random_uuid(),'image_text','Hecho con amor en Venezuela',
      'Calzado y accesorios diseñados para la mujer venezolana. Cada pieza es seleccionada con cuidado para que dures toda la temporada.',
      '{"imageUrl":"https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80","ctaLabel":"Nuestra historia","ctaUrl":"/catalogo","align":"right"}'::jsonb,
      7,true),
    (gen_random_uuid(),'features','¿Por qué elegirnos?',null,
      '{"items":[{"title":"Envío a todo Venezuela","description":"Hacemos llegar tus pedidos a cualquier ciudad del país con MRW, Zoom y Tealca."},{"title":"Múltiples formas de pago","description":"Pago móvil, Zelle, efectivo y más. Compramos cómodo como Venezuela."},{"title":"Cambios garantizados","description":"30 días para cambiar tu talla o color si el producto no es lo que esperabas."}]}'::jsonb,
      8,true),
    (gen_random_uuid(),'brands','Nuestras marcas',null,
      '{"limit":12}'::jsonb,
      9,true);

  RAISE NOTICE 'Demo data cargado exitosamente: 2 marcas, 7 categorías, 10 zapatos + 3 morrales, 3 banners, 9 secciones de home.';
END $$;
