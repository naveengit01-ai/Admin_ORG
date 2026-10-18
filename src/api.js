// ============================================
// DWJD - CENTRAL API CONFIGURATION
// ============================================

// Change the backend URL only here.

// Production:
export const BASE_URL =
  "https://back-end-project-group.onrender.com";

// Local development:
// export const BASE_URL = "http://localhost:5000";

// ============================================
// COMMON API REQUEST FUNCTION
// ============================================

export const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
    });

    const responseText = await response.text();

    let result;

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      return {
        ok: false,
        status: "invalid_response",
        httpStatus: response.status,
        message: `Server returned a non-JSON response (HTTP ${response.status}).`,
      };
    }

    if (!response.ok) {
      return {
        ...result,
        ok: false,
        httpStatus: response.status,
        message:
          result.message ||
          result.error ||
          `Request failed with status ${response.status}.`,
      };
    }

    return {
      ...result,
      httpStatus: response.status,
    };
  } catch (error) {
    console.error("API Request Error:", error);

    return {
      ok: false,
      status: "network_error",
      message: "Unable to connect to the server. Please try again.",
    };
  }
};

// ============================================
// ADMIN SESSION HELPERS
// ============================================

const getAdminToken = () => {
  return localStorage.getItem("adminToken");
};

const unauthorizedResponse = () => ({
  ok: false,
  status: "unauthorized",
  message: "Your session has expired. Please log in again.",
});

// ============================================
// ADMIN LOGIN
// POST /admin/login
// ============================================

export const adminLogin = async (data) => {
  const result = await apiRequest("/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (result.status === "login_success" && result.token) {
    localStorage.setItem("adminToken", result.token);

    if (result.admin) {
      localStorage.setItem("admin", JSON.stringify(result.admin));
    }
  }

  return result;
};

// ============================================
// ADMIN LOGOUT
// LOCAL SESSION
// ============================================

export const adminLogout = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("admin");
};

// ============================================
// CREATE RIDER ACCOUNT
// POST /admin/create-rider
// ============================================

export const createRiderAccount = async (data) => {
  const result = await apiRequest("/admin/create-rider", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  console.log("Create Rider API Response:", result);

  return {
    ...result,
    ok: result.status === "rider_created",
  };
};

// ============================================
// CREATE ADMIN ACCOUNT
// POST /admin/create-admin
// ============================================

export const createAdminAccount = async (data) => {
  const adminToken = getAdminToken();

  if (!adminToken) {
    return unauthorizedResponse();
  }

  const result = await apiRequest("/admin/create-admin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(data),
  });

  console.log("Create Admin API Response:", result);

  return {
    ...result,
    ok:
      result.ok === true ||
      result.status === "admin_created" ||
      result.status === "admin_created_email_failed",
  };
};

// ============================================
// GET ALL ADMIN ACCOUNTS
// GET /admin/admins
// ============================================

