import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type CommonProps = {
  children?: ReactNode;
  helperText?: string;
  label: string;
};

type FormFieldProps =
  | (CommonProps & InputHTMLAttributes<HTMLInputElement> & { as?: "input" })
  | (CommonProps & SelectHTMLAttributes<HTMLSelectElement> & { as: "select" })
  | (CommonProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { as: "textarea" });

export function FormField({ as = "input", children, helperText, label, ...props }: FormFieldProps) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {as === "select" ? (
        <select {...(props as SelectHTMLAttributes<HTMLSelectElement>)}>{children}</select>
      ) : as === "textarea" ? (
        <textarea {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input {...(props as InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {helperText ? <small>{helperText}</small> : null}
    </label>
  );
}
