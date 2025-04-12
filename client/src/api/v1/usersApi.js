import { jwtDecode } from 'jwt-decode';
import { Api } from './Api';

/**
 * Safely retrieves the logged-in user's details.
 * Returns null if the token is missing, invalid, or the user cannot be fetched.
 */
export const getLoggedInUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  let userId;

  try {
    const decoded = jwtDecode(token);
    userId = decoded?.id;
    if (!userId) return null;
  } catch (_) {
    // Silent fail: token is invalid or tampered with
    return null;
  }

  try {
    const response = await Api.get(`/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response?.data?.user || null;
  } catch (_) {
    // Silent fail: API issue or invalid user
    return null;
  }
};