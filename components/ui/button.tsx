import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Primitivo genérico del design system (sección 29 del plan). No debe
 * contener texto, colores ni reglas específicas de Zoe: los tokens vienen
 * de `app/globals.css` / branding en runtime.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90",
        secondary:
          "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:opacity-90",
        outline:
          "border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-muted)]",
        ghost: "bg-transparent hover:bg-[var(--color-muted)]",
        destructive:
          "bg-[var(--color-error)] text-[var(--color-primary-foreground)] hover:opacity-90",
        link: "bg-transparent underline-offset-4 hover:underline text-[var(--color-primary)]",
      },
      size: {
        // Mínimo 44px de alto en `default`/`lg`: botones y controles deben
        // ser fáciles de tocar en mobile (regla permanente del proyecto).
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-[var(--radius-sm)] px-3 text-xs",
        lg: "h-12 rounded-[var(--radius-lg)] px-6",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
