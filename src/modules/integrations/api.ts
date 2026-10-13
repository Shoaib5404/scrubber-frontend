import { apiRequest } from '@/lib/api/client';

export type IntegrationApiClient = {
  id: number;
  name: string;
  client_id: string;
  user_id: number | null;
  is_active: boolean;
  scopes: string[] | null;
  last_used_at: string | null;
  created_at: string;
};

export async function getIntegrations(): Promise<{
  api_client: IntegrationApiClient | null;
  can_create?: boolean;
  api_access?: boolean;
}> {
  const res = await apiRequest<{
    success: boolean;
    data: {
      api_client: IntegrationApiClient | null;
      can_create?: boolean;
      api_access?: boolean;
    };
  }>('GET', '/settings/integrations');
  return res.data;
}

export async function createIntegrationCredentials(): Promise<{
  message: string;
  api_client: IntegrationApiClient;
  plain_client_secret: string;
}> {
  const res = await apiRequest<{
    success: boolean;
    message: string;
    data: {
      api_client: IntegrationApiClient;
      plain_client_secret: string;
    };
  }>('POST', '/settings/integrations/create');
  return {
    message: res.message,
    api_client: res.data.api_client,
    plain_client_secret: res.data.plain_client_secret,
  };
}

export async function rotateIntegrationSecret(): Promise<{
  message: string;
  api_client: IntegrationApiClient;
  plain_client_secret: string;
}> {
  const res = await apiRequest<{
    success: boolean;
    message: string;
    data: {
      api_client: IntegrationApiClient;
      plain_client_secret: string;
    };
  }>('POST', '/settings/integrations/rotate-secret');
  return {
    message: res.message,
    api_client: res.data.api_client,
    plain_client_secret: res.data.plain_client_secret,
  };
}
