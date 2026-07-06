import { apiClient } from './client';

export interface InstitutionDto {
  id: string;
  name: string;
  domain: string;
  status: string;
  students?: number;
  staff?: number;
  plan?: string;
  createdAt: string;
}

import type { ApiResponse } from './auth';

export async function getInstitutions(): Promise<ApiResponse<InstitutionDto[]>> {
  const { data } = await apiClient.get<ApiResponse<InstitutionDto[]>>('/institutions');
  return data;
}

export async function getInstitution(id: string): Promise<ApiResponse<InstitutionDto>> {
  const { data } = await apiClient.get<ApiResponse<InstitutionDto>>(`/institutions/${id}`);
  return data;
}