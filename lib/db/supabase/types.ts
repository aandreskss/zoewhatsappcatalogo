/**
 * Tipos de la base de datos usados por el cliente de Supabase tipado.
 *
 * Cubre las tablas que el código de la aplicación toca hasta la Fase 5.
 * Cuando el proyecto esté vinculado a una instancia real de Supabase, la
 * fuente de verdad pasa a ser:
 *
 *   npx supabase gen types typescript --linked > lib/db/supabase/types.ts
 *
 * Mientras tanto, este archivo se mantiene a mano en sincronía con
 * `supabase/migrations/*.sql` — cualquier columna nueva debe reflejarse
 * aquí para que TypeScript estricto siga detectando errores reales.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

/**
 * Metadata mínima de relaciones para que `@supabase/postgrest-js` (>=1.19)
 * pueda tipar los `select()` con embeds anidados (`tabla(columnas)`) que
 * usa el código — sin esto, cualquier embed resuelve a
 * `SelectQueryError` en vez del tipo real. Los nombres de FK son
 * descriptivos (no se leen en runtime); lo que sí importa para el
 * chequeo de tipos es `referencedRelation`/`columns`/`referencedColumns`,
 * que deben reflejar las FKs reales de `supabase/migrations/*.sql`.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      roles: {
        Row: { id: string; name: string; description: string | null };
        Insert: Partial<Database["public"]["Tables"]["roles"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["roles"]["Row"]>;
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          store_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_roles"]["Row"]> & {
          user_id: string;
          role_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_roles_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      stores: {
        Row: {
          id: string;
          name: string;
          code: string;
          slug: string;
          address: string | null;
          city: string | null;
          state: string | null;
          lat: number | null;
          lng: number | null;
          google_maps_url: string | null;
          phone: string | null;
          whatsapp: string | null;
          pickup_enabled: boolean;
          delivery_enabled: boolean;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["stores"]["Row"]> & {
          name: string;
          code: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["stores"]["Row"]>;
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          description: string | null;
          website: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["brands"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["brands"]["Row"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          banner_url: string | null;
          parent_id: string | null;
          seo_title: string | null;
          seo_description: string | null;
          order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          sku: string | null;
          brand_id: string | null;
          category_id: string | null;
          gender: string | null;
          description_short: string | null;
          description: string | null;
          material: string | null;
          tags: string[];
          status: "draft" | "published" | "hidden" | "archived";
          badge_custom: string | null;
          is_new: boolean;
          is_featured: boolean;
          is_bestseller: boolean;
          seo_title: string | null;
          seo_description: string | null;
          og_image_url: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt_text: string;
          order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_images"]["Row"]> & {
          product_id: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_options: {
        Row: { id: string; product_id: string; name: string; order: number };
        Insert: Partial<Database["public"]["Tables"]["product_options"]["Row"]> & {
          product_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_options"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "product_options_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_option_values: {
        Row: { id: string; option_id: string; value: string; extra: Json; order: number };
        Insert: Partial<Database["public"]["Tables"]["product_option_values"]["Row"]> & {
          option_id: string;
          value: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_option_values"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_id_fkey";
            columns: ["option_id"];
            isOneToOne: false;
            referencedRelation: "product_options";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          price_usd: number;
          compare_at_price_usd: number | null;
          cost_usd: number | null;
          status: "active" | "inactive";
          barcode: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_variants"]["Row"]> & {
          product_id: string;
          sku: string;
          price_usd: number;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      variant_option_values: {
        Row: { variant_id: string; option_value_id: string };
        Insert: Database["public"]["Tables"]["variant_option_values"]["Row"];
        Update: Partial<Database["public"]["Tables"]["variant_option_values"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "variant_option_values_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "variant_option_values_option_value_id_fkey";
            columns: ["option_value_id"];
            isOneToOne: false;
            referencedRelation: "product_option_values";
            referencedColumns: ["id"];
          },
        ];
      };
      variant_images: {
        Row: { variant_id: string; image_id: string };
        Insert: Database["public"]["Tables"]["variant_images"]["Row"];
        Update: Partial<Database["public"]["Tables"]["variant_images"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "variant_images_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "variant_images_image_id_fkey";
            columns: ["image_id"];
            isOneToOne: false;
            referencedRelation: "product_images";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory: {
        Row: {
          id: string;
          variant_id: string;
          store_id: string;
          quantity_on_hand: number;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["inventory"]["Row"]> & {
          variant_id: string;
          store_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory"]["Row"]>;
        Relationships: [];
      };
      inventory_reservations: {
        Row: {
          id: string;
          variant_id: string;
          store_id: string;
          order_id: string | null;
          quantity: number;
          status: "active" | "converted" | "released";
          expires_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["inventory_reservations"]["Row"]> & {
          variant_id: string;
          store_id: string;
          quantity: number;
          expires_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_reservations"]["Row"]>;
        Relationships: [];
      };
      inventory_movements: {
        Row: {
          id: string;
          variant_id: string;
          store_id: string;
          type:
            "entrada" | "salida" | "ajuste" | "transferencia" | "venta" | "liberacion";
          quantity_delta: number;
          reason: string | null;
          reference_order_id: string | null;
          user_id: string | null;
          previous_quantity: number;
          new_quantity: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["inventory_movements"]["Row"]> & {
          variant_id: string;
          store_id: string;
          type: string;
          quantity_delta: number;
          previous_quantity: number;
          new_quantity: number;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_movements"]["Row"]>;
        Relationships: [];
      };
      currencies: {
        Row: { code: string; symbol: string; decimals: number; is_base: boolean };
        Insert: Database["public"]["Tables"]["currencies"]["Row"];
        Update: Partial<Database["public"]["Tables"]["currencies"]["Row"]>;
        Relationships: [];
      };
      exchange_rates: {
        Row: {
          id: string;
          currency_pair: string;
          rate: number;
          source: string;
          is_automatic: boolean;
          fetched_at: string;
          effective_at: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["exchange_rates"]["Row"]> & {
          currency_pair: string;
          rate: number;
          source: string;
        };
        Update: Partial<Database["public"]["Tables"]["exchange_rates"]["Row"]>;
        Relationships: [];
      };
      payment_methods: {
        Row: {
          id: string;
          name: string;
          instructions: string | null;
          active: boolean;
          order: number;
          store_ids: string[] | null;
        };
        Insert: Partial<Database["public"]["Tables"]["payment_methods"]["Row"]> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_methods"]["Row"]>;
        Relationships: [];
      };
      shipping_zones: {
        Row: {
          id: string;
          name: string;
          city: string | null;
          sectors: string[];
          cost_usd: number;
          active: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["shipping_zones"]["Row"]> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipping_zones"]["Row"]>;
        Relationships: [];
      };
      whatsapp_templates: {
        Row: {
          id: string;
          name: string;
          template: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["whatsapp_templates"]["Row"]> & {
          name: string;
          template: string;
        };
        Update: Partial<Database["public"]["Tables"]["whatsapp_templates"]["Row"]>;
        Relationships: [];
      };
      company_settings: {
        Row: { key: string; value: Json; updated_at: string };
        Insert: { key: string; value: Json; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["company_settings"]["Row"]>;
        Relationships: [];
      };
      themes: {
        Row: {
          id: string;
          name: string;
          tokens: Json;
          active_template: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["themes"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["themes"]["Row"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          first_name: string;
          last_name: string | null;
          phone: string;
          whatsapp_phone: string | null;
          email: string | null;
          city: string | null;
          state: string | null;
          address: string | null;
          source: Json | null;
          first_order_at: string | null;
          last_order_at: string | null;
          orders_count: number;
          total_spent_usd: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["customers"]["Row"]> & {
          first_name: string;
          phone: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Row"]>;
        Relationships: [];
      };
      customer_addresses: {
        Row: {
          id: string;
          customer_id: string;
          label: string | null;
          state: string | null;
          city: string | null;
          municipality: string | null;
          address: string;
          reference: string | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["customer_addresses"]["Row"]> & {
          customer_id: string;
          address: string;
        };
        Update: Partial<Database["public"]["Tables"]["customer_addresses"]["Row"]>;
        Relationships: [];
      };
      carts: {
        Row: {
          id: string;
          session_id: string;
          customer_id: string | null;
          status: "active" | "converted" | "abandoned";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["carts"]["Row"]> & {
          session_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["carts"]["Row"]>;
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          variant_id: string;
          quantity: number;
          unit_price_snapshot_usd: number;
          added_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["cart_items"]["Row"]> & {
          cart_id: string;
          variant_id: string;
          quantity: number;
          unit_price_snapshot_usd: number;
        };
        Update: Partial<Database["public"]["Tables"]["cart_items"]["Row"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          public_access_token: string;
          customer_id: string;
          store_id: string | null;
          status: string;
          subtotal_usd: number;
          discount_usd: number;
          shipping_estimate_usd: number;
          total_usd: number;
          exchange_rate_used: number | null;
          exchange_rate_currency_pair: string | null;
          exchange_rate_source: string | null;
          delivery_method: "pickup" | "delivery" | "shipping";
          delivery_address_id: string | null;
          shipping_zone_id: string | null;
          payment_method_id: string | null;
          payment_notes: string | null;
          source: Json;
          idempotency_key: string;
          whatsapp_number_used: string | null;
          whatsapp_message_sent: string | null;
          whatsapp_opened_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & {
          customer_id: string;
          subtotal_usd: number;
          total_usd: number;
          delivery_method: string;
          idempotency_key: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          variant_id: string | null;
          product_name: string;
          sku: string;
          variant_label: string;
          unit_price_usd: number;
          discount_usd: number;
          quantity: number;
          subtotal_usd: number;
          image_url_snapshot: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["order_items"]["Row"]> & {
          order_id: string;
          product_name: string;
          sku: string;
          variant_label: string;
          unit_price_usd: number;
          quantity: number;
          subtotal_usd: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
        Relationships: [];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          from_status: string | null;
          to_status: string;
          changed_by: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["order_status_history"]["Row"]> & {
          order_id: string;
          to_status: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_status_history"]["Row"]>;
        Relationships: [];
      };
      order_notes: {
        Row: {
          id: string;
          order_id: string;
          user_id: string | null;
          note: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["order_notes"]["Row"]> & {
          order_id: string;
          note: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_notes"]["Row"]>;
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          client_event_id: string;
          event_type: string;
          session_id: string;
          customer_id: string | null;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
          referrer: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["analytics_events"]["Row"]> & {
          client_event_id: string;
          event_type: string;
          session_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["analytics_events"]["Row"]>;
        Relationships: [];
      };
      search_logs: {
        Row: {
          id: string;
          query: string;
          results_count: number;
          session_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["search_logs"]["Row"]> & {
          query: string;
        };
        Update: Partial<Database["public"]["Tables"]["search_logs"]["Row"]>;
        Relationships: [];
      };
      company: {
        Row: {
          id: string;
          legal_name: string;
          trade_name: string;
          rif: string | null;
          description: string | null;
          email: string | null;
          phone: string | null;
          whatsapp_main: string | null;
          instagram: string | null;
          facebook: string | null;
          tiktok: string | null;
          website: string | null;
          address: string | null;
          google_maps_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["company"]["Row"]> & {
          legal_name: string;
          trade_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["company"]["Row"]>;
        Relationships: [];
      };
      redirects: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          old_slug: string;
          new_slug: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["redirects"]["Row"]> & {
          entity_type: string;
          entity_id: string;
          old_slug: string;
          new_slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["redirects"]["Row"]>;
        Relationships: [];
      };
      exchange_rate_fetch_logs: {
        Row: {
          id: string;
          provider: string;
          success: boolean;
          http_status: number | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["exchange_rate_fetch_logs"]["Row"]
        > & {
          provider: string;
          success: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["exchange_rate_fetch_logs"]["Row"]>;
        Relationships: [];
      };
      cron_job_runs: {
        Row: {
          id: string;
          job_name: string;
          success: boolean;
          detail: Json | null;
          started_at: string;
          finished_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["cron_job_runs"]["Row"]> & {
          job_name: string;
          success: boolean;
          started_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["cron_job_runs"]["Row"]>;
        Relationships: [];
      };
      error_reports: {
        Row: {
          id: string;
          scope: "public" | "admin" | "server";
          message: string;
          digest: string | null;
          stack: string | null;
          context: Json | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["error_reports"]["Row"]> & {
          scope: "public" | "admin" | "server";
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["error_reports"]["Row"]>;
        Relationships: [];
      };
      shipping_methods: {
        Row: { id: string; name: string; active: boolean };
        Insert: Partial<Database["public"]["Tables"]["shipping_methods"]["Row"]> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipping_methods"]["Row"]>;
        Relationships: [];
      };
      shipping_carriers: {
        Row: { id: string; name: string; active: boolean; notes: string | null };
        Insert: Partial<Database["public"]["Tables"]["shipping_carriers"]["Row"]> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipping_carriers"]["Row"]>;
        Relationships: [];
      };
      store_hours: {
        Row: {
          id: string;
          store_id: string;
          day_of_week: number;
          opens_at: string | null;
          closes_at: string | null;
          closed: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["store_hours"]["Row"]> & {
          store_id: string;
          day_of_week: number;
        };
        Update: Partial<Database["public"]["Tables"]["store_hours"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "store_hours_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      collections: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          type: "manual" | "rule_based";
          rule: Json | null;
          seo_title: string | null;
          seo_description: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["collections"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["collections"]["Row"]>;
        Relationships: [];
      };
      collection_products: {
        Row: { collection_id: string; product_id: string; order: number };
        Insert: Partial<Database["public"]["Tables"]["collection_products"]["Row"]> & {
          collection_id: string;
          product_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["collection_products"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collection_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      banners: {
        Row: {
          id: string;
          name: string;
          image_desktop_url: string | null;
          image_mobile_url: string | null;
          headline: string | null;
          copy: string | null;
          cta_label: string | null;
          cta_url: string | null;
          position: string;
          starts_at: string | null;
          ends_at: string | null;
          priority: number;
          active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["banners"]["Row"]> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["banners"]["Row"]>;
        Relationships: [];
      };
      home_sections: {
        Row: {
          id: string;
          type:
            | "hero"
            | "banner"
            | "categories"
            | "product_slider"
            | "collection"
            | "image_text"
            | "cta"
            | "brands"
            | "features"
            | "testimonials"
            | "instagram"
            | "stores";
          title: string | null;
          subtitle: string | null;
          config: Json;
          order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["home_sections"]["Row"]> & {
          type: string;
        };
        Update: Partial<Database["public"]["Tables"]["home_sections"]["Row"]>;
        Relationships: [];
      };
      integrations: {
        Row: {
          id: string;
          provider:
            | "ga4"
            | "gtm"
            | "meta_pixel"
            | "meta_capi"
            | "tiktok"
            | "google_ads"
            | "bcv_rate_provider";
          public_config: Json;
          secret_ref: string | null;
          active: boolean;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["integrations"]["Row"]> & {
          provider: string;
        };
        Update: Partial<Database["public"]["Tables"]["integrations"]["Row"]>;
        Relationships: [];
      };
      size_charts: {
        Row: {
          id: string;
          name: string;
          category_id: string | null;
          brand_id: string | null;
          gender: string | null;
          rows: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["size_charts"]["Row"]> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["size_charts"]["Row"]>;
        Relationships: [];
      };
      customer_tags: {
        Row: {
          id: string;
          name: string;
          color: string;
          description: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["customer_tags"]["Row"]> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["customer_tags"]["Row"]>;
        Relationships: [];
      };
      customer_tag_assignments: {
        Row: {
          customer_id: string;
          tag_id: string;
          assigned_at: string;
          assigned_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["customer_tag_assignments"]["Row"]> & {
          customer_id: string;
          tag_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["customer_tag_assignments"]["Row"]>;
        Relationships: [];
      };
      customer_notes: {
        Row: {
          id: string;
          customer_id: string;
          user_id: string | null;
          note: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["customer_notes"]["Row"]> & {
          customer_id: string;
          note: string;
        };
        Update: Partial<Database["public"]["Tables"]["customer_notes"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      variant_availability: {
        Row: { variant_id: string; store_id: string; available: number };
        Relationships: [];
      };
    };
    Functions: {
      auth_has_role: { Args: { role_names: string[] }; Returns: boolean };
      next_order_number: { Args: Record<string, never>; Returns: string };
      reserve_inventory_for_order: {
        Args: { p_order_id: string; p_items: Json; p_ttl_minutes?: number };
        Returns: void;
      };
      release_expired_reservations: { Args: Record<string, never>; Returns: number };
      confirm_order_inventory: {
        Args: { p_order_id: string; p_user_id: string | null };
        Returns: void;
      };
      release_order_reservations: { Args: { p_order_id: string }; Returns: void };
      // Función atómica de creación de pedido (ver 0014_create_order_function.sql):
      // recibe el pedido y sus líneas como JSON, reserva inventario y devuelve
      // una tabla (por eso Returns es un arreglo) — `is_replay` distingue una
      // creación nueva de un reintento idempotente que devolvió el pedido ya
      // existente.
      create_order: {
        Args: { p_order: Json; p_items: Json; p_reservation_ttl_minutes?: number };
        Returns: {
          id: string;
          order_number: string;
          public_access_token: string;
          is_replay: boolean;
        }[];
      };
      search_products: {
        Args: { p_query: string; p_limit?: number };
        Returns: { product_id: string; rank: number }[];
      };
      suggest_products: {
        Args: { p_query: string; p_limit?: number };
        Returns: { product_id: string; rank: number }[];
      };
    };
  };
}
