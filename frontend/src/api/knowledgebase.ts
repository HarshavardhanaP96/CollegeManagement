import { apiClient } from './client';
import type { ApiResponse } from './department';

export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface KbCategory {
  id: number;
  name: string;
  slug: string;
  displayOrder: number;
}

export interface KbArticle {
  id: number;
  categoryId: number;
  title: string;
  slug: string;
  /** Only present on detail responses. */
  body?: string;
  status: ArticleStatus;
  visibleRoles: string[];
  publishedAt?: string;
  updatedAt?: string;
  helpfulCount: number;
  unhelpfulCount: number;
  /** The caller's own vote; absent if they haven't voted. */
  myVote?: boolean;
}

export interface KbPage {
  content: KbArticle[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface KbArticleRequest {
  categoryId: number;
  title: string;
  slug: string;
  body: string;
  status: ArticleStatus;
  visibleRoles: string[];
}

export interface KbCategoryRequest {
  name: string;
  slug: string;
  displayOrder?: number;
}

const clean = (params: object) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));

// ---- reader ----

export async function getKbCategories(): Promise<ApiResponse<KbCategory[]>> {
  const { data } = await apiClient.get<ApiResponse<KbCategory[]>>('/knowledgebase/categories');
  return data;
}

export async function searchKbArticles(params: { category?: string; q?: string; page?: number; size?: number }): Promise<ApiResponse<KbPage>> {
  const { data } = await apiClient.get<ApiResponse<KbPage>>('/knowledgebase/articles', { params: clean(params) });
  return data;
}

export async function getKbArticle(slug: string): Promise<ApiResponse<KbArticle>> {
  const { data } = await apiClient.get<ApiResponse<KbArticle>>(`/knowledgebase/articles/${encodeURIComponent(slug)}`);
  return data;
}

export async function voteKbArticle(id: number, helpful: boolean): Promise<ApiResponse<KbArticle>> {
  const { data } = await apiClient.post<ApiResponse<KbArticle>>(`/knowledgebase/articles/${id}/feedback`, { helpful });
  return data;
}

// ---- admin (SUPERADMIN) ----

export async function adminListKbArticles(params: { q?: string; status?: ArticleStatus; page?: number; size?: number }): Promise<ApiResponse<KbPage>> {
  const { data } = await apiClient.get<ApiResponse<KbPage>>('/knowledgebase/admin/articles', { params: clean(params) });
  return data;
}

export async function adminGetKbArticle(id: number): Promise<ApiResponse<KbArticle>> {
  const { data } = await apiClient.get<ApiResponse<KbArticle>>(`/knowledgebase/admin/articles/${id}`);
  return data;
}

export async function createKbArticle(payload: KbArticleRequest): Promise<ApiResponse<KbArticle>> {
  const { data } = await apiClient.post<ApiResponse<KbArticle>>('/knowledgebase/admin/articles', payload);
  return data;
}

export async function updateKbArticle(id: number, payload: KbArticleRequest): Promise<ApiResponse<KbArticle>> {
  const { data } = await apiClient.put<ApiResponse<KbArticle>>(`/knowledgebase/admin/articles/${id}`, payload);
  return data;
}

export async function deleteKbArticle(id: number): Promise<void> {
  await apiClient.delete(`/knowledgebase/admin/articles/${id}`);
}

export async function createKbCategory(payload: KbCategoryRequest): Promise<ApiResponse<KbCategory>> {
  const { data } = await apiClient.post<ApiResponse<KbCategory>>('/knowledgebase/admin/categories', payload);
  return data;
}

export async function deleteKbCategory(id: number): Promise<void> {
  await apiClient.delete(`/knowledgebase/admin/categories/${id}`);
}

/** "How to mark attendance" -> "how-to-mark-attendance" (matches the backend slug rule). */
export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 200);
}
