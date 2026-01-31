"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";
import styles from "./Button.module.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    fullWidth?: boolean;
    asChild?: boolean;
}

// Wrapping motion.button
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", fullWidth, ...props }, ref) => {

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
                className={cn(
                    styles.button,
                    styles[variant],
                    size !== "md" && styles[size],
                    fullWidth && styles.fullWidth,
                    className
                )}
                {...(props as HTMLMotionProps<"button">)}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
