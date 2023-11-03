import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUserData } from "../utils/userData";

export default function Navbar() {
  const [user, setUser] = useState();
  const accessToken = localStorage.getItem("access_token");
  const navigate = useNavigate();

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
      setUser("");
    }
  }, [accessToken]);

  const handleSignOut = () => {
    localStorage.removeItem("access_token");
    setUser("");
    navigate("/");
  };

  const handleSignIn = () => {
    navigate("/signin");
  };

  return (
    <nav className="flex flex-row justify-between">
      <div className="self-center">
        <span>{user && user.email}</span>
      </div>

      <div className="dropdown dropdown-end sm:hidden">
        <label tabIndex={0} className="m-1 btn btn-secondary btn-sm">
          Menu
        </label>
        <ul
          tabIndex={0}
          className="dropdown-content gap-y-2 z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 border border-white"
        >
          <button
            className={`btn btn-sm btn-primary ${user ? "block" : "hidden"}`}
            onClick={() => navigate("add-org-form")}
          >
            Add Organization
          </button>
          <button
            className={`btn btn-sm btn-primary ${user ? "block" : "hidden"}`}
            onClick={() => navigate("")}
          >
            Dashboard
          </button>
          <button
            className={`btn ${user ? "btn-secondary" : "btn-primary"} btn-sm`}
            onClick={user ? () => handleSignOut() : () => handleSignIn()}
          >
            {user ? "Sign Out" : "Sign In"}
          </button>
        </ul>
      </div>
      <div className="self-end hidden gap-x-5 sm:flex">
        <button
          className={`btn btn-sm btn-primary ${user ? "block" : "hidden"}`}
          onClick={() => navigate("add-org-form")}
        >
          Add Organization
        </button>
        <button
          className={`btn btn-sm btn-primary ${user ? "block" : "hidden"}`}
          onClick={() => navigate("")}
        >
          Dashboard
        </button>
        <button
          onClick={user ? () => handleSignOut() : () => handleSignIn()}
          className={`btn btn-sm ${user ? "btn-secondary" : "btn-primary"}`}
        >
          {user ? "Sign Out" : "Sign In"}
        </button>
      </div>
    </nav>
  );
}
