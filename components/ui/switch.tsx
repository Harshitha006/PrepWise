import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
    ({ className, checked, onCheckedChange, type, ...props }, ref) => {
        return (
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onCheckedChange(!checked)}
                className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    checked ? "bg-blue-600" : "bg-zinc-700",
                    className
                )}
                {...props}
            >
                <span
                    className={cn(
                        "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                        checked ? "translate-x-6" : "translate-x-1"
                    )}
                />
            </button>
        );
    }
);
Switch.displayName = "Switch";

export { Switch };
