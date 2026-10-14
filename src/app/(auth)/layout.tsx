import { AuthSplitShell } from '@/modules/auth/components/auth-split-shell';

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AuthSplitShell>{children}</AuthSplitShell>;
}
