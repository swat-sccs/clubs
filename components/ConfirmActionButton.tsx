"use client";

export default function ConfirmActionButton({
  name,
  value,
  confirmation,
  className,
  children,
}: {
  name: string;
  value: string;
  confirmation: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      name={name}
      value={value}
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmation)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
