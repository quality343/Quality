import type { ComponentProps } from "react";

export function Container({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className ?? ""}`}
      {...rest}
    />
  );
}
