import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Invalid or expired reset link.");
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!password || !confirmPassword) {
      setError("Please enter all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    const { data, error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError("Failed to reset password. Try again.");
      console.error(error);
    } else {
      setMessage("✅ Password reset successfully! You can now login.");
      setPassword("");
      setConfirmPassword("");
    }
  };

  if (loading) return <div className="min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
        <div className="w-full md:w-1/2 flex flex-col justify-center px-10 md:px-16 lg:px-24">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Reset Your Password
          </h2>
          <p className="text-gray-600 mb-8">
            Enter a new password to secure your account.
          </p>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  error ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  error ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 text-white py-2 rounded-md font-semibold hover:bg-orange-700 transition-all"
            >
              Reset Password
            </button>

            {message && <p className="text-sm text-green-600 mt-2">{message}</p>}
          </form>
        </div>

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
