import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Card, Button, Loading, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/common';
import {
  adminListKbArticles, createKbCategory, deleteKbArticle, deleteKbCategory, getKbCategories, slugify,
  type ArticleStatus,
} from '../../api/knowledgebase';
import { getErrorMessage } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';

const PAGE_SIZE = 20;
const fieldClass = 'h-10 rounded border border-slate-300 bg-white px-3 text-sm text-slate-900';

/** SUPERADMIN: manage help categories and articles (any status). */
export function KnowledgeBaseListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<ArticleStatus | ''>('');
  const [page, setPage] = useState(0);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setQ(search.trim()); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: categoriesRes } = useQuery({ queryKey: queryKeys.knowledgebase.categories, queryFn: getKbCategories });
  const categories = categoriesRes?.data ?? [];

  const filters = { q: q || undefined, status: status || undefined, page, size: PAGE_SIZE };
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.knowledgebase.adminArticles(filters),
    queryFn: () => adminListKbArticles(filters),
    placeholderData: keepPreviousData,
  });
  const articles = data?.data.content ?? [];
  const totalPages = data?.data.totalPages ?? 0;

  const onError = (e: unknown) => setError(getErrorMessage(e).message);
  const refresh = () => {
    setError(null);
    queryClient.invalidateQueries({ queryKey: queryKeys.knowledgebase.all });
  };
  const addCategory = useMutation({
    mutationFn: () => createKbCategory({ name: newCategory.trim(), slug: slugify(newCategory), displayOrder: categories.length }),
    onSuccess: () => { setNewCategory(''); refresh(); },
    onError,
  });
  const removeCategory = useMutation({ mutationFn: deleteKbCategory, onSuccess: refresh, onError });
  const removeArticle = useMutation({ mutationFn: deleteKbArticle, onSuccess: refresh, onError });

  return (
    <div className="flex flex-col h-full space-y-4">
      <header className="px-2 shrink-0 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold text-slate-900">Help articles</h1>
          <p className="text-slate-500 text-sm">Every college sees the same articles. Only published ones reach readers.</p>
        </div>
        <Link to="/kb-admin/new"><Button>New article</Button></Link>
      </header>

      {error && <div className="mx-2 rounded border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600">{error}</div>}

      <Card>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Categories</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.length === 0 && <span className="text-sm text-slate-500">No categories yet. Add one before writing articles.</span>}
          {categories.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1 text-sm">
              {c.name}
              <button type="button" className="text-slate-400 hover:text-red-600" aria-label={`Delete category ${c.name}`}
                disabled={removeCategory.isPending}
                onClick={() => { if (window.confirm(`Delete category "${c.name}"?`)) removeCategory.mutate(c.id); }}>
                ×
              </button>
            </span>
          ))}
        </div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (slugify(newCategory)) addCategory.mutate(); }}>
          <input className={fieldClass} aria-label="New category name" placeholder="e.g. Attendance" maxLength={100}
            value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
          <Button type="submit" variant="outline" isLoading={addCategory.isPending} disabled={!slugify(newCategory)}>Add</Button>
        </form>
      </Card>

      <div className="flex flex-wrap items-end gap-3 px-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Search
          <input type="search" className={fieldClass} value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Status
          <select className={fieldClass} value={status} onChange={(e) => { setStatus(e.target.value as ArticleStatus | ''); setPage(0); }}>
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Card className="h-full flex items-center justify-center"><Loading size="lg" text="Loading articles…" /></Card>
        ) : isError ? (
          <Card><p className="text-center text-red-600 py-8">Could not load articles.</p></Card>
        ) : articles.length === 0 ? (
          <Card><p className="text-center text-slate-500 py-8">No articles.</p></Card>
        ) : (
          <Card noPadding className="border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visible to</TableHead>
                  <TableHead>Helpful</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-semibold text-slate-900">
                      <Link to={`/kb-admin/${a.id}`} className="hover:underline">{a.title}</Link>
                    </TableCell>
                    <TableCell>{categories.find((c) => c.id === a.categoryId)?.name ?? '—'}</TableCell>
                    <TableCell>{a.status}</TableCell>
                    <TableCell>{a.visibleRoles.length ? a.visibleRoles.join(', ') : 'Everyone'}</TableCell>
                    <TableCell>{a.helpfulCount} / {a.helpfulCount + a.unhelpfulCount}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" disabled={removeArticle.isPending}
                        onClick={() => { if (window.confirm(`Delete "${a.title}"?`)) removeArticle.mutate(a.id); }}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
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