export const getAllAdmins = async () => {
  const adminToken = getAdminToken();

  if (!adminToken) {
    return unauthorizedResponse();
  }

  const result = await apiRequest("/admin/admins", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  return {
    ...result,
    ok:
      result.status === "success" &&
      Array.isArray(result.admins),
  };
};

// ============================================
// UPDATE ADMIN STATUS
// PATCH /admin/admins/:adminId/status
// ============================================

export const updateAdminStatus = async (adminId, isActive) => {
  const adminToken = getAdminToken();

  if (!adminToken) {
    return unauthorizedResponse();
  }

  const result = await apiRequest(
    `/admin/admins/${adminId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        is_active: isActive,
      }),
    }
  );

  return {
    ...result,
    ok:
      result.ok === true ||
      result.status === "success",
  };
};

// ============================================
// GET ADMIN DIRECTORY
// GET /admin/dashboard/directory
// ============================================

export const getAdminDirectory = async () => {
  const adminToken = getAdminToken();

  if (!adminToken) {
    return unauthorizedResponse();
  }

  const result = await apiRequest(
    "/admin/dashboard/directory",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }
  );

  return {
    ...result,
    ok:
      result.status === "success" &&
      Array.isArray(result.data?.users) &&
      Array.isArray(result.data?.admins) &&
      Array.isArray(result.data?.riders),
  };
};

// ============================================
// GET ADMIN REPORTS OVERVIEW
// GET /admin/reports/overview
// ============================================

export const getAdminReportsOverview = async () => {
  const adminToken = getAdminToken();

  if (!adminToken) {
    return {
      ...unauthorizedResponse(),
      message: "Admin token not found. Please log in again.",
    };
  }

  const result = await apiRequest(
    "/admin/reports/overview",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }
  );

  return {
    ...result,
    ok:
      result.status === "success" &&
      result.httpStatus === 200,
  };
};

// ============================================
// DOWNLOAD ADMIN REPORT AS CSV
// GET /admin/reports/export/:type
// ============================================

export const downloadAdminReportCSV = async (type) => {
  const allowedTypes = [
    "users",
    "donations",
    "riders",
    "rider-requests",
    "admins",
  ];

  if (!allowedTypes.includes(type)) {
    return {
      ok: false,
      status: "invalid_report_type",
      message: "Invalid report type.",
    };
  }

  const adminToken = getAdminToken();

  if (!adminToken) {
    return unauthorizedResponse();
  }

  try {
    const response = await fetch(
      `${BASE_URL}/admin/reports/export/${encodeURIComponent(type)}`,
      {
        method: "GET",
        headers: {
          Accept: "text/csv",
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    if (!response.ok) {
      const responseText = await response.text();

      let message = `Failed to download report (HTTP ${response.status}).`;

      try {
        const result = responseText
          ? JSON.parse(responseText)
          : {};

        message =
          result.message ||
          result.error ||
          message;
      } catch {
        // Preserve the fallback message for non-JSON responses.
      }

      return {
        ok: false,
        status: "download_failed",
        httpStatus: response.status,
        message,
      };
    }

    const blob = await response.blob();

    const contentDisposition = response.headers.get(
      "Content-Disposition"
    );

    let filename = `dwjd-${type}-report.csv`;

    if (contentDisposition) {
      const match = contentDisposition.match(
        /filename="?([^"]+)"?/i
      );

      if (match?.[1]) {
        filename = match[1];
      }
    }

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);

    return {
      ok: true,
      status: "success",
      message: "Report downloaded successfully.",
      filename,
    };
  } catch (error) {
    console.error("CSV download error:", error);

    return {
      ok: false,
      status: "network_error",
      message:
        "Unable to download the report. Please try again.",
    };
  }
};

// ============================================
// GET RIDER REQUESTS
// GET /admin/rider-requests
// ============================================

export const getRiderRequests = async () => {
  const adminToken = localStorage.getItem("adminToken");

  if (!adminToken) {
    return {
      ok: false,
      status: "unauthorized",
      message: "Please log in again.",
    };
  }

  const result = await apiRequest("/admin/rider-requests", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  return {
    ...result,
    ok:
      result.status === "success" &&
      Array.isArray(result.requests),
  };
};

// ============================================
// APPROVE OR REJECT RIDER REQUEST
// PATCH /admin/rider-requests/:requestId/status
// ============================================

export const reviewRiderRequest = async (
  requestId,
  status,
  rejectionReason = ""
) => {
  const adminToken = localStorage.getItem("adminToken");

  if (!adminToken) {
    return {
      ok: false,
      status: "unauthorized",
      message: "Please log in again.",
    };
  }

  if (!["approved", "rejected"].includes(status)) {
    return {
      ok: false,
      status: "invalid_status",
      message: "Invalid rider request status.",
    };
  }

  const result = await apiRequest(
    `/admin/rider-requests/${encodeURIComponent(requestId)}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status,
        rejection_reason: rejectionReason,
      }),
    }
  );

  return {
    ...result,
    ok: result.status === "success",
  };
};

// ============================================
// CREATE RIDER ACCOUNT
// POST /admin/rider-requests/:requestId/create-account
// ============================================

export const createRiderFromRequest = async (requestId) => {
  const adminToken = localStorage.getItem("adminToken");

  if (!adminToken) {
    return {
      ok: false,
      status: "unauthorized",
      message: "Please log in again.",
    };
  }

  const result = await apiRequest(
    `/admin/rider-requests/${encodeURIComponent(requestId)}/create-account`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }
  );

  return {
    ...result,
    ok:
      result.status === "rider_created" ||
      result.status === "rider_created_email_failed",
  };
};