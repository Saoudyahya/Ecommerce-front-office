"use client";

import * as React from "react";
import { cn } from "~/lib/cn"; // Adjust this import based on your utils location

// Context for managing collapsible state
interface CollapsibleContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

const useCollapsible = () => {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error("Collapsible components must be used within a Collapsible");
  }
  return context;
};

// Main Collapsible component
interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ open = false, onOpenChange, children, className, ...props }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(open);
    
    const isControlled = onOpenChange !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    
    const handleToggle = React.useCallback((newOpen: boolean) => {
      if (isControlled) {
        onOpenChange?.(newOpen);
      } else {
        setInternalOpen(newOpen);
      }
    }, [isControlled, onOpenChange]);

    React.useEffect(() => {
      if (isControlled) {
        setInternalOpen(open);
      }
    }, [open, isControlled]);

    const contextValue = React.useMemo(
      () => ({
        open: isOpen,
        onOpenChange: handleToggle,
      }),
      [isOpen, handleToggle]
    );

    return (
      <CollapsibleContext.Provider value={contextValue}>
        <div ref={ref} className={cn("", className)} {...props}>
          {children}
        </div>
      </CollapsibleContext.Provider>
    );
  }
);

Collapsible.displayName = "Collapsible";

// CollapsibleTrigger component
interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: React.ReactNode;
}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ asChild = false, children, onClick, ...props }, ref) => {
    const { open, onOpenChange } = useCollapsible();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onOpenChange(!open);
      onClick?.(event);
    };

    if (asChild) {
      // When asChild is true, we clone the child element and add our click handler
      return React.cloneElement(children as React.ReactElement, {
        onClick: handleClick,
        "aria-expanded": open,
        "data-state": open ? "open" : "closed",
      });
    }

    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={open}
        data-state={open ? "open" : "closed"}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);

CollapsibleTrigger.displayName = "CollapsibleTrigger";

// CollapsibleContent component
interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ children, className, style, ...props }, ref) => {
    const { open } = useCollapsible();
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [height, setHeight] = React.useState<number | undefined>(open ? undefined : 0);

    React.useEffect(() => {
      const element = contentRef.current;
      if (!element) return;

      if (open) {
        // Opening: measure the content height and animate to it
        const scrollHeight = element.scrollHeight;
        setHeight(scrollHeight);
        
        // After the animation, remove the fixed height to allow natural resizing
        const timer = setTimeout(() => {
          setHeight(undefined);
        }, 300); // Match the transition duration
        
        return () => clearTimeout(timer);
      } else {
        // Closing: first set the height to current height, then animate to 0
        const scrollHeight = element.scrollHeight;
        setHeight(scrollHeight);
        
        // Force a reflow, then set height to 0
        requestAnimationFrame(() => {
          setHeight(0);
        });
      }
    }, [open]);

    return (
      <div
        ref={contentRef}
        data-state={open ? "open" : "closed"}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          className
        )}
        style={{
          height: height,
          ...style,
        }}
        {...props}
      >
        <div ref={ref} className="pb-1">
          {children}
        </div>
      </div>
    );
  }
);

CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };