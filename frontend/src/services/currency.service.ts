import { http } from './http';

export interface CurrencyRateDto {
  id: string;
  currency_code: string;
  currency_symbol?: string | null;
  rate_to_cfa: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCurrencyRatePayload {
  currency_code: string;
  currency_symbol?: string;
  rate_to_cfa: number;
  is_active?: boolean;
}

export interface UpdateCurrencyRatePayload {
  currency_code?: string;
  currency_symbol?: string;
  rate_to_cfa?: number;
  is_active?: boolean;
}

export async function getActiveCurrencies(): Promise<CurrencyRateDto[]> {
  const { data } = await http.get<CurrencyRateDto[]>('/currencies/active');
  return data;
}

export async function getAllCurrencies(): Promise<CurrencyRateDto[]> {
  const { data } = await http.get<CurrencyRateDto[]>('/currencies');
  return data;
}

export async function createCurrency(payload: CreateCurrencyRatePayload): Promise<CurrencyRateDto> {
  const { data } = await http.post<CurrencyRateDto>('/currencies', payload);
  return data;
}

export async function updateCurrency(id: string, payload: UpdateCurrencyRatePayload): Promise<CurrencyRateDto> {
  const { data } = await http.put<CurrencyRateDto>(`/currencies/${id}`, payload);
  return data;
}

export async function deleteCurrency(id: string): Promise<void> {
  await http.delete(`/currencies/${id}`);
}
