import React, { useState, useEffect } from "react";
import {
  acceptInvitation,
  declineInvitation,
  fetchUserData,
  fetchUserInvitations,
  fetchUserOrganizations,
} from "../../utils/userData";
import { useNavigate, Link } from "react-router-dom";

export default function Home() {
  const [user, setUser] = useState();
  const [owner, setOwner] = useState([]);
  const [employee, setEmployee] = useState([]);
  const [invitations, setInvitations] = useState(null);
  const accessToken = localStorage.getItem("access_token");
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate("/signin");
  };

  const handleSignUp = () => {
    navigate("signup");
  };

  const handleAddOrg = async () => {
    navigate("add-org-form");
  };

  const handleAcceptInv = async (orgId) => {
    await acceptInvitation(orgId);
    setInvitations((prevInvitations) =>
      prevInvitations.map((inv) =>
        inv.organization_id === orgId ? { ...inv, isAccepted: true } : inv
      )
    );
  };

  const handleDeclineInv = async (orgId) => {
    await declineInvitation(orgId);
    setInvitations((prevInvitations) =>
      prevInvitations.map((inv) =>
        inv.organization_id === orgId ? { ...inv, isAccepted: false } : inv
      )
    );
  };

  useEffect(() => {
    if (accessToken) {
      const fetchData = async () => {
        const userData = await fetchUserData(accessToken);
        if (userData) {
          setUser(userData);

          const organizationsData = await fetchUserOrganizations(accessToken);
          if (organizationsData) {
            setOwner(organizationsData.organizations_owning);
            setEmployee(organizationsData.organizations_working);
          }
        } else {
          setUser("");
          setOwner([]);
          setEmployee([]);
        }
      };
      fetchData();
    } else {
      setUser("");
      setOwner([]);
      setEmployee([]);
    }
  }, [accessToken]);

  useEffect(() => {
    if (user) {
      if (user.id) {
        const fetchData = async () => {
          const userInvitations = await fetchUserInvitations(user.id);
          if (userInvitations) {
            const invitationsWithFlags = userInvitations.map((inv) => ({
              ...inv,
              isAccepted: null,
            }));
            setInvitations(invitationsWithFlags);
          } else {
            setInvitations([]);
          }
        };
        fetchData();
      }
    }
  }, [user]);

  return (
    <div className="p-14 sm:p-24">
      {user ? (
        <div className="flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-y-2">
            <h1 className="text-xl text-center underline sm:text-3xl">
              Welcome To Your Dashboard
            </h1>
            <span className="text-lg text-center sm:text-2xl">
              {user.email}
            </span>
          </div>

          <div className="flex flex-col items-center w-full mt-10 space-y-5">
            <div className="card w-80 sm:w-full bg-primary text-primary-content">
              <div className="card-body">
                <h2 className="card-title">
                  {owner.length > 0
                    ? "These are the organizations you own:"
                    : "You don't own any organizations"}
                </h2>
                <p>
                  {owner.length > 0
                    ? "Click on the organization button to view them"
                    : "Click on the add button if you wish to add your own organization"}
                </p>
                <div
                  className={`mt-3 card-actions flex ${
                    owner.length === 0 && "justify-center"
                  }`}
                >
                  {owner.length > 0 ? (
                    <>
                      {owner.map((org) => (
                        <Link
                          key={org.id}
                          className="btn"
                          to={`/organization-page/${org.id}`}
                        >
                          {org.name}
                        </Link>
                      ))}
                      <button className="btn" onClick={() => handleAddOrg()}>
                        Add Organization
                      </button>
                    </>
                  ) : (
                    <button className="btn" onClick={() => handleAddOrg()}>
                      Add Organization
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="divider" />

            <div className="card w-80 sm:w-full bg-accent text-accent-content">
              <div className="card-body">
                <h2 className="card-title">
                  {employee.length > 0
                    ? "These are the organizations you work at:"
                    : "You are not employed by any organization"}
                </h2>
                <p>
                  {employee.length > 0
                    ? "Click on the organization button to see their dashboard"
                    : "Try getting to know people and try your best to get invited"}
                </p>
                <div className="mt-3 card-actions">
                  {employee.length > 0 && (
                    <>
                      {employee.map((org) => (
                        <Link
                          key={org.id}
                          className="btn"
                          to={`/organization-page/${org.id}`}
                        >
                          {org.name}
                        </Link>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="py-5 divider" />

          <div className="flex flex-col w-full">
            <h1 className="text-xl text-center underline sm:text-3xl">
              Organization Invitations:
            </h1>
            {invitations ? (
              <>
                {invitations.length > 0 ? (
                  <div className="self-start w-full my-8 overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th></th>
                          <th>Organization Name</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invitations.map((inv, index) => (
                          <React.Fragment key={index}>
                            {inv.user_response === null && (
                              <tr className="hover">
                                <th>{index + 1}</th>
                                <td>{inv.organization_name}</td>
                                <td
                                  className={`${
                                    inv.isAccepted === null
                                      ? ""
                                      : inv.isAccepted
                                      ? "text-success"
                                      : "text-error"
                                  }`}
                                >
                                  {inv.isAccepted === null
                                    ? "Pending"
                                    : inv.isAccepted
                                    ? "Accepted"
                                    : "Declined"}
                                </td>
                                {inv.isAccepted === null ? (
                                  <>
                                    <td>
                                      <button
                                        className="border btn btn-sm btn-outline hover:btn-success"
                                        title="Accept"
                                        onClick={() =>
                                          handleAcceptInv(inv.organization_id)
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
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      </button>
                                    </td>
                                    <td>
                                      <button
                                        className="border btn btn-sm btn-outline hover:btn-error"
                                        title="Decline"
                                        onClick={() =>
                                          handleDeclineInv(inv.organization_id)
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
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                      </button>
                                    </td>
                                  </>
                                ) : null}
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6">
                    <span>No Organization Invitations yet...</span>
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
      ) : (
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-xl text-center underline sm:text-5xl sm:my-10">
            Welcome To The Org Organization
          </h1>
          <h2 className="text-lg text-center sm:text-3xl">
            Sign In or Sign Up to use the features of our website
          </h2>
          <div className="flex flex-col p-5 sm:w-full">
            <button
              className="self-center my-2 btn btn-primary sm:w-3/4"
              onClick={() => handleSignIn()}
            >
              Sign In
            </button>
            <button
              className="self-center my-2 btn btn-secondary sm:w-3/4"
              onClick={() => handleSignUp()}
            >
              Sign Up
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
