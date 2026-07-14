"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export function PasswordField({ id, label, ...props }: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="password-field">
      <label htmlFor={inputId}>{label}</label>
      <input {...props} id={inputId} type={showPassword ? "text" : "password"} />
      <label className="password-toggle">
        <input
          checked={showPassword}
          onChange={(event) => setShowPassword(event.target.checked)}
          type="checkbox"
        />
        Show password
      </label>
    </div>
  );
}
