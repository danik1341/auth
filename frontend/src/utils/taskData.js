import axios from "axios";

export async function addTaskData(orgId, title, description) {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_PATH}/organizations/${orgId}/tasks`,
      {
        title: title,
        description: description,
      }
    );

    if (response.status === 201) {
      return response.data.message;
    } else {
      console.error("Error adding task:", response.data);
      return null;
    }
  } catch (err) {
    console.error("Error adding task:", err);
    return null;
  }
}

export async function fetchTasksData(orgId) {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_PATH}/organizations/${orgId}/tasks`
    );

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Error fetching tasks:", response.data);
      return null;
    }
  } catch (err) {
    console.error("Error fetching tasks:", err);
    return false;
  }
}

export async function markCompleteTask(taskId, token) {
  try {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const response = await axios.put(
      `${process.env.REACT_APP_API_PATH}/complete-task/${taskId}`,
      {
        date: formattedDate,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Error marking task as completed:", response.data);
      return null;
    }
  } catch (err) {
    console.error("Error marking task as completed:", err);
    return null;
  }
}

export async function unmarkTask(taskId) {
  try {
    const response = await axios.put(
      `${process.env.REACT_APP_API_PATH}/uncheck-task/${taskId}`
    );

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Error unmarking task as uncompleted:", response.data);
      return null;
    }
  } catch (err) {
    console.error("Error unmarking task as uncompleted:", err);
    return null;
  }
}

export async function deleteTask(taskId) {
  try {
    const response = await axios.delete(
      `${process.env.REACT_APP_API_PATH}/delete-task/${taskId}`
    );

    if (response.status) {
      return response.data;
    } else {
      console.error("Error deleting task:", response.data);
      return null;
    }
  } catch (err) {
    console.error("Error deleting task:", err);
    return null;
  }
}
