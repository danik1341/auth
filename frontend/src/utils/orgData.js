import axios from "axios";

export async function fetchOrganizationData(orgId) {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_PATH}/organization/${orgId}`
    );
    if (response) {
      return response.data;
    } else {
      return null;
    }
  } catch (err) {
    console.error("Failed to fetch organization data:", err);
  }
}

export async function sendInvitation(orgId, email) {
  const accessToken = localStorage.getItem("access_token");
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_PATH}/organizations/${orgId}/invite`,
      {
        email: email,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (response.status === 201) {
      return "Invitation sent successfully";
    } else {
      console.error("Failed to send invitation");
      return null;
    }
  } catch (err) {
    console.error("API request failed", err);
    return null;
  }
}

export async function fetchOrganizationInvitations(orgId) {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_PATH}/organizations/${orgId}/invitations`
    );

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Error fetching organization invitations:", response.data);
      return null;
    }
  } catch (err) {
    console.error(
      "An error occurred while fetching organization invitations:",
      err
    );
    return null;
  }
}

export async function deleteOrganizationInvitation(orgId, userId) {
  try {
    const response = await axios.delete(
      `${process.env.REACT_APP_API_PATH}/delete-pending-invitation`,
      {
        params: { user_id: userId, org_id: orgId },
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Error deleting organization invitation:", response.data);
      return null;
    }
  } catch (err) {
    console.error(
      "An error occurred while deleting organization invitations:",
      err
    );
    return null;
  }
}

export async function promoteEmployee(userId, orgId) {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_PATH}/move-employee-to-admin`,
      {
        user_id: userId,
        org_id: orgId,
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Error promoting employee:", response.data);
      return null;
    }
  } catch (err) {
    console.error("An error occurred while promoting employee:", err);
    return null;
  }
}

export async function demoteAdmin(userId, orgId) {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_PATH}/move-admin-to-employee`,
      {
        user_id: userId,
        org_id: orgId,
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Error demoting admin:", response.data);
      return null;
    }
  } catch (err) {
    console.error("An error occurred while demoting admin:", err);
    return null;
  }
}

export async function deleteEmployee(userId, orgId) {
  try {
    const response = await axios.delete(
      `${process.env.REACT_APP_API_PATH}/remove-employee`,
      {
        params: { user_id: userId, org_id: orgId },
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Error deleting employee:", response.data);
      return null;
    }
  } catch (err) {
    console.error("Error deleting employee:", err);
    return false;
  }
}

export async function deleteAdmin(userId, orgId) {
  try {
    const response = await axios.delete(
      `${process.env.REACT_APP_API_PATH}/remove-admin`,
      {
        params: { user_id: userId, org_id: orgId },
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Error deleting admin:", response.data);
      return null;
    }
  } catch (err) {
    console.error("Error deleting admin:", err);
    return false;
  }
}

export async function updateOrganization(orgId, orgData, token) {
  try {
    const response = await axios.put(
      `${process.env.REACT_APP_API_PATH}/organizations/${orgId}`,
      orgData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      return response.data.message;
    } else {
      console.error("Failed to update organization:", response.data);
      return null;
    }
  } catch (error) {
    console.error("API request failed", error);
    return null;
  }
}
