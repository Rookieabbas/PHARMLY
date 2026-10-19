const RAW_API_URL =
  import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ""
    ? import.meta.env.VITE_API_URL
    : import.meta.env.DEV
    ? "http://localhost:5000"
    : "";

// Strip any trailing slash so `${API_URL}/${endpoint}` never forms double slashes like `//api/auth/login`
const API_URL = RAW_API_URL.replace(/\/+$/, "");

const buildUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_URL}${cleanEndpoint}`;
};

const handleResponse = async (response, endpoint) => {
  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch (_) {}

    const errorMsg =
      errorData?.message ||
      errorData?.error ||
      `Error: ${response.status} ${response.statusText}`;

    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  return await response.json();
};

export const api = {
  get: async (endpoint) => {
    try {
      const response = await fetch(buildUrl(endpoint));
      return await handleResponse(response, endpoint);
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  },

  post: async (endpoint, data) => {
    try {
      const response = await fetch(buildUrl(endpoint), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return await handleResponse(response, endpoint);
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      throw error;
    }
  },

  put: async (endpoint, data) => {
    try {
      const response = await fetch(buildUrl(endpoint), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return await handleResponse(response, endpoint);
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      throw error;
    }
  },

  delete: async (endpoint) => {
    try {
      const response = await fetch(buildUrl(endpoint), {
        method: "DELETE",
      });
      return await handleResponse(response, endpoint);
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  },
};
