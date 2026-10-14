'use client';

import { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/modules/batches';
import { ArticleShowPage } from '@/modules/articles/components/article-show-page';

function ArticleShowInner({ articleId }: { articleId: number }) {
  const searchParams = useSearchParams();
  const verRaw = searchParams.get('ver');
  const ver = verRaw != null && verRaw !== '' ? Number(verRaw) : null;

  return (
    <ArticleShowPage
      articleId={articleId}
      ver={Number.isFinite(ver) && ver != null && ver > 0 ? ver : null}
    />
  );
}

export default function DashboardArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId: raw } = use(params);
  const articleId = Number(raw);

  return (
    <AppShell title="Article" basePath="/dashboard">
      {!Number.isInteger(articleId) || articleId <= 0 ? (
        <p className="text-sm text-rose-700">Invalid article number.</p>
      ) : (
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <ArticleShowInner articleId={articleId} />
        </Suspense>
      )}
    </AppShell>
  );
}
