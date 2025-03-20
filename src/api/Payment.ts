import axios, { AxiosResponse } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const getAuthToken = () => sessionStorage.getItem('authToken');

interface BalanceResponse {
  balance: number;
}

interface DepositResponse {
  invoiceUrl: string;
  orderId: string;
}

interface PaymentStatusResponse {
  status: string;
}

export const getBalance = async (): Promise<number> => {
  try {
    const url = `${API_URL}/payment/getBalance`;
    const token = getAuthToken();

    const result: AxiosResponse<BalanceResponse> = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return result.data.balance;
  } catch (error) {
    throw new Error('Failed to fetch balance');
  }
};

export const createDeposit = async (amount: number): Promise<DepositResponse> => {
  try {
    const url = `${API_URL}/payment/deposit`;
    const token = getAuthToken();

    const response: AxiosResponse<DepositResponse> = await axios.post(
      url,
      { amount },
      {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to create deposit');
  }
};

export const checkPaymentStatus = async (orderId: string): Promise<string> => {
  try {
    const url = `${API_URL}/payment/status/${orderId}`;
    const token = getAuthToken();

    const response: AxiosResponse<PaymentStatusResponse> = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.status;
  } catch (error) {
    throw new Error('Failed to fetch payment status');
  }
};
