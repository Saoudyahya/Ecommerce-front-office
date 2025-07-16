// ~/ui/primitives/alert-dialog.tsx

"use client";

import type { VariantProps } from "class-variance-authority";
import type * as React from "react";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { cva } from "class-variance-authority";

import { cn } from "~/lib/cn";

const alertDialogOverlayVariants = cva(
  `
    fixed inset-0 z-50 bg-black/80
    data-[state=open]:animate-in data-[state=closed]:animate-out
    data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
  `,
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "bg-black/80",
      },
    },
  },
);

const alertDialogContentVariants = cva(
  `
    fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%]
    translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200
    data-[state=open]:animate-in data-[state=closed]:animate-out
    data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
    data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
    data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]
    data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]
    rounded-lg
  `,
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        sm: "max-w-sm",
        default: "max-w-lg",
        lg: "max-w-xl",
        xl: "max-w-2xl",
      },
    },
  },
);

const alertDialogActionVariants = cva(
  `
    inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm
    font-medium ring-offset-background transition-colors
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
    focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
    h-10 px-4 py-2
  `,
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
  },
);

const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

function AlertDialogOverlay({
  className,
  variant,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay> & 
  VariantProps<typeof alertDialogOverlayVariants>) {
  return (
    <AlertDialogPrimitive.Overlay
      className={cn(alertDialogOverlayVariants({ variant }), className)}
      data-slot="alert-dialog-overlay"
      {...props}
    />
  );
}

function AlertDialogContent({
  className,
  size,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> & 
  VariantProps<typeof alertDialogContentVariants>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        className={cn(alertDialogContentVariants({ size }), className)}
        data-slot="alert-dialog-content"
        {...props}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className,
      )}
      data-slot="alert-dialog-header"
      {...props}
    />
  );
}

function AlertDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className,
      )}
      data-slot="alert-dialog-footer"
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      className={cn("text-lg font-semibold", className)}
      data-slot="alert-dialog-title"
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      data-slot="alert-dialog-description"
      {...props}
    />
  );
}

function AlertDialogAction({
  className,
  variant,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> & 
  VariantProps<typeof alertDialogActionVariants>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(alertDialogActionVariants({ variant }), className)}
      data-slot="alert-dialog-action"
      {...props}
    />
  );
}

function AlertDialogCancel({
  className,
  variant = "outline",
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel> & 
  VariantProps<typeof alertDialogActionVariants>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(
        alertDialogActionVariants({ variant }),
        "mt-2 sm:mt-0",
        className,
      )}
      data-slot="alert-dialog-cancel"
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};