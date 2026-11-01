import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Card, Button, Loading } from '../../components/common';
import { getKbCategories, searchKbArticles } from '../../api/knowledgebase';
import { queryKeys } from '../../api/queryKeys';

const PAGE_SIZE = 20;

/** Help articles for every role: category filter, debounced search, list. */
export function KnowledgeBasePage() {
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: categoriesRes } = useQuery({
    queryKey: queryKeys.knowledgebase.categories,
    queryFn: getKbCategories,
    staleTime: 5 * 60 * 1000,
  });
  const categories = categoriesRes?.data ?? [];

  const filters = { category: category || undefined, q: q || undefined, page, size: PAGE_SIZE };
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.knowledgebase.articles(filters),
    queryFn: () => searchKbArticles(filters),
    placeholderData: keepPreviousData,
  });
  const articles = data?.data.content ?? [];
  const totalPages = data?.data.totalPages ?? 0;
  const categoryName = (id: number) => categories.find((c) => c.id === id)?.name;

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm font-medium border ${
      active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'
    }`;

  return (
    <div className="flex flex-col h-full space-y-4">
      <header className="px-2 shrink-0 space-y-1">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Help</h1>
        <p className="text-slate-500 text-sm">How to use the application. Can't find it? Contact support.</p>
      </header>

      <div className="px-2 space-y-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 max-w-md">
          Search
          <input
            type="search"
            className="h-10 rounded border border-slate-300 bg-white px-3 text-sm text-slate-900"
            placeholder="e.g. mark attendance"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            <button type="button" className={chip(category === '')} aria-pressed={category === ''}
              onClick={() => { setCategory(''); setPage(0); }}>
              All
            </button>
            {categories.map((c) => (
              <button key={c.id} type="button" className={chip(category === c.slug)} aria-pressed={category === c.slug}
                onClick={() => { setCategory(c.slug); setPage(0); }}>
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Card className="h-full flex items-center justify-center"><Loading size="lg" text="Loading articles…" /></Card>
        ) : isError ? (
          <Card><p className="text-center text-red-600 py-8">Could not load help articles.</p></Card>
        ) : articles.length === 0 ? (
          <Card><p className="text-center text-slate-500 py-8">{q || category ? 'No matching articles.' : 'No articles yet.'}</p></Card>
        ) : (
          <ul className="space-y-2">
            {articles.map((a) => (
              <li key={a.id}>
                <Link to={`/knowledgebase/${a.slug}`}
                  className="block rounded border border-slate-200 bg-white px-4 py-3 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400">
                  <span className="font-semibold text-slate-900">{a.title}</span>
                  {categoryName(a.categoryId) && <span className="ml-2 text-xs text-slate-500">{categoryName(a.categoryId)}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3 px-2">
          <span className="text-sm text-slate-500">Page {page + 1} of {totalPages}</span>
          <Button onClick={() => setPage((p) => Math.max(p - 1, 0))} disabled={page === 0}>Previous</Button>
          <Button onClick={() => setPage((p) => p + 1)} disabled={page + 1 >= totalPages}>Next</Button>
        </div>
      )}
    </div>
  );
}
