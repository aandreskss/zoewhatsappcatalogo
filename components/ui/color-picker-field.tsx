"use client";

import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";

interface Props {
  name: string;
  label: string;
  defaultValue: string;
  disabled?: boolean;
}

function isValidHex(v: string) {
  return /^#[0-9a-fA-F]{6}$/.test(v);
}

export function ColorPickerField({ name, label, defaultValue, disabled }: Props) {
  const [color, setColor] = useState(
    isValidHex(defaultValue) ? defaultValue : "#000000",
  );
  const [text, setText] = useState(color);
  const nativeRef = useRef<HTMLInputElement>(null);

  function handleNativeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setColor(val);
    setText(val);
  }

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setText(raw);
    const normalized = raw.startsWith("#") ? raw : `#${raw}`;
    if (isValidHex(normalized)) {
      setColor(normalized);
    }
  }

  function handleTextBlur() {
    const normalized = text.startsWith("#") ? text : `#${text}`;
    if (isValidHex(normalized)) {
      setColor(normalized);
      setText(normalized);
    } else {
      // revertir al color válido actual
      setText(color);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`text-${name}`}>{label}</Label>

      <div className="flex items-center gap-3">
        {/* Swatch — abre el color picker nativo */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => nativeRef.current?.click()}
          className="relative h-11 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-[var(--color-border)] shadow-sm transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: color }}
          title="Abrir selector de color"
        >
          <input
            ref={nativeRef}
            type="color"
            name={name}
            value={color}
            onChange={handleNativeChange}
            disabled={disabled}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            tabIndex={-1}
          />
        </button>

        {/* Hex input */}
        <div className="flex flex-1 items-center overflow-hidden rounded-xl border border-[var(--color-border)] bg-white focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:ring-offset-1">
          <span className="select-none pl-3 text-sm font-mono text-[var(--color-muted-foreground)]">
            #
          </span>
          <input
            id={`text-${name}`}
            type="text"
            value={text.replace(/^#/, "")}
            onChange={(e) =>
              handleTextChange({
                ...e,
                target: { ...e.target, value: e.target.value },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            onBlur={handleTextBlur}
            disabled={disabled}
            maxLength={6}
            placeholder="C9748A"
            className="w-full bg-transparent py-2.5 pr-3 font-mono text-sm outline-none disabled:opacity-50"
          />
          {/* Preview mini */}
          <div
            className="mr-2 h-5 w-5 shrink-0 rounded-md border border-[var(--color-border)]"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>

      {/* Paleta de colores rápidos */}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {QUICK_COLORS.map((qc) => (
          <button
            key={qc.value}
            type="button"
            disabled={disabled}
            title={qc.label}
            onClick={() => { setColor(qc.value); setText(qc.value); if (nativeRef.current) nativeRef.current.value = qc.value; }}
            className={`h-6 w-6 rounded-md border-2 transition-transform hover:scale-110 ${color === qc.value ? "border-[var(--color-foreground)]" : "border-transparent"}`}
            style={{ backgroundColor: qc.value }}
          />
        ))}
      </div>
    </div>
  );
}

const QUICK_COLORS = [
  { value: "#C9748A", label: "Rosa Zoe" },
  { value: "#29252A", label: "Tinta" },
  { value: "#FFFDFC", label: "Crema" },
  { value: "#EEE8F8", label: "Lavanda" },
  { value: "#F4D6DD", label: "Rosa claro" },
  { value: "#DDE8DF", label: "Sage" },
  { value: "#EFE5DC", label: "Beige" },
  { value: "#5A9E6F", label: "Verde" },
  { value: "#777078", label: "Gris" },
  { value: "#000000", label: "Negro" },
  { value: "#ffffff", label: "Blanco" },
];
