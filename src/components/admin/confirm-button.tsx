"use client";

import { Button, type ButtonProps } from "@/components/ui/button";

/** Submit button that asks for confirmation first (used for deletes). */
export function ConfirmButton({ message, ...props }: ButtonProps & { message: string }) {
  return <Button type="submit" {...props} onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }} />;
}
