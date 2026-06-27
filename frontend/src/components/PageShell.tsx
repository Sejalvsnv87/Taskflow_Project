import { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
}

export default function PageShell({ children }: PageShellProps) {
  return (
    <div className="page-shell">
      {/* Light mode decorative shapes — inspired by organic spa layout */}
      <div className="light-deco-blob -left-24 top-32 h-64 w-64 bg-sage-200/50 blur-2xl" />
      <div className="light-deco-blob -right-16 top-10 h-48 w-48 rounded-full bg-honey-200/60 blur-xl" />
      <div className="light-deco-blob bottom-20 left-1/4 h-32 w-32 bg-sand-200/50 blur-xl" />
      <div className="absolute -right-8 top-1/3 hidden h-40 w-20 rounded-t-full rounded-b-full bg-sage-200/40 dark:hidden lg:block" />
      <div className="absolute bottom-32 right-1/4 hidden h-6 w-6 text-honey-300 dark:hidden lg:block">✦</div>
      <div className="absolute right-1/3 top-24 hidden text-lg text-honey-200 dark:hidden lg:block">☀</div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
