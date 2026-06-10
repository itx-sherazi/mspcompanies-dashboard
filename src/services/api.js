import axios from "axios";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1`;

// Get token from localStorage
function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("adminToken");
}

// Auth headers helper
function authHeaders(extra = {}) {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export function getAuthHeaders(extra = {}) {
  return authHeaders(extra);
}

export const loginUser = async (loginData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(loginData),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error("Network error");
  }
};

export const signinUser = async (signinData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(signinData),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error("Network error");
  }
};

export const deleteRequestById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/deleterequest/${id}`, {
      method: "DELETE",
      headers: authHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("API error deleting request:", error);
    return { ok: false, message: "Network or server error." };
  }
};

export const deleteBlog = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/blogdelete/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
      credentials: "include",
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return true;
  } catch (error) {
    console.error("Error deleting blog:", error);
    throw error;
  }
};

export const AddBlog = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/creat`, {
      method: "POST",
      headers: authHeaders(),
      credentials: "include",
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Failed to create blog");
    return result;
  } catch (error) {
    throw error;
  }
};

export const updateBlog = async (id, formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/update/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      credentials: "include",
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Failed to update blog");
    return result;
  } catch (error) {
    throw error;
  }
};

export const fetchRequest = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/AllData`, {
      headers: authHeaders(),
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Failed to fetch requests");
    return result;
  } catch (error) {
    console.error("fetchRequest error:", error);
    throw error;
  }
};

export const fetchBlog = async (page = 1, limit = 10) => {
  const response = await fetch(`${API_BASE_URL}/get?page=${page}&limit=${limit}`);
  const result = await response.json();
  return {
    data: result.data,
    totalPages: result.totalPages,
    totalBlogs: result.totalPosts,
  };
};

export const getAdminUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/getuser`, {
    headers: authHeaders(),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch admin users");
  const data = await response.json();
  return data.users || [];
};

export const deleteAdminUserById = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "DELETE",
    headers: authHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete admin user");
  }
  return await response.json();
};

export const fetchCitiesAdmin = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/cities`, {
      headers: authHeaders(),
      credentials: "include",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch cities");
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, data: { ok: false, message: error.message } };
  }
};

export const createCityAdmin = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cities`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to create city");
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, data: { ok: false, message: error.message } };
  }
};

export const updateCityAdmin = async (id, payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cities/${id}`, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update city");
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, data: { ok: false, message: error.message } };
  }
};

export const deleteCityAdmin = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cities/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
      credentials: "include",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to delete city");
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, data: { ok: false, message: error.message } };
  }
};

export const deleteCityHubCompany = async (cityId, companySlug) => {
  try {
    const enc = encodeURIComponent(String(companySlug));
    const response = await fetch(`${API_BASE_URL}/cities/${cityId}/companies/${enc}`, {
      method: "DELETE",
      headers: authHeaders(),
      credentials: "include",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to remove company from city");
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, data: { ok: false, message: error.message } };
  }
};

export const toggleCityHubCompanySponsored = async (cityId, companySlug) => {
  try {
    const enc = encodeURIComponent(String(companySlug));
    const response = await fetch(
      `${API_BASE_URL}/cities/${cityId}/companies/${enc}/toggle-sponsored`,
      { method: "PATCH", headers: authHeaders(), credentials: "include" },
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Toggle failed");
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, data: { ok: false, message: error.message } };
  }
};

export const fetchAllCityHubCompaniesAdmin = async ({ q = "", page = 1, limit = 50 } = {}) => {
  try {
    const params = new URLSearchParams();
    if (String(q).trim()) params.set("q", String(q).trim());
    params.set("page", String(Math.max(1, page)));
    params.set("limit", String(Math.min(100, Math.max(1, limit))));
    const response = await fetch(`${API_BASE_URL}/cities/hub-companies?${params}`, {
      headers: authHeaders(),
      credentials: "include",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to load city hub companies");
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, data: { ok: false, message: error.message } };
  }
};

export const updateCityHubCompany = async (cityId, companySlug, formData) => {
  try {
    const enc = encodeURIComponent(String(companySlug));
    const response = await fetch(`${API_BASE_URL}/cities/${cityId}/companies/${enc}`, {
      method: "PUT",
      headers: authHeaders(),
      credentials: "include",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update company");
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, data: { ok: false, message: error.message } };
  }
};

export const uploadCityCompaniesSheet = async (file, citySlug) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("citySlug", citySlug);
    const response = await fetch(`${API_BASE_URL}/cities/upload-companies`, {
      method: "POST",
      headers: authHeaders(),
      credentials: "include",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Upload failed");
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, data: { ok: false, message: error.message || "Something went wrong" } };
  }
};

// ── Managed IT Services ─────────────────────────────────

export const uploadManagedItSheet = async (file, mode = "append") => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);
    const response = await fetch(`${API_BASE_URL}/admin/managed-it-services/upload`, {
      method: "POST",
      headers: authHeaders(),
      credentials: "include",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Upload failed");
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, data: { ok: false, message: error.message || "Something went wrong" } };
  }
};

export const fetchManagedItAdmin = async ({ q = "", page = 1, limit = 50 } = {}) => {
  try {
    const params = new URLSearchParams();
    if (String(q).trim()) params.set("q", String(q).trim());
    params.set("page", String(page));
    params.set("limit", String(limit));
    const response = await fetch(`${API_BASE_URL}/admin/managed-it-services?${params}`, {
      headers: authHeaders(),
      credentials: "include",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to load companies");
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, data: { ok: false, message: error.message } };
  }
};

export const deleteManagedItCompany = async (slug) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/managed-it-services/${encodeURIComponent(slug)}`, {
      method: "DELETE",
      headers: authHeaders(),
      credentials: "include",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Delete failed");
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, data: { ok: false, message: error.message } };
  }
};

export const deleteAllManagedIt = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/managed-it-services/all`, {
      method: "DELETE",
      headers: authHeaders(),
      credentials: "include",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Delete all failed");
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, data: { ok: false, message: error.message } };
  }
};
