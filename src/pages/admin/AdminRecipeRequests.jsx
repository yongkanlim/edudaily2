import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function AdminRecipeRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Pending"); // ✅ default
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("reciperequest")
      .select(`
        requestid,
        title,
        status,
        datesubmitted,
        users (
          userid,
          username,
          profile (
            profilepicture
          )
        )
      `)
      .order("datesubmitted", { ascending: false });

    if (error) {
      console.error("❌ Fetch error:", error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  // ✅ Filter requests by selected status
  const filteredRequests = requests.filter(
    (req) => req.status === statusFilter
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto py-10 px-6">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Manage Recipe Requests
        </h1>

        {/* ✅ Status Filter Tags */}
        <div className="flex gap-3 mb-8">
          {["Pending", "Approved", "Rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition border ${
                statusFilter === status
                  ? status === "Approved"
                    ? "bg-green-600 text-white border-green-600"
                    : status === "Rejected"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-yellow-500 text-white border-yellow-500"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <p className="text-center text-gray-500 mt-10">
            Loading requests...
          </p>
        ) : filteredRequests.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            No {statusFilter.toLowerCase()} requests found.
          </p>
        ) : (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredRequests.map((req) => {
              const profileImage =
                req.users?.profile?.[0]?.profilepicture ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png";

              return (
                <div
                  key={req.requestid}
                  onClick={() =>
                    navigate(`/admin/recipe-request/${req.requestid}`)
                  }
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition cursor-pointer border border-gray-100 p-6"
                >
                  {/* User Info */}
                  <div className="flex items-center gap-4 mb-5">
                    <img
                      src={profileImage}
                      alt="User profile"
                      className="w-14 h-14 rounded-full object-cover border"
                    />
                    <div>
                      <p className="font-semibold text-lg text-gray-800">
                        {req.users?.username || "User"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(req.datesubmitted).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Recipe Title */}
                  <h2 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2">
                    {req.title}
                  </h2>

                  {/* Status Badge */}
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      req.status === "Approved"
                        ? "bg-green-100 text-green-700"
                        : req.status === "Rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
