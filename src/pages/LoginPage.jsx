import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
  e.preventDefault();
  setError("");

  // 🔐 Login using Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("❌ Login failed:", error.message);
    setError("Wrong email or password!");
  } else {
    console.log("✅ Login successful:", data);
    alert("✅ Login successful!");

// ✅ Save user info in localStorage
localStorage.setItem("user", JSON.stringify(data.user));

// ✅ Get the corresponding user from Users table
const { data: userRow } = await supabase
  .from("users")
  .select("userid")
  .eq("email", data.user.email)
  .single();


// ✅ Redirect to Community page
window.location.href = "/community";

  }
};

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
        {/* Left Side - Login Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-10 md:px-16 lg:px-24">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            We’ve Missed You!
          </h2>
          <p className="text-gray-600 mb-8">
            More than <span className="font-semibold">150 questions</span> are
            waiting for your wise suggestions!
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <input
                type="text"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  email ? "border-green-500" : "border-gray-300"
                }`}
                required
              />
            </div>

            {/* Password */}
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  error ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {error && (
                <p className="text-sm text-red-500 mt-1">{error}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-orange-600 text-white py-2 rounded-md font-semibold hover:bg-orange-700 transition-all"
            >
              Login
            </button>
          </form>
        </div>

        {/* Right Side - Image */}
        <div className="hidden md:block w-1/2">
          <img
            src="https://dsdzj7o2hjmpp.cloudfront.net/wp-content/uploads/2023/01/14213313/shutterstock_1667441644-smaller.jpg?auto=format&fit=crop&w=1470&q=80"
            alt="People eating together"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
