/**
 * Frontend Payment Service — Communication avec le module Payment backend.
 */
import { http } from './http'

export interface PaymentGateway {
  id: string
  name: string
  type: string
  isActive: boolean
  isTestMode: boolean
}

export interface CheckoutPayload {
  gatewayId: string
  amount: number
  description: string
}

export interface CheckoutResponse {
  url: string
}

export async function getGateways(): Promise<PaymentGateway[]> {
  const { data } = await http.get<PaymentGateway[]>('/payment/gateways')
  return data
}

export async function createCheckout(payload: CheckoutPayload): Promise<CheckoutResponse> {
  const { data } = await http.post<CheckoutResponse>('/payment/checkout', payload)
  return data
}
