import * as React from "react"
import { cn } from "@/lib/cn"
import styles from "./Input.module.css"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, ...props }, ref) => {
        return (
            <div className={styles.inputWrapper}>
                {label && <label className={styles.label}>{label}</label>}
                <input
                    type={type}
                    className={cn(styles.input, className)}
                    ref={ref}
                    {...props}
                />
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
