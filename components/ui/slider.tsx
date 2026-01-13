import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: number[];
    onValueChange: (value: number[]) => void;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, value, onValueChange, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            onValueChange([parseFloat(e.target.value)]);
        };

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
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(value[0] / (props.max || 100)) * 100}%, #374151 ${(value[0] / (props.max || 100)) * 100}%, #374151 100%)`
                }}
                {...props}
            />
        );
    }
);
Slider.displayName = "Slider";

export { Slider };
