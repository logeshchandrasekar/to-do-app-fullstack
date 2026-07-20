// src/lib/api.js
// Thin fetch wrapper: attaches the JWT, and surfaces auth failures so callers can react (e.g. log out).

const TOKEN_KEY = 'taskflow_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

export const decodeToken = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
};

class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

export async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(endpoint, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
        removeToken();
        window.dispatchEvent(new CustomEvent('taskflow:auth-error'));
        throw new ApiError('Your session expired — please log in again.', response.status);
    }

    if (!response.ok) {
        let message = 'Something went wrong.';
        try {
            const body = await response.json();
            message = body.message || message;
        } catch {
            /* response had no JSON body */
        }
        throw new ApiError(message, response.status);
    }

    if (response.status === 204) return null;
    return response.json();
}
