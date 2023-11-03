import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddOrgForm() {
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState("");
  const [coOwners, setCoOwners] = useState("");
  const accessToken = localStorage.getItem("access_token");

  const handleAddOrganization = async (e) => {
    e.preventDefault();

    const owners = coOwners.split(",").map((email) => email.trim());

    const data = {
      name: orgName,
      owners,
    };

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_PATH}/organizations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (response.status === 201) {
        console.log("Organization added successfully");
        navigate("/");
      } else {
        console.error("Failed to add organization");
      }
    } catch (error) {
      console.error("API request failed", error);
    }
  };

  return (
    <div className="p-14">
      <div className="flex flex-col items-center h-full gap-5 text-2xl sm:text-3xl">
        <h2 className="font-bold text-center">Add an Organization</h2>
        <form
          onSubmit={handleAddOrganization}
          className="flex flex-col items-center gap-5 sm:w-3/4"
        >
          <label>Organization Name:</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
            className="w-full font-semibold text-black input bg-slate-200"
          />
          <label>Co-Owners (comma-separated emails):</label>
          <input
            type="text"
            value={coOwners}
            onChange={(e) => setCoOwners(e.target.value)}
            className="w-full font-semibold text-black input bg-slate-200"
          />
          <button type="submit" className="btn btn-primary btn-lg">
            Add Organization
          </button>
        </form>
      </div>
    </div>
  );
}
