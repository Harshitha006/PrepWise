import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'defaultValue'> {
    value: number[];
    onValueChange: (value: number[]) => void;
    defaultValue?: number[];
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, value, onValueChange, defaultValue, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            onValueChange([parseFloat(e.target.value)]);
        };

        const max = (props.max as number) || 100;
        const percentage = (value[0] / max) * 100;

        return (
            <input
                type="range"
                ref={ref}
                value={value[0]}
                onChange={handleChange}
                className={cn(
                    "w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer",
                    className
                )}
                style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #374151 ${percentage}%, #374151 100%)`
                }}
                {...props}
            />
        );
    }
);
Slider.displayName = "Slider";

export { Slider };
