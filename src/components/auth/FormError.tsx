type FormErrorProps = {
  message?: string;
};

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-accent-200 bg-accent-50 px-3.5 py-2.5 text-sm font-medium text-accent-700"
    >
      {message}
    </div>
  );
}
