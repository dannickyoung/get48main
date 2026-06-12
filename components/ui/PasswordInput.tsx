"use client";

import { useState } from "react";
import { Eye, EyeClosed } from "iconoir-react";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function PasswordInput({ className = "", ...props }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className={`${className} pr-11`} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-faint transition hover:text-foreground"
        tabIndex={-1}
      >
        {show ? <EyeClosed width={18} height={18} /> : <Eye width={18} height={18} />}
      </button>
    </div>
  );
}
