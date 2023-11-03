import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  deleteAdmin,
  deleteEmployee,
  deleteOrganizationInvitation,
  demoteAdmin,
  fetchOrganizationData,
  fetchOrganizationInvitations,
  promoteEmployee,
  sendInvitation,
  updateOrganization,
} from "../../utils/orgData";
import { fetchUserData, fetchUsersDataById } from "../../utils/userData";
import {
  addTaskData,
  deleteTask,
  fetchTasksData,
  markCompleteTask,
  unmarkTask,
} from "../../utils/taskData";

export default function OrganizationPage() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [owners, setOwners] = useState([]);
  const [orgInvitations, setOrgInvitations] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("tasks");

  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState("");
  const accessToken = localStorage.getItem("access_token");

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const updateIsDeleted = (user_id) => {
    setOrgInvitations((prevOrgInvs) =>
      prevOrgInvs.map((inv) =>
        inv.user_id === user_id ? { ...inv, isDeleted: true } : inv
      )
    );
  };

  const updateEmpOrAdIsDeleted = (userId, who) => {
    setOrganization((prevOrg) => {
      if (who === "emp") {
        return {
          ...prevOrg,
          employees: prevOrg.employees.map((employee) =>
            employee.id === userId ? { ...employee, isDeleted: true } : employee
          ),
        };
      }
      if (who === "ad") {
        return {
          ...prevOrg,
          admins: prevOrg.admins.map((admin) =>
            admin.id === userId ? { ...admin, isDeleted: true } : admin
          ),
        };
      }
      return prevOrg;
    });
  };

  const updateEmpOrAdIsPromotedOrDemoted = (userId, who) => {
    setOrganization((prevOrg) => {
      if (who === "emp") {
        return {
          ...prevOrg,
          employees: prevOrg.employees.map((employee) =>
            employee.id === userId
              ? { ...employee, isPromoted: true }
              : employee
          ),
        };
      }
      if (who === "ad") {
        return {
          ...prevOrg,
          admins: prevOrg.admins.map((admin) =>
            admin.id === userId ? { ...admin, isDemoted: true } : admin
          ),
        };
      }
      return prevOrg;
    });
  };

  const updateTaskToggle = (taskId) => {
    setTasks((prevTasks) => {
      return prevTasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            wasToggled: !task.wasToggled,
          };
        } else {
          return task;
        }
      });
    });
  };

  const updateDeletedTask = (taskId) => {
    setTasks((prevTasks) => {
      return prevTasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            isDeleted: true,
          };
        } else {
          return task;
        }
      });
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      const orgData = await fetchOrganizationData(orgId);
      if (orgData) {
        const modifiedOrganization = {
          ...orgData,
          admins:
            orgData.admins && orgData.admins.length > 0
              ? orgData.admins.map((admin) => ({
                  ...admin,
                  isDeleted: false,
                  isDemoted: false,
                }))
              : orgData.admins,
          employees:
            orgData.employees && orgData.employees.length > 0
              ? orgData.employees.map((employee) => ({
                  ...employee,
                  isDeleted: false,
                  isPromoted: false,
                }))
              : orgData.employees,
        };
        setOrganization(modifiedOrganization);
      }
      const orgInvs = await fetchOrganizationInvitations(orgId);
      if (orgInvs) {
        const orgInvWithFlags = orgInvs.map((inv) => ({
          ...inv,
          isDeleted: false,
        }));
        setOrgInvitations(orgInvWithFlags);
      } else {
        setOrgInvitations([]);
      }

      const tasksData = await fetchTasksData(orgId);
      if (tasksData.length > 0) {
        const tasksWithWasToggled = tasksData.map((task) => ({
          ...task,
          wasToggled: task.completed,
          isDeleted: false,
        }));
        setTasks(tasksWithWasToggled);
      } else {
        setTasks(null);
      }
    };
    fetchData();
  }, [orgId]);

  useEffect(() => {
    if (organization && organization.owners) {
      const fetchData = async () => {
        const ownerIds = organization.owners.map((owner) => owner.id);
        const ownersData = await fetchUsersDataById(ownerIds);
        if (ownersData) {
          setOwners(ownersData);
        }
      };
      fetchData();
    }
  }, [organization]);

  useEffect(() => {
    if (accessToken) {
      const fetchData = async () => {
        const userData = await fetchUserData(accessToken);
        if (userData) {
          setUser(userData);
        } else {
          setUser("");
        }
      };
      fetchData();
    } else {
      setUser(null);
    }
  }, [accessToken]);

  useEffect(() => {
    if (user) {
      if (organization.admins) {
        if (organization.admins.some((admin) => admin.id === user.id)) {
          setIsAdmin(true);
        }
      }
      if (owners) {
        if (owners.some((owner) => owner.id === user.id)) {
          setIsOwner(true);
        }
      }
    } else if (user === null) {
      navigate("/");
    }
  }, [user]);

  return (
    <div className="p-8 sm:p-14">
      {organization ? (
        <>
          <h1 className="text-3xl text-center">{organization.name}</h1>
          {owners && (
            <div className="flex flex-col items-center p-5 sm:block">
              <h1 className="my-2 text-2xl underline">Owners:</h1>
              <div className="flex flex-col flex-wrap flex-1 gap-3 sm:flex-row">
                {owners.map((owner) => (
                  <h2 key={owner.id} className="text-xl italic">
                    {owner.email},
                  </h2>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5">
            <div className="tabs">
              <button
                className={`tab tab-lifted leading-tight text-xs sm:text-lg sm:tab-lg ${
                  activeTab === "tasks" && "tab-active"
                }`}
                onClick={() => handleTabClick("tasks")}
              >
                Tasks
              </button>
              <button
                className={`tab tab-lifted leading-tight text-xs sm:text-lg sm:tab-lg ${
                  activeTab === "employees" && "tab-active"
                }`}
                onClick={() => handleTabClick("employees")}
              >
                Employees
              </button>
              {isOwner && (
                <button
                  className={`tab tab-lifted leading-tight text-xs sm:text-lg sm:tab-lg ${
                    activeTab === "options" && "tab-active"
                  }`}
                  onClick={() => handleTabClick("options")}
                >
                  Options
                </button>
              )}
            </div>

            {activeTab === "tasks" && (
              <TasksTabContent
                tasks={tasks}
                isAdmin={isAdmin}
                isOwner={isOwner}
                accessToken={accessToken}
                updateTaskToggle={updateTaskToggle}
                updateDeletedTask={updateDeletedTask}
              />
            )}
            {activeTab === "employees" && (
              <EmployeesTabContent
                admins={organization.admins}
                employees={organization.employees}
                updateEmpOrAdIsDeleted={updateEmpOrAdIsDeleted}
                updateEmpOrAdIsPromotedOrDemoted={
                  updateEmpOrAdIsPromotedOrDemoted
                }
                orgId={orgId}
                isOwner={isOwner}
              />
            )}
            {activeTab === "options" && (
              <OptionsTabContent
                orgId={orgId}
                orgInvs={orgInvitations}
                updateIsDeleted={updateIsDeleted}
                accessToken={accessToken}
              />
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-center">
            <span className="loading loading-dots loading-lg"></span>
          </div>
          {(!owners || owners.length === 0 || owners === null) && (
            <div className="flex items-center justify-center sm:block">
              <span className="loading loading-infinity loading-md"></span>
              <span className="loading loading-infinity loading-md"></span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TasksTabContent({
  tasks,
  isAdmin,
  isOwner,
  accessToken,
  updateTaskToggle,
  updateDeletedTask,
}) {
  const [openAccordions, setOpenAccordions] = useState({});

  const isAccordionOpen = (accordionId) => !!openAccordions[accordionId];

  const handleAccordionClick = (accordionId) => {
    setOpenAccordions((prevState) => ({
      ...prevState,
      [accordionId]: !isAccordionOpen(accordionId),
    }));
  };

  const handleUnCheckTask = async (id) => {
    const result = await unmarkTask(id);
    if (result) {
      updateTaskToggle(id);
    }
  };

  const handleCompleteTask = async (id) => {
    const result = await markCompleteTask(id, accessToken);
    if (result) {
      updateTaskToggle(id);
    }
  };

  const handleDelete = async (id) => {
    const result = await deleteTask(id);
    if (result) {
      updateDeletedTask(id);
    }
  };

  return (
    <div className="max-w-full mt-4">
      <div className="overflow-x-auto">
        {tasks ? (
          tasks.length > 0 ? (
            <table className="table-xs sm:table">
              <thead>
                <tr>
                  <th></th>
                  <th>Task Title</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, index) => (
                  <React.Fragment key={index}>
                    {!task.isDeleted && (
                      <tr>
                        <th>{index + 1}</th>
                        <td>
                          <div className="collapse collapse-plus bg-base-200">
                            <input
                              className="cursor-pointer"
                              type="checkbox"
                              id={index}
                              checked={isAccordionOpen(index)}
                              onChange={() => handleAccordionClick(index)}
                            />
                            <div className="text-base font-medium sm:text-xl collapse-title">
                              {task.title}
                            </div>
                            <div className="flex flex-col collapse-content">
                              <p className="sm:max-w-[600px] max-w-[300px] sm:text-base self-center overflow-hidden p-4 break-words border rounded-md border-slate-400 ">
                                {task.description}
                              </p>
                              <div className="flex flex-col items-center mt-8 space-y-5 sm:flex-row sm:space-y-0 justify-evenly">
                                {task.completed && (
                                  <>
                                    <span>
                                      Marked as done at: {task.completed_at}
                                    </span>
                                    <span>
                                      Marked done by: {task.completed_by_email}
                                    </span>
                                  </>
                                )}
                                <input
                                  type="checkbox"
                                  checked={task.wasToggled}
                                  title={
                                    task.wasToggled
                                      ? "Completed"
                                      : "In Progress"
                                  }
                                  className={`checkbox ${
                                    task.wasToggled
                                      ? "checkbox-success"
                                      : "checkbox-error"
                                  }`}
                                  onChange={(e) => {
                                    e.preventDefault();
                                    if (isOwner && task.wasToggled) {
                                      handleUnCheckTask(task.id);
                                    } else if (
                                      (isOwner || isAdmin) &&
                                      !task.wasToggled
                                    ) {
                                      handleCompleteTask(task.id);
                                    }
                                  }}
                                />
                                {isOwner && (
                                  <button
                                    className="border btn btn-sm btn-outline hover:btn-error"
                                    title="Delete"
                                    onClick={() => handleDelete(task.id)}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="w-6 h-6"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-5">
              <span className="loading loading-ball loading-lg"></span>
              <span className="loading loading-ball loading-lg"></span>
              <span className="loading loading-ball loading-lg"></span>
            </div>
          )
        ) : (
          <div>
            Your organization has no tasks. Create some and they will be shown
            here.
          </div>
        )}
      </div>
    </div>
  );
}

function EmployeesTabContent({
  admins,
  employees,
  updateEmpOrAdIsDeleted,
  updateEmpOrAdIsPromotedOrDemoted,
  orgId,
  isOwner,
}) {
  const [openAccordions, setOpenAccordions] = useState({});

  const isAccordionOpen = (accordionId) => !!openAccordions[accordionId];

  const handleAccordionClick = (accordionId) => {
    setOpenAccordions((prevState) => ({
      ...prevState,
      [accordionId]: !isAccordionOpen(accordionId),
    }));
  };

  const handlePromoteDemote = async (userId, who) => {
    if (who === "emp") {
      const response = await promoteEmployee(userId, orgId);
      if (response) {
        updateEmpOrAdIsPromotedOrDemoted(userId, who);
      }
    } else if (who === "ad") {
      const response = await demoteAdmin(userId, orgId);
      if (response) {
        updateEmpOrAdIsPromotedOrDemoted(userId, who);
      }
    }
  };

  const handleDelete = async (userId, who) => {
    if (who === "emp") {
      const response = await deleteEmployee(userId, orgId);
      if (response) {
        updateEmpOrAdIsDeleted(userId, who);
      }
    } else if (who === "ad") {
      const response = await deleteAdmin(userId, orgId);
      if (response) {
        updateEmpOrAdIsDeleted(userId, who);
      }
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="collapse collapse-arrow bg-base-200">
        <input
          className="cursor-pointer"
          type="checkbox"
          id="admins"
          checked={isAccordionOpen("admins")}
          onChange={() => handleAccordionClick("admins")}
        />
        <div className="text-xl font-medium cursor-pointer collapse-title">
          Admins
        </div>
        <div className="overflow-x-auto bg-gray-700 collapse-content">
          <div className="overflow-x-auto">
            {admins.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Admin Email</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((ad, index) => (
                    <React.Fragment key={index}>
                      {!ad.isDeleted && !ad.isDemoted && (
                        <tr className="hover">
                          <th>{index + 1}</th>
                          <td>{ad.email}</td>
                          {isOwner && (
                            <>
                              <td>
                                <button
                                  className="border btn btn-sm btn-outline hover:btn-warning"
                                  title="Demote"
                                  onClick={() =>
                                    handlePromoteDemote(ad.id, "ad")
                                  }
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-6 h-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                    />
                                  </svg>
                                </button>
                              </td>
                              <td>
                                <button
                                  className="border btn btn-sm btn-outline hover:btn-error"
                                  title="Delete"
                                  onClick={() => handleDelete(ad.id, "ad")}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-6 h-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4">
                This organization has no admins, invite and/or promote your
                employees to admins
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="collapse collapse-arrow bg-base-200">
        <input
          className="cursor-pointer"
          type="checkbox"
          id="employees"
          checked={isAccordionOpen("employees")}
          onChange={() => handleAccordionClick("employees")}
        />
        <div className="text-xl font-medium cursor-pointer collapse-title">
          Employees
        </div>
        <div className="overflow-x-auto bg-gray-700 collapse-content">
          <div className="overflow-x-auto">
            {employees.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Employee Email</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, index) => (
                    <React.Fragment key={index}>
                      {!emp.isDeleted && !emp.isPromoted && (
                        <tr className="hover">
                          <th>{index + 1}</th>
                          <td>{emp.email}</td>
                          {isOwner && (
                            <>
                              <td>
                                <button
                                  className="border btn btn-sm btn-outline hover:btn-success"
                                  title="Promote"
                                  onClick={() =>
                                    handlePromoteDemote(emp.id, "emp")
                                  }
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-6 h-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                                    />
                                  </svg>
                                </button>
                              </td>
                              <td>
                                <button
                                  className="border btn btn-sm btn-outline hover:btn-error"
                                  title="Delete"
                                  onClick={() => handleDelete(emp.id, "emp")}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-6 h-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4">
                This organization has no employees. The owners should invite
                somebody.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionsTabContent({ orgId, orgInvs, updateIsDeleted, accessToken }) {
  const [invStatus, setInvStatus] = useState("");
  const [taskSubStatus, setTaskSubStatus] = useState("");
  const [updateOrgStatus, setUpdateOrgStatus] = useState("");
  const [orgName, setOrgName] = useState("");
  const [coOwnersEmails, setCoOwnersEmails] = useState("");
  const handleSubmitInvitation = async (e) => {
    e.preventDefault();

    const email = e.target.email.value;

    const result = await sendInvitation(orgId, email);
    setInvStatus(result);
  };

  const handleDelete = async (user_id) => {
    const response = await deleteOrganizationInvitation(orgId, user_id);
    if (response) {
      updateIsDeleted(user_id);
    }
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();

    const title = e.target.title.value;
    const description = e.target.description.value;

    const result = await addTaskData(orgId, title, description);
    setTaskSubStatus(result);
  };

  const handleUpdateOrgSubmit = async (e) => {
    e.preventDefault();

    const coOwners = coOwnersEmails.split(",").map((email) => email.trim());

    const orgData = {
      name: orgName,
      owners: coOwners,
    };

    const result = await updateOrganization(orgId, orgData, accessToken);

    if (result) {
      setUpdateOrgStatus(result);
    }
  };

  return (
    <div className="flex flex-col mt-4">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold underline sm:text-3xl">Add Task:</h1>
        <div className="flex flex-col items-center w-full mt-4 sm:mt-10">
          <form
            className="flex flex-col space-y-3 sm:w-3/4"
            onSubmit={handleSubmitTask}
          >
            <input
              type="text"
              placeholder="Task Title"
              name="title"
              className="w-full font-semibold text-black input bg-slate-200"
            />
            <textarea
              placeholder="Description"
              name="description"
              className="w-full font-semibold text-black textarea bg-slate-200"
            />
            <button className="w-full btn btn-primary" type="submit">
              Add Task
            </button>
            {taskSubStatus && taskSubStatus.length > 0 && (
              <span className="text-success">{taskSubStatus}</span>
            )}
          </form>
        </div>
      </div>

      <div className="py-3 divider" />

      <div className="flex flex-col mt-5 sm:mt-10">
        <h1 className="text-xl font-bold underline sm:text-3xl">
          Add Employee:
        </h1>
        <div className="flex flex-col items-center w-full mt-4 sm:mt-10">
          <form
            className="flex flex-col space-y-3 sm:w-3/4"
            onSubmit={handleSubmitInvitation}
          >
            <input
              type="email"
              placeholder="Employee Email"
              name="email"
              className="w-full font-semibold text-black input bg-slate-200"
            />
            <button className="w-full btn btn-primary" type="submit">
              Send Invitation
            </button>
            {invStatus && invStatus.length > 0 && (
              <span className="text-success">{invStatus}</span>
            )}
          </form>
        </div>
      </div>

      <div className="py-3 divider" />

      <div className="flex flex-col mt-5 sm:mt-10">
        <h1 className="text-xl font-bold underline sm:text-3xl">
          Organization Options:
        </h1>
        <div className="flex flex-col items-center w-full mt-4 sm:mt-10">
          <form
            className="flex flex-col space-y-3 sm:w-3/4"
            onSubmit={handleUpdateOrgSubmit}
          >
            <input
              type="text"
              placeholder="Change Organization Name"
              name="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full font-semibold text-black input bg-slate-200"
            />
            <textarea
              placeholder="Co-Owners (comma-separated emails):"
              name="coOwnersEmails"
              value={coOwnersEmails}
              onChange={(e) => setCoOwnersEmails(e.target.value)}
              className="w-full font-semibold text-black textarea bg-slate-200"
            />
            <button className="w-full btn btn-primary" type="submit">
              Save Changes
            </button>
            {updateOrgStatus && updateOrgStatus.length > 0 && (
              <span className="text-success">{updateOrgStatus}</span>
            )}
          </form>
        </div>
      </div>

      <div className="py-3 divider" />

      <div className="flex flex-col mt-5 sm:mt-10">
        <h1 className="text-xl font-bold underline sm:text-3xl">
          Pendding Employee Invitations:
        </h1>
        {orgInvs ? (
          <>
            {orgInvs.length > 0 ? (
              <div className="w-full my-8 overflow-x-auto ">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgInvs.map((inv, index) => (
                      <React.Fragment key={index}>
                        {!inv.isDeleted && (
                          <tr className="hover">
                            <th>{index + 1}</th>
                            <td>{inv.user_email}</td>
                            <td
                              className={`${
                                inv.user_response && inv.status
                                  ? "text-success"
                                  : inv.user_response === false &&
                                    inv.status === false
                                  ? "text-error"
                                  : ""
                              }`}
                            >
                              {inv.user_response && inv.status
                                ? "Accepted"
                                : inv.user_response === false &&
                                  inv.status === false
                                ? "Declined"
                                : "Pending"}
                            </td>
                            <>
                              <td>
                                <button
                                  className="border btn btn-sm btn-outline hover:btn-error"
                                  title="Delete"
                                  onClick={() => handleDelete(inv.user_id)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-6 h-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </td>
                            </>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6">
                <span>
                  You have no employees invitations or no one has accepted...
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="p-6">
            <span className="loading loading-bars loading-lg"></span>
          </div>
        )}
      </div>
    </div>
  );
}
