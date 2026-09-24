import { apiClient } from './client';

// Spring Boot Actuator's own response shape (NOT wrapped in the app's ApiResponse envelope —
// this hits /actuator/info directly, not a controller under our own API). `build` is populated
// by the spring-boot-maven-plugin's build-info goal; `apiVersion` is a custom field added by
// ApiVersionInfoContributor. See docs/OBSERVABILITY.md.
export interface AppInfo {
  app?: { name?: string };
  build?: {
    version?: string;
    name?: string;
    time?: string;
  };
  apiVersion?: string;
}

export async function getAppInfo(): Promise<AppInfo> {
  const { data } = await apiClient.get<AppInfo>('/actuator/info');
  return data;
}
