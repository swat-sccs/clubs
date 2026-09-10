import { requireAdmin } from "@/lib/authorization";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin("/admin");

  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
}
