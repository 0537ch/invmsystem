import bcrypt from 'bcryptjs';

/**
 * Hashes a password using bcrypt algorithm with key from environment variables as salt
 * @param password - The password to hash
 * @returns The bcrypt hashed password
 */
export const hashPassword = (password: string): string => {
  const saltKey = process.env.BCRYPT_SALT;

  if (!saltKey) {
    throw new Error('Salt key not found in environment variables. Please set BCRYPT_SALT in your .env file.');
  }

  return bcrypt.hashSync(password, saltKey);
};
