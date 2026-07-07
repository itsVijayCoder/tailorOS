import type { ReactNode } from "react";

import { Input, type InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthField({
  children,
  errors,
  id,
  inputProps,
  label,
}: {
  children?: ReactNode;
  errors?: string[] | undefined;
  id: string;
  inputProps?: InputProps | undefined;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children ?? (
        <Input
          id={id}
          name={id}
          hasError={Boolean(errors?.length)}
          {...inputProps}
        />
      )}
      {errors?.length ? (
        <p className="text-sm font-semibold text-state-danger">
          {errors.join(" ")}
        </p>
      ) : null}
    </div>
  );
}
