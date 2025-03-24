import axios, { type AxiosResponse } from "axios"

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL
const getAuthToken = () => sessionStorage.getItem("authToken")

interface BalanceResponse {
  balance: number
}

interface DepositResponse {
  invoiceUrl: string
  orderId: string
}

interface PaymentStatusResponse {
  status: string
}

interface PaymentHistoryItem {
  amount: number
  createdAt: string
  status: string
  type: string
}

interface PaymentHistoryResponse {
  message: string
  history: PaymentHistoryItem[]
}

/**
 * Fetches the user's current balance
 * @returns The user's balance as a number
 */
export const getBalance = async (): Promise<number> => {
  try {
    const url = `${API_URL}/payment/getBalance`
    const token = getAuthToken()

    const result: AxiosResponse<BalanceResponse> = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return result.data.balance
  } catch (error: unknown) {
    console.error("Balance fetch error:", error instanceof Error ? error.message : "Unknown error")
    throw new Error("Failed to fetch balance")
  }
}

/**
 * Creates a new deposit request
 * @param amount - The amount to deposit
 * @returns Object containing invoice URL and order ID
 */
export const createDeposit = async (amount: number): Promise<DepositResponse> => {
  try {
    const url = `${API_URL}/payment/deposit`
    const token = getAuthToken()

    const response: AxiosResponse<DepositResponse> = await axios.post(
      url,
      { amount },
      {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      },
    )
    return response.data
  } catch (error: unknown) {
    console.error("Deposit creation error:", error instanceof Error ? error.message : "Unknown error")
    throw new Error("Failed to create deposit")
  }
}

/**
 * Checks the status of a payment
 * @param orderId - The ID of the order to check
 * @returns The payment status as a string
 */
export const checkPaymentStatus = async (orderId: string): Promise<string> => {
  try {
    const url = `${API_URL}/payment/status/${orderId}`
    const token = getAuthToken()

    const response: AxiosResponse<PaymentStatusResponse> = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return response.data.status
  } catch (error: unknown) {
    console.error("Payment status check error:", error instanceof Error ? error.message : "Unknown error")
    throw new Error("Failed to fetch payment status")
  }
}

/**
 * Fetches the user's payment history
 * @returns Array of payment history items
 */
export const getPaymentHistory = async (): Promise<PaymentHistoryItem[]> => {
  try {
    const url = `${API_URL}/payment/history`
    const token = getAuthToken()

    const response: AxiosResponse<PaymentHistoryResponse> = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return response.data.history
  } catch (error: unknown) {
    console.error("Payment history fetch error:", error instanceof Error ? error.message : "Unknown error")
    throw new Error("Failed to fetch payment history")
  }
}

