'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpenIcon,
  Building2Icon,
  FilesIcon,
  FileStackIcon,
  InboxIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  LogOutIcon,
  ScrollTextIcon,
  SearchIcon,
  Settings2Icon,
  ShieldIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';
import {
  Permission,
  SubscriptionBanner,
  hasPermission,
  useAuthStore,
} from '@/modules/auth';
import { AppHeader } from '@/components/layout/app-header';
import { PageHeader } from '@/components/layout/page-header';
import { BrandLogo } from '@/components/brand';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { cn } from '@/lib/utils';

type AppShellProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  basePath: '/portal' | '/dashboard';
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
};

function initials(name?: string, email?: string): string {
  const source = (name || email || 'U').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function isActive(pathname: string, href: string, match?: NavItem['match']): boolean {
  if (match) return match(pathname);
  if (href === '/dashboard' || href === '/portal') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  title,
  description,
  actions,
  basePath,
  children,
}: AppShellProps) {
  useDocumentTitle(title);
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const canManageUsers = hasPermission(user, Permission.UsersManage);
  const canManageTenants = hasPermission(user, Permission.TenantsManage);
  const canViewAudit = hasPermission(user, Permission.AuditView);
  const canViewInquiries = hasPermission(user, Permission.InquiriesView);
  const isSuperAdmin = user?.role === 'super_admin';

  const workspaceItems: NavItem[] =
    basePath === '/dashboard'
      ? [
          {
            href: '/dashboard',
            label: 'Dashboard',
            icon: LayoutDashboardIcon,
            match: (p) => p === '/dashboard',
          },
          {
            href: '/dashboard/batches',
            label: 'Batches',
            icon: FilesIcon,
            match: (p) =>
              p === '/dashboard/batches' ||
              p.startsWith('/dashboard/batches/') ||
              p.startsWith('/dashboard/claims'),
          },
          {
            href: '/dashboard/upload-logs',
            label: 'Upload logs',
            icon: ScrollTextIcon,
          },
          ...(canViewAudit
            ? [
                {
                  href: '/dashboard/audit-logs',
                  label: 'Audit logs',
                  icon: ScrollTextIcon,
                } satisfies NavItem,
              ]
            : []),
        ]
      : [
          {
            href: '/portal',
            label: 'Dashboard',
            icon: LayoutDashboardIcon,
            match: (p) => p === '/portal',
          },
          {
            href: '/portal/batches',
            label: 'Batches',
            icon: FilesIcon,
            match: (p) =>
              p === '/portal/batches' ||
              p.startsWith('/portal/batches/') ||
              p.startsWith('/portal/claims'),
          },
          {
            href: '/portal/upload-logs',
            label: 'Upload logs',
            icon: ScrollTextIcon,
          },
          {
            href: '/portal/audit-logs',
            label: 'Audit logs',
            icon: ScrollTextIcon,
          },
          ...(user?.role === 'tenant_admin'
            ? [
                {
                  href: '/portal/members',
                  label: 'Team',
                  icon: UsersIcon,
                } satisfies NavItem,
              ]
            : []),
          {
            href: '/portal/integrations',
            label: 'Integrations',
            icon: Settings2Icon,
          },
          {
            href: '/portal/support',
            label: 'Support',
            icon: LifeBuoyIcon,
          },
        ];

  const referenceItems: NavItem[] =
    basePath === '/dashboard'
      ? [
          {
            href: '/search',
            label: 'Coding search',
            icon: SearchIcon,
          },
          {
            href: '/icd10-cm',
            label: 'ICD-10-CM',
            icon: BookOpenIcon,
          },
          {
            href: '/dashboard/references',
            label: 'References',
            icon: FileStackIcon,
          },
        ]
      : [];

  const adminItems: NavItem[] = [];
  if (basePath === '/dashboard') {
    if (canViewInquiries) {
      adminItems.push({
        href: '/dashboard/inquiries',
        label: 'Inquiries',
        icon: InboxIcon,
        match: (p) =>
          p === '/dashboard/inquiries' || p.startsWith('/dashboard/inquiries/'),
      });
    }
    if (canManageTenants) {
      adminItems.push({
        href: '/dashboard/tenants',
        label: 'Tenants',
        icon: Building2Icon,
      });
    }
    if (canManageUsers) {
      adminItems.push(
        {
          href: '/dashboard/users',
          label: 'Users',
          icon: UsersIcon,
        },
        {
          href: '/dashboard/service-clients',
          label: 'Service clients',
          icon: KeyRoundIcon,
        },
      );
    }
    if (isSuperAdmin) {
      adminItems.push(
        {
          href: '/dashboard/permissions',
          label: 'Permissions',
          icon: ShieldIcon,
        },
        {
          href: '/dashboard/audit-settings',
          label: 'Audit settings',
          icon: Settings2Icon,
        },
      );
    }
  }

  async function onLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild tooltip="Neo Scrubber">
                <Link href={basePath} className="!h-auto py-1.5">
                  <BrandLogo
                    variant="logo"
                    className="h-8 w-auto max-w-[10rem] group-data-[collapsible=icon]:hidden"
                  />
                  <BrandLogo
                    variant="mark"
                    className="hidden size-8 group-data-[collapsible=icon]:block"
                  />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <NavGroup label="Workspace" items={workspaceItems} pathname={pathname} />
          {referenceItems.length > 0 ? (
            <NavGroup
              label="Code reference"
              items={referenceItems}
              pathname={pathname}
            />
          ) : null}
          {adminItems.length > 0 ? (
            <NavGroup label="Administration" items={adminItems} pathname={pathname} />
          ) : null}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent"
                  >
                    <Avatar className="size-7 rounded-md">
                      <AvatarFallback className="rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
                        {initials(user?.name, user?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {user?.name || 'Account'}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  side="top"
                  align="start"
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{user?.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {user?.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => void onLogout()}
                  >
                    <LogOutIcon />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <AppHeader title={title} basePath={basePath} />

        <div className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-5 md:gap-5 md:px-6 md:pt-5 md:pb-6">
          <PageHeader title={title} description={description} actions={actions} />
          <SubscriptionBanner />
          <div
            className={cn(
              'mx-auto w-full max-w-[1400px] flex-1 animate-in fade-in-0 duration-200',
            )}
          >
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(pathname, item.href, item.match);
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                  <Link href={item.href}>
                    <Icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
