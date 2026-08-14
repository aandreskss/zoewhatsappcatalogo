import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Defaults {
  name?: string;
  code?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  google_maps_url?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export function StoreFields({
  defaults = {},
  disabled,
}: {
  defaults?: Defaults;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Identidad */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <Label htmlFor="sf-name">Nombre *</Label>
          <Input
            id="sf-name"
            name="name"
            defaultValue={defaults.name}
            required
            disabled={disabled}
            placeholder="Sucursal Las Mercedes"
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="sf-code">Código *</Label>
          <Input
            id="sf-code"
            name="code"
            defaultValue={defaults.code}
            required
            disabled={disabled}
            placeholder="LME"
            maxLength={10}
            className="uppercase"
          />
          <p className="text-[10px] text-[var(--color-muted-foreground)]">
            Siglas cortas (ej: LME, AV5, CCT)
          </p>
        </div>
      </div>

      {/* Ubicación */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Ubicación
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <Label htmlFor="sf-address">Dirección</Label>
            <Input
              id="sf-address"
              name="address"
              defaultValue={defaults.address ?? ""}
              disabled={disabled}
              placeholder="Av. Principal, C.C. Las Mercedes, Local 12"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="sf-city">Ciudad</Label>
            <Input
              id="sf-city"
              name="city"
              defaultValue={defaults.city ?? ""}
              disabled={disabled}
              placeholder="Caracas"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="sf-state">Estado</Label>
            <Input
              id="sf-state"
              name="state"
              defaultValue={defaults.state ?? ""}
              disabled={disabled}
              placeholder="Miranda"
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <Label htmlFor="sf-maps">URL de Google Maps</Label>
            <Input
              id="sf-maps"
              name="google_maps_url"
              type="url"
              defaultValue={defaults.google_maps_url ?? ""}
              disabled={disabled}
              placeholder="https://maps.google.com/…"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="sf-lat">Latitud (opcional)</Label>
            <Input
              id="sf-lat"
              name="lat"
              type="number"
              step="any"
              defaultValue={defaults.lat ?? ""}
              disabled={disabled}
              placeholder="10.4806"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="sf-lng">Longitud (opcional)</Label>
            <Input
              id="sf-lng"
              name="lng"
              type="number"
              step="any"
              defaultValue={defaults.lng ?? ""}
              disabled={disabled}
              placeholder="-66.9036"
            />
          </div>
        </div>
      </div>

      {/* Contacto */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Contacto
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="sf-phone">Teléfono</Label>
            <Input
              id="sf-phone"
              name="phone"
              defaultValue={defaults.phone ?? ""}
              disabled={disabled}
              placeholder="+58 212 123 4567"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="sf-whatsapp">WhatsApp (para pedidos)</Label>
            <Input
              id="sf-whatsapp"
              name="whatsapp"
              defaultValue={defaults.whatsapp ?? ""}
              disabled={disabled}
              placeholder="+58 412 123 4567"
            />
            <p className="text-[10px] text-[var(--color-muted-foreground)]">
              A este número se envía el mensaje del pedido
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
