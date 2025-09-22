import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600 hover:shadow-brand-600/30 active:bg-brand-700 active:scale-95",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-line-200 bg-surface text-ink-700 shadow-sm hover:bg-pastel-grey-50 hover:border-brand-500",
        secondary: "bg-pastel-blue-50 text-ink-700 shadow-sm hover:bg-pastel-blue-100",
        ghost: "text-ink-700 hover:bg-pastel-grey-50 hover:text-ink-900",
        link: "text-brand-600 underline-offset-4 hover:underline hover:text-brand-700",
        hero: "bg-brand-500 text-white shadow-xl shadow-brand-500/30 hover:bg-brand-600 hover:shadow-brand-600/40 active:bg-brand-700 active:scale-95 text-base font-semibold px-8 py-4",
        premium: "bg-gradient-to-r from-brand-500 to-brand-400 text-white shadow-xl shadow-brand-500/30 hover:from-brand-600 hover:to-brand-500 active:scale-95"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-xl px-3 text-xs",
        lg: "h-10 rounded-2xl px-8",
        xl: "h-12 rounded-2xl px-12 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
