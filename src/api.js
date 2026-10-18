const BASE_URL = "https://back-end-project-group.onrender.com";
// const BASE_URL = "http://localhost:5000";

// ============================================
// ADMIN LOGIN
// ============================================

export const adminLogin = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return await response.json();

  } catch (error) {
    console.error("Admin API Error:", error);

    return {
      ok: false,
      message: "Unable to connect to server",
    };
  }
};


// ============================================
// CREATE RIDER ACCOUNT
// Uses existing /signup API
// ============================================

export const createRiderAccount = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/admin/create-rider`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    console.log("Create Rider API Response:", result);

    return {
      ...result,
      ok: result.status === "rider_created",
    };

  } catch (error) {
    console.error("Create Rider API Error:", error);

    return {
      ok: false,
      status: "network_error",
      message: "Unable to connect to server",
    };
  }
};