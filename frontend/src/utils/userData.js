import axios from "axios";

export async function fetchUserData(token) {
  if (!token) {
    return null;
  }

  try {
    const response = await axios.get(`${process.env.REACT_APP_API_PATH}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const userData = response.data;
    return userData;
  } catch (err) {
    console.error("Failed to fetch user data:", err.message);
  }
}

export async function fetchUserOrganizations(accessToken) {
  if (!accessToken) {
    return null;
  }

  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_PATH}/user/organizations`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error("Failed to fetch user organizations:", err.message);
    return null;
  }
}

export async function fetchUsersDataById(userIds) {
  try {
    const userIdsString = userIds.join(",");
    const response = await axios.get(
      `${process.env.REACT_APP_API_PATH}/users`,
      {
        params: { user_ids: userIdsString },
      }
    );
    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Failed to fetch user data");
      return null;
    }
  } catch (err) {
    console.error("API request failed", err);
    return null;
  }
}

export async function fetchUserInvitations(userId) {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_PATH}/users/${userId}/invitations`
    );

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Failed to fetch user invitations");
      return null;
    }
  } catch (err) {
    console.error("API request failed", err);
    return null;
  }
}

export async function acceptInvitation(orgId) {
  const accessToken = localStorage.getItem("access_token");
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_PATH}/organizations/${orgId}/accept-invitation`,
      null,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (response.status === 200) {
      return "Invitation accepted successfully";
    } else {
      console.error("Failed to accept invitation");
      return null;
    }
  } catch (err) {
    console.error("API request failed", err);
    return null;
  }
}

export async function declineInvitation(orgId) {
  const accessToken = localStorage.getItem("access_token");
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_PATH}/organizations/${orgId}/decline-invitation`,
      null,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (response.status === 200) {
      return "Invitation declined successfully";
    } else {
      console.error("Failed to decline invitation");
      return null;
    }
  } catch (err) {
    console.error("API request failed", err);
    return null;
  }
}
