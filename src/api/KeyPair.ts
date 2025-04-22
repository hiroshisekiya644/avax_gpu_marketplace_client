import axios, { type AxiosResponse } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL
const getAuthToken = () => localStorage.getItem('authToken')

interface KeyPair {
  id: number
  user_id: number
  ssh_key_name: string
  ssh_public_key: string
  region: string
  hyperstack_ssh_key_id: string
  hyperstack_ssh_key_name: string
  is_deleted: boolean
  deleted_at: string | null
  createdAt: string
  updatedAt: string
}

interface HyperstackEnvironmentFeatures {
  network_optimised: boolean
  green_status: string
}

interface HyperstackEnvironment {
  id: number
  name: string
  features: HyperstackEnvironmentFeatures
}

interface HyperstackKeypair {
  id: string
  name: string
  environment: HyperstackEnvironment
  public_key: string
  fingerprint: string
  created_at: string
}

interface HyperstackData {
  status: boolean
  message: string
  keypair: HyperstackKeypair
}

interface KeyPairResponse {
  message: string
  keyPairs: KeyPair[]
}

interface KeyPairCreateResponse {
  message: string
  keypair: KeyPair
  hyperstackData: HyperstackData
}

interface KeyPairUpdateResponse {
  message: string
  keypair: KeyPair
}

interface KeyPairCreateData {
  ssh_key_name: string
  ssh_public_key: string
  region: string
}

interface KeyPairUpdateData {
  name: string
}

/**
 * Fetches all SSH key pairs for the current user
 * @returns Object containing message and array of key pairs
 */
export const getUserKeyPairs = async (): Promise<KeyPairResponse> => {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No access token found')
    }

    const url = `${API_URL}/keypairs`
    const result: AxiosResponse<KeyPairResponse> = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    })

    return result.data
  } catch (error: unknown) {
    console.error('Key pairs fetch error:', error instanceof Error ? error.message : 'Unknown error')
    throw new Error('Failed to fetch SSH keys')
  }
}

/**
 * Imports a new SSH key pair
 * @param data - Object containing key pair data
 * @returns Object containing message, created key pair, and Hyperstack data
 */
export const importKeyPair = async (data: KeyPairCreateData): Promise<KeyPairCreateResponse> => {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No access token found')
    }

    const url = `${API_URL}/keypairs`
    const result: AxiosResponse<KeyPairCreateResponse> = await axios.post(url, data, {
      headers: { Authorization: `Bearer ${token}` }
    })

    return result.data
  } catch (error: unknown) {
    console.error('Key pair import error:', error instanceof Error ? error.message : 'Unknown error')
    throw new Error('Failed to import SSH key')
  }
}

/**
 * Updates an existing SSH key pair
 * @param id - ID of the key pair to update
 * @param data - Object containing updated key pair data
 * @returns Object containing message, updated key pair, and Hyperstack data
 */
export const updateKeyPair = async (id: number, data: KeyPairUpdateData): Promise<KeyPairUpdateResponse> => {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No access token found')
    }

    const url = `${API_URL}/keypairs/${id}`
    const result: AxiosResponse<KeyPairUpdateResponse> = await axios.put(url, data, {
      headers: { Authorization: `Bearer ${token}` }
    })

    return result.data
  } catch (error: unknown) {
    console.error('Key pair update error:', error instanceof Error ? error.message : 'Unknown error')
    throw new Error('Failed to update SSH key')
  }
}

/**
 * Deletes an SSH key pair
 * @param id - ID of the key pair to delete
 * @returns Object containing success message
 */
export const deleteKeyPair = async (id: number): Promise<{ message: string }> => {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No access token found')
    }

    const url = `${API_URL}/keypairs/${id}`
    const result: AxiosResponse<{ message: string }> = await axios.delete(url, {
      headers: { Authorization: `Bearer ${token}` }
    })

    return result.data
  } catch (error: unknown) {
    console.error('Key pair deletion error:', error instanceof Error ? error.message : 'Unknown error')
    throw new Error('Failed to delete SSH key')
  }
}

// Export the KeyPair type for use in other files
export type { KeyPair, KeyPairCreateResponse, KeyPairUpdateResponse, HyperstackData, KeyPairCreateData }
