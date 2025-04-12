import { jwtDecode } from 'jwt-decode';
import { Api } from './Api';

/**
 * Get the currently logged-in user's data from the backend.
 *
 * @returns {Promise<Object|null>} The user object, or null if something fails.
 */
export const getLoggedInUser = async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    console.warn('No token found in localStorage.');
    return null;
  }

  let userId;

  try {
    const decoded = jwtDecode(token);
    userId = decoded?.id;

    if (!userId) {
      console.warn('No user ID found in the decoded token.');
      return null;
    }
  } catch (err) {
    console.error('Failed to decode token:', err);
    return null;
  }

  try {
    const response = await Api.get(`/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response?.data?.user || null;
  } catch (err) {
    console.error('Failed to fetch user data:', err?.message || err);
    return null;
  }
};