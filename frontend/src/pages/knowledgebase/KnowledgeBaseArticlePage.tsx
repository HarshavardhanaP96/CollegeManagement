import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Loading, Breadcrumbs } from '../../components/common';
import { getKbArticle, voteKbArticle } from '../../api/knowledgebase';
import { getErrorMessage } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';

export function KnowledgeBaseArticlePage() {
  const { id: slug = '' } = useParams();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.knowledgebase.article(slug),
    queryFn: () => getKbArticle(slug),
    enabled: !!slug,
  });
  const article = data?.data;

  const vote = useMutation({
    mutationFn: (helpful: boolean) => voteKbArticle(article!.id, helpful),
    onSuccess: (res) => {
      queryClient.setQueryData(queryKeys.knowledgebase.article(slug), {
        ...data!,
        data: { ...article!, ...res.data, body: article!.body },
      });
    },
  });

  if (isLoading) return <Card className="flex items-center justify-center py-16"><Loading size="lg" text="Loading article…" /></Card>;
  if (isError || !article) return <Card><p className="text-center text-slate-500 py-8">This article isn't available.</p></Card>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-3">
        <Breadcrumbs items={[{ label: 'Help', path: '/knowledgebase' }, { label: article.title }]} />
        <h1 className="font-display text-2xl font-semibold text-slate-900">{article.title}</h1>
      </header>

      <Card>
        {/* Plain text / markdown source shown as written; no HTML is rendered. */}
        <div className="whitespace-pre-wrap text-slate-800 leading-relaxed">{article.body}</div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-700">Was this helpful?</span>
          <Button variant={article.myVote === true ? 'primary' : 'outline'} aria-pressed={article.myVote === true}
            disabled={vote.isPending} onClick={() => vote.mutate(true)}>
            Yes ({article.helpfulCount})
          </Button>
          <Button variant={article.myVote === false ? 'primary' : 'outline'} aria-pressed={article.myVote === false}
            disabled={vote.isPending} onClick={() => vote.mutate(false)}>
            No ({article.unhelpfulCount})
          </Button>
          {vote.isError && <span className="text-sm text-red-600">{getErrorMessage(vote.error).message}</span>}
        </div>
      </Card>
    </div>
  );
}
