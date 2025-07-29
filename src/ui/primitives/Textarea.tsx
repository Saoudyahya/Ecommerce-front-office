import * as React from "react";
import { cn } from "~/lib/cn";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * The visual variant of the textarea
   */
  variant?: "default" | "destructive";
  /**
   * The size of the textarea
   */
  size?: "default" | "sm" | "lg";
  /**
   * Whether the textarea has an error state
   */
  error?: boolean;
  /**
   * Helper text to display below the textarea
   */
  helperText?: string;
  /**
   * Error message to display below the textarea
   */
  errorMessage?: string;
  /**
   * Whether to show character count
   */
  showCount?: boolean;
  /**
   * Whether the textarea can be resized
   */
  resize?: "none" | "vertical" | "horizontal" | "both";
}

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      error = false,
      helperText,
      errorMessage,
      showCount = false,
      resize = "vertical",
      maxLength,
      value,
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(value || "");
    const [isFocused, setIsFocused] = React.useState(false);

    // Handle controlled/uncontrolled state
    const currentValue = value !== undefined ? value : internalValue;
    const characterCount = typeof currentValue === "string" ? currentValue.length : 0;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value);
      }
      onChange?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={cn(
            // Base styles
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-200",
            
            // Resize options
            {
              "resize-none": resize === "none",
              "resize-y": resize === "vertical",
              "resize-x": resize === "horizontal",
              "resize": resize === "both",
            },
            
            // Size variants
            {
              "min-h-[80px] text-sm": size === "default",
              "min-h-[60px] px-2 py-1 text-xs": size === "sm",
              "min-h-[100px] px-4 py-3 text-base": size === "lg",
            },
            
            // State variants
            {
              "border-input": variant === "default" && !error && !isFocused,
              "border-ring": variant === "default" && !error && isFocused,
              "border-destructive": error || variant === "destructive",
              "focus-visible:ring-destructive": error || variant === "destructive",
            },
            
            className
          )}
          value={currentValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          maxLength={maxLength}
          {...props}
        />
        
        {/* Footer with helper text, error message, and character count */}
        {(helperText || errorMessage || showCount) && (
          <div className="mt-2 flex items-center justify-between">
            <div className="flex-1">
              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}
              {!errorMessage && helperText && (
                <p className="text-sm text-muted-foreground">{helperText}</p>
              )}
            </div>
            
            {showCount && (
              <div className="text-sm text-muted-foreground">
                {characterCount}
                {maxLength && `/${maxLength}`}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };