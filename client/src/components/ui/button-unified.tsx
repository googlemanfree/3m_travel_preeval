/**
 * Button Unifié - Utilise le Design System
 * Assure la cohérence visuelle sur tous les boutons du site
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { designSystem } from "../../../../shared/design-system"

const buttonVariants = cva(
  cn(
    // Base styles
    "inline-flex items-center justify-center whitespace-nowrap rounded-md font-semibold",
    // Transition
    `transition-all ${designSystem.animations.durations.normal} ${designSystem.animations.easings.easeOut}`,
    // Focus ring
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "focus-visible:ring-[#3B82F6]",
    // Disabled state
    "disabled:opacity-50 disabled:cursor-not-allowed",
    // Minimum touch target
    "min-h-[44px] min-w-[44px]",
    // Active state
    "active:scale-95",
  ),
  {
    variants: {
      variant: {
        primary: cn(
          "bg-[#1E3A8A] text-white",
          "hover:bg-[#152E5F] hover:shadow-md",
          "active:bg-[#0F2460]",
          "dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8]"
        ),
        secondary: cn(
          "bg-[#2563EB] text-white",
          "hover:bg-[#1D4ED8] hover:shadow-md",
          "active:bg-[#1E40AF]",
          "dark:bg-[#3B82F6] dark:hover:bg-[#2563EB]"
        ),
        outline: cn(
          "border-2 border-[#1E3A8A] text-[#1E3A8A]",
          "hover:bg-[#DBEAFE] hover:shadow-md",
          "active:bg-[#BFDBFE]",
          "dark:border-[#7CB9E8] dark:text-[#7CB9E8]",
          "dark:hover:bg-[#1E3A8A]/20"
        ),
        ghost: cn(
          "text-[#1E3A8A]",
          "hover:bg-[#F3F4F6] hover:shadow-sm",
          "active:bg-[#E5E7EB]",
          "dark:text-[#7CB9E8]",
          "dark:hover:bg-[#1E3A8A]/20"
        ),
        destructive: cn(
          "bg-[#EF4444] text-white",
          "hover:bg-[#DC2626] hover:shadow-md",
          "active:bg-[#B91C1C]"
        ),
        success: cn(
          "bg-[#10B981] text-white",
          "hover:bg-[#059669] hover:shadow-md",
          "active:bg-[#047857]"
        ),
        warning: cn(
          "bg-[#F59E0B] text-white",
          "hover:bg-[#D97706] hover:shadow-md",
          "active:bg-[#B45309]"
        ),
      },
      size: {
        xs: cn(
          "h-8 px-2 text-xs",
          `gap-${designSystem.spacing.xs}`
        ),
        sm: cn(
          "h-9 px-3 text-sm",
          `gap-${designSystem.spacing.sm}`
        ),
        md: cn(
          "h-10 px-4 text-base",
          `gap-${designSystem.spacing.md}`
        ),
        lg: cn(
          "h-11 px-6 text-base",
          `gap-${designSystem.spacing.lg}`
        ),
        xl: cn(
          "h-12 px-8 text-lg",
          `gap-${designSystem.spacing.lg}`
        ),
        icon: "h-10 w-10",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      isLoading = false,
      icon,
      iconPosition = "left",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, fullWidth }),
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {children}
          </>
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className={`flex items-center ${children ? "mr-2" : ""}`}>
                {icon}
              </span>
            )}
            {children}
            {icon && iconPosition === "right" && (
              <span className={`flex items-center ${children ? "ml-2" : ""}`}>
                {icon}
              </span>
            )}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
