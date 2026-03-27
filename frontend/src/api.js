// Base URL for all API calls.
// Set VITE_API_URL in Vercel environment variables (e.g. https://nuvest-api.onrender.com).
// Falls back to '' so the Vite dev-server proxy still works locally.
export const API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
