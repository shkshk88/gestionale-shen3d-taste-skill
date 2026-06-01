/**
 * Utility per ottenere l'access token dall'auth-storage (Zustand persist)
 * Da usare quando si usa fetch invece di axios
 */
export function getAccessToken(): string | null {
  const authStorage = localStorage.getItem('auth-storage');
  if (!authStorage) return null;

  try {
    const parsed = JSON.parse(authStorage);
    return parsed.state?.accessToken || null;
  } catch {
    return null;
  }
}
