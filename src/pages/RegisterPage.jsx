import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../supabaseClient"; // ✅ add this import

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate(); // ✅ redirect after register

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
  e.preventDefault();
  setError("");

  // ✅ Simple validation
  if (formData.password !== formData.confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  try {
    // ✅ Step 1: Register user with Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (signUpError) throw signUpError;

    const userId = data.user?.id;

    // ✅ Step 2: Add user to your Users table (with default role "Customer")
    const { data: usersData, error: dbError } = await supabase.from("users").insert([
      {
        username: formData.username,
        email: formData.email,
        role: "Customer",
      },
    ]).select(); // select() so we can get userid if needed

    if (dbError) throw dbError;

    // ✅ Step 3: Insert empty profile immediately
    const userRow = usersData[0]; // inserted user row
    if (userRow) {
      await supabase.from("profile").insert([
        {
          userid: userRow.userid,
          gender: 'Not specified',
          age: 0,
          country: 'Not specified',
          profilepicture: null,
        },
      ]);
    }

    alert("✅ Registration successful! Please verify your email.");
    navigate("/login");
  } catch (err) {
    console.error("❌ Registration error:", err.message);
    setError(err.message);
  }
}


  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="flex flex-col md:flex-row h-[calc(100vh-80px)]">
        {/* Left Form Section */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-8 md:px-16 bg-white">
          <div className="max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Join <span className="text-orange-600">EduDaily</span> Community
            </h2>
            <p className="text-gray-600 mb-6">
              Share recipes, ask questions, and connect with fellow food lovers.
            </p>

            {error && <p className="text-red-500 mb-3">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  name="username"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Repeat Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 text-white font-semibold py-2 rounded-md hover:bg-orange-700 transition"
              >
                REGISTER
              </button>
            </form>

            <p className="text-sm text-gray-600 mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-orange-600 hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>

        {/* Right Image Section */}
        <div className="w-full md:w-1/2 hidden md:block">
          <img
            src="https://unefilleordinaire.net/wp-content/uploads/2022/06/Image3.jpg"
            alt="Community"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
