import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_PATH}/signup`,
        {
          email,
          password,
        }
      );
      console.log(response.data.message);
      navigate("/signin");
    } catch (err) {
      console.error("Sign Up failed! ->", err.message);
    }
  };

  return (
    <div className="p-14">
      <div className="flex flex-col items-center h-full gap-5 text-xl sm:text-3xl">
        <h2 className="font-bold">Sign Up</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-1 sm:w-3/4">
          <input
            type="email"
            placeholder="Email"
            name="email"
            className="font-semibold text-black input bg-slate-200"
          />
          <div className="divider" />
          <input
            type="password"
            placeholder="Password"
            name="password"
            className="font-semibold text-black input bg-slate-200"
          />
          <button
            type="submit"
            className="self-center w-full mt-5 btn btn-primary sm:w-3/4"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
