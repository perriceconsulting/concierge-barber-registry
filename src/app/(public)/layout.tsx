'use client';

import { ToastProvider } from '@/components/ui/toast';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ToastProvider>{children}</ToastProvider>;
}
