import { hashPassword } from './auth';

const TOKEN_ENDPOINT = process.env.API_TOKEN_ENDPOINT;

interface CompanyAuthResponse {
  token: string;
  expiresIn?: number;
  [key: string]: any;
}

/**
 * Calls the company API to validate credentials
 * @param username - The username
 * @param password - The plain text password
 * @returns The company API response with token
 * @throws Error if authentication fails
 */
export async function authenticateWithCompanyAPI(
  username: string,
  password: string
): Promise<CompanyAuthResponse> {
  if (!TOKEN_ENDPOINT) {
    throw new Error('API_TOKEN_ENDPOINT not found in environment variables');
  }

  const hashedPassword = hashPassword(password);

  try {
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        username,
        password: hashedPassword,
      }),
    });

    if (!response.ok) {
      throw new Error(`Company API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.token) {
      throw new Error('No token received from company API');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error during company API authentication');
  }
}
