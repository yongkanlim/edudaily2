import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import Navbar from "../../components/Navbar";
import { useParams, useNavigate } from "react-router-dom";

export default function AdminRecipeRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequest();
  }, []);

  const fetchRequest = async () => {
    const { data, error } = await supabase
      .from("reciperequest")
      .select(`
        requestid,
        title,
        description,
        ingredientstext,
        instructions,
        dietarycategory,
        cuisinetype,
        allergies,
        goal,
        estimatedtime,
        status,
        imageurl,
        videourl,
        datesubmitted,
        users (
          userid,
          username,
          profile (
            profilepicture
          )
        )
      `)
      .eq("requestid", id)
      .single();

    if (error) {
      console.error("❌ Fetch error:", error);
      setRequest(null);
    } else {
      setRequest(data);
    }
    setLoading(false);
  };

  const handleAction = async (action) => {
    let status;
    if (action === "approve") status = "Approved";
    else if (action === "cancel") status = "Rejected";
    else return;

    const { error } = await supabase
        .from("reciperequest")
        .update({ status })
        .eq("requestid", id);

    if (error) {
        console.error("Update error:", error);
        alert("Failed to update request!");
    } else {
        alert(`Request ${status.toLowerCase()} successfully!`);
        navigate("/admin/recipe-requests");
    }
    };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!request) return <p className="text-center mt-10">Request not found.</p>;

  const profileImage =
    request.users?.profile?.[0]?.profilepicture ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  // Parse instructions into steps with optional images
  const parsedInstructions = request.instructions
    ? request.instructions.split("\n").map((line) => {
        // Extract image if exists in <img src="..."/>
        const imgMatch = line.match(/<img src="([^"]+)" \/>/);
        const text = line.replace(/<img src="[^"]+" \/>/, "").trim();
        return { text, image: imgMatch ? imgMatch[1] : null };
      })
    : [];

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />

      <div className="max-w-5xl mx-auto py-10 px-6">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-6">{request.title}</h1>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <img
              src={profileImage}
              alt="User"
              className="w-14 h-14 rounded-full object-cover border"
            />
            <div>
              <p className="font-semibold text-lg text-gray-800">
                {request.users?.username || "User"}
              </p>
              <p className="text-sm text-gray-500">
                Submitted on {new Date(request.datesubmitted).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Status */}
          <span
            className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
              request.status === "Approved"
                ? "bg-green-100 text-green-700"
                : request.status === "Cancelled"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {request.status}
          </span>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">Description</h3>
            <p className="text-gray-700">{request.description}</p>
          </div>

          {/* Ingredients */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">Ingredients</h3>
            <pre className="bg-gray-100 p-3 rounded-md text-sm whitespace-pre-wrap">
              {request.ingredientstext}
            </pre>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Instructions</h3>
            <div className="space-y-4">
              {parsedInstructions.map((inst, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded-md border">
                  <p className="mb-2">{inst.text}</p>
                  {inst.image && (
                    <img
                      src={inst.image}
                      alt={`Step ${idx + 1}`}
                      className="w-full max-h-96 object-contain rounded-md border"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Extra Info */}
          <div className="grid md:grid-cols-2 gap-4">
            {request.estimatedtime && (
              <div>
                <h4 className="font-semibold">Estimated Time</h4>
                <p>{request.estimatedtime} minutes</p>
              </div>
            )}
            {request.dietarycategory && (
              <div>
                <h4 className="font-semibold">Dietary Category</h4>
                <p>{request.dietarycategory}</p>
              </div>
            )}
            {request.cuisinetype && (
              <div>
                <h4 className="font-semibold">Cuisine Type</h4>
                <p>{request.cuisinetype}</p>
              </div>
            )}
            {request.allergies && (
              <div>
                <h4 className="font-semibold">Allergies</h4>
                <p>{request.allergies}</p>
              </div>
            )}
            {request.goal && (
              <div>
                <h4 className="font-semibold">Goal</h4>
                <p>{request.goal}</p>
              </div>
            )}
          </div>

          {/* Recipe Image */}
          {request.imageurl && (
            <div>
              <h3 className="font-semibold mb-2">Recipe Image</h3>
              <img
                src={request.imageurl}
                alt="Recipe"
                className="w-full max-h-96 object-contain rounded-md border"
              />
            </div>
          )}

          {/* Video Preview */}
          {request.videourl && (
            <div>
                <h3 className="font-semibold mb-2">Video</h3>
                <div className="aspect-w-16 aspect-h-9">
                    <iframe
                    src={request.videourl.replace("watch?v=", "embed/")}
                    title="Recipe Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-64 md:h-96 rounded-md"
                    ></iframe>
                </div>
                </div>
          )}
        </div>

        {/* Actions */}
        {request.status === "Pending" && (
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => handleAction("approve")}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              Approve
            </button>

            <button
              onClick={() => handleAction("cancel")}
              className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
