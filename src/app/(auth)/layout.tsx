import { BrandLogo } from '@/components/brand';

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-6">
        <BrandLogo variant="logo" priority className="h-14 w-auto" />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
