import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Input, Textarea, Loading, Breadcrumbs } from '../../components/common';
import {
  adminGetKbArticle, createKbArticle, getKbCategories, slugify, updateKbArticle,
  type ArticleStatus, type KbArticleRequest,
} from '../../api/knowledgebase';
import { getErrorMessage } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';

const ROLES = ['COLLEGEADMIN', 'HOD', 'TEACHER', 'STUDENT'];
const EMPTY: KbArticleRequest = { categoryId: 0, title: '', slug: '', body: '', status: 'DRAFT', visibleRoles: [] };

/** SUPERADMIN: create (/kb-admin/new) or edit (/kb-admin/:id) an article. */
export function KnowledgeBaseEditorPage() {
  const { id } = useParams();
  const articleId = id && id !== 'new' ? Number(id) : null;

  const { data: existing, isLoading, isError } = useQuery({
    queryKey: queryKeys.knowledgebase.adminArticle(articleId ?? 0),
    queryFn: () => adminGetKbArticle(articleId!),
    enabled: articleId !== null,
  });

  if (articleId === null) return <ArticleForm articleId={null} initial={EMPTY} />;
  if (isLoading) return <Card className="flex items-center justify-center py-16"><Loading size="lg" text="Loading article…" /></Card>;
  const a = existing?.data;
  if (isError || !a) return <Card><p className="text-center text-red-600 py-8">Could not load this article.</p></Card>;
  return (
    <ArticleForm key={a.id} articleId={a.id}
      initial={{ categoryId: a.categoryId, title: a.title, slug: a.slug, body: a.body ?? '', status: a.status, visibleRoles: a.visibleRoles }} />
  );
}

function ArticleForm({ articleId, initial }: { articleId: number | null; initial: KbArticleRequest }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<KbArticleRequest>(initial);
  const [slugTouched, setSlugTouched] = useState(articleId !== null);
  const [error, setError] = useState<string | null>(null);

  const { data: categoriesRes } = useQuery({ queryKey: queryKeys.knowledgebase.categories, queryFn: getKbCategories });
  const categories = categoriesRes?.data ?? [];

  const save = useMutation({
    mutationFn: (payload: KbArticleRequest) => (articleId ? updateKbArticle(articleId, payload) : createKbArticle(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledgebase.all });
      navigate('/kb-admin');
    },
    onError: (e) => setError(getErrorMessage(e).message),
  });

  const set = <K extends keyof KbArticleRequest>(key: K, value: KbArticleRequest[K]) => setForm((f) => ({ ...f, [key]: value }));
  const toggleRole = (role: string) =>
    set('visibleRoles', form.visibleRoles.includes(role) ? form.visibleRoles.filter((r) => r !== role) : [...form.visibleRoles, role]);

  const categoryId = form.categoryId || categories[0]?.id || 0;
  const valid = categoryId > 0 && form.title.trim() && form.slug && form.body.trim();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-3">
        <Breadcrumbs items={[{ label: 'Help articles', path: '/kb-admin' }, { label: articleId ? 'Edit' : 'New article' }]} />
        <h1 className="font-display text-2xl font-semibold text-slate-900">{articleId ? 'Edit article' : 'New article'}</h1>
      </header>

      <Card>
        {error && <div className="mb-6 rounded border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600">{error}</div>}
        <form className="space-y-5"
          onSubmit={(e) => { e.preventDefault(); setError(null); if (valid) save.mutate({ ...form, categoryId, title: form.title.trim() }); }}>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Category
            <select className="h-10 rounded border border-slate-300 bg-white px-3 text-sm" value={categoryId}
              onChange={(e) => set('categoryId', Number(e.target.value))}>
              {categories.length === 0 && <option value={0}>Add a category first</option>}
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <Input label="Title" maxLength={200} value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) }))} />
          <Input label="URL slug" maxLength={200} value={form.slug}
            onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} />
          <Textarea label="Body (plain text or markdown)" rows={14} maxLength={100000} value={form.body}
            onChange={(e) => set('body', e.target.value)} />

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">Visible to (none ticked = everyone)</legend>
            <div className="flex flex-wrap gap-4">
              {ROLES.map((role) => (
                <label key={role} className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={form.visibleRoles.includes(role)} onChange={() => toggleRole(role)} />
                  {role}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 max-w-xs">
            Status
            <select className="h-10 rounded border border-slate-300 bg-white px-3 text-sm" value={form.status}
              onChange={(e) => set('status', e.target.value as ArticleStatus)}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => navigate('/kb-admin')}>Cancel</Button>
            <Button type="submit" isLoading={save.isPending} disabled={!valid}>Save</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
