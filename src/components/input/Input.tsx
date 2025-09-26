import { forwardRef, InputHTMLAttributes, useId } from "react";
import styles from "./Input.module.css";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helperText?: string;
  containerClassName?: string;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    helperText,
    containerClassName,
    className,
    type = "text",
    error,
    required = false,
    ...props
  }, ref) => {
    const helperId = useId();
    const helperContent = error ?? helperText;

    return (
      <label className={`${styles.field} ${containerClassName ?? ""}`}>
        <span className={styles.label}>
          {label}
          {required ? (
            <span className={styles.requiredMark} aria-hidden>
              *
            </span>
          ) : null}
        </span>
        <input
          ref={ref}
          type={type}
          className={`${styles.input} ${error ? styles.inputError : ""} ${className ?? ""}`}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={helperContent ? helperId : undefined}
          required={required}
          {...props}
        />
        {helperContent ? (
          <span id={helperId} className={error ? styles.error : styles.helper}>
            {helperContent}
          </span>
        ) : null}
      </label>
    );
  }
);

Input.displayName = "Input";

export default Input;
