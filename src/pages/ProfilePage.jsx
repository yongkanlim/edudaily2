import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // ✅ Load profile info from Supabase
  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      const user = session.user;

      // Get data from both tables (Users + Profile)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", user.email)
        .single();

      const { data: profileData, error: profileError } = await supabase
        .from("profile")
        .select("*")
        .eq("userid", userData.userid)
        .single();

      if (userError || profileError) {
        console.error("❌ Error fetching profile:", userError || profileError);
      } else {
        setProfile({
          ...userData,
          ...profileData,
        });
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  // ✅ Handle input change
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  // ✅ Handle profile picture upload
const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const filePath = `profiles/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from("images")
    .upload(filePath, file);

  if (error) {
    console.error("❌ Upload failed:", error.message);
    return;
  }

  const { data: publicUrlData, error: urlError } = await supabase.storage
    .from("images")
    .getPublicUrl(filePath);

  if (urlError) {
    console.error("❌ Failed to get public URL:", urlError.message);
    return;
  }

  setProfile({ ...profile, profilepicture: publicUrlData.publicUrl });
  setImagePreview(publicUrlData.publicUrl);
};

// Save profile
const handleSave = async () => {
  if (!profile) return;
  setSaving(true);

  const profileUpdates = {
    gender: profile.gender?.trim() || "Not specified",
    age: profile.age ? parseInt(profile.age) : 0,
    country: profile.country?.trim() || "Not specified",
    profilepicture:
      profile.profilepicture ||
      "https://cdn-icons-png.flaticon.com/512/847/847969.png",
  };

  const userId = profile.userid; // ensure userid exists
  if (!userId) {
    alert("❌ User ID missing!");
    setSaving(false);
    return;
  }

  // Update profile
  const { error: profileError } = await supabase
    .from("profile")
    .update(profileUpdates)
    .eq("userid", userId);

  // Update username in users table
  const { error: userError } = await supabase
    .from("users")
    .update({ username: profile.username?.trim() || "Full Name" })
    .eq("userid", userId);

  if (profileError || userError) {
    alert("❌ Failed to update profile!");
    console.error(profileError || userError);
  } else {
    alert("✅ Profile updated successfully!");
  }

  setSaving(false);
};



  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-5xl mx-auto mt-10">
  {/* Profile Container */}
  <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
    {/* Top Section - Profile Picture + Name */}
    <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
      {/* Profile Image */}
      <div className="flex flex-col items-center">
        <img
          src={
            imagePreview ||
            profile.profilepicture ||
            "https://cdn-icons-png.flaticon.com/512/847/847969.png"
          }
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
        />
        <label className="mt-3 bg-orange-600 text-white text-sm px-3 py-1.5 rounded cursor-pointer hover:bg-orange-700 transition">
          Change Picture
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Name + Email */}
      <div className="text-center md:text-left flex-1">
        <h2 className="text-2xl font-semibold text-gray-800">
          {profile.username || "Full Name"}
        </h2>
        <p className="text-gray-500 text-sm">{profile.email}</p>
      </div>

      {/* Edit Button */}
      <div className="mt-4 md:mt-0">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 transition font-medium"
        >
          {saving ? "Saving..." : "Edit"}
        </button>
      </div>
    </div>

    {/* Divider Line */}
    <hr className="border-gray-200 mb-8" />

    {/* Form Fields */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-gray-600 text-sm mb-1">Full Name</label>
        <input
          type="text"
          value={profile.username || ""}
          name="username"
          onChange={handleChange}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-gray-700"
        />
      </div>

      <div>
        <label className="block text-gray-600 text-sm mb-1">Age</label>
        <input
          type="number"
          name="age"
          value={profile.age || ""}
          onChange={handleChange}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-gray-700"
        />
      </div>

      <div>
        <label className="block text-gray-600 text-sm mb-1">Gender</label>
        <select
          name="gender"
          value={profile.gender || ""}
          onChange={handleChange}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-gray-700"
        >
          <option value="">Select gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>

      <div>
        <label className="block text-gray-600 text-sm mb-1">Country</label>
        <input
          type="text"
          name="country"
          value={profile.country || ""}
          onChange={handleChange}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-gray-700"
        />
      </div>
    </div>

    {/* Email Address Section */}
    <div className="mt-10">
      <h3 className="text-gray-800 font-semibold mb-3">My Email Address</h3>
      <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-lg px-4 py-3">
        <div className="bg-orange-100 p-2 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-orange-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
            />
          </svg>
        </div>
        <div>
          <p className="text-gray-700 font-medium">{profile.email}</p>
          <p className="text-gray-400 text-sm">1 month ago</p>
        </div>
      </div>

{/* Role Section */}
<div className="mt-6">
  <h3 className="text-gray-800 font-semibold mb-2">Role</h3>
  <div
    onClick={async () => {
      const secureWord = prompt(
        "Enter secure word to change role:\n- Admin secure word\n- Customer secure word"
      );
      if (!secureWord) return;

      let newRole = null;
      if (secureWord === "admin") newRole = "Admin";
      else if (secureWord === "customer") newRole = "Customer";
      else {
        alert("❌ Incorrect secure word!");
        return;
      }

      try {
        const { error } = await supabase
          .from("users")
          .update({ role: newRole })
          .eq("userid", profile.userid);

        if (error) {
          alert("❌ Failed to update role!");
          console.error(error);
        } else {
          setProfile({ ...profile, role: newRole });
          alert(`✅ Role updated to ${newRole}!`);
        }
      } catch (err) {
        console.error(err);
        alert("❌ Error updating role!");
      }
    }}
    className="flex items-center gap-3 cursor-pointer bg-orange-50 border border-orange-100 rounded-lg px-4 py-3 hover:bg-orange-100 transition"
  >
    <div className="bg-orange-100 p-2 rounded-full">
      {profile.role === "Admin" ? (
        // Admin icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="h-5 w-5 text-orange-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
          />
        </svg>
      ) : (
        // Customer icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="h-5 w-5 text-orange-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
      )}
    </div>
    <div>
      <p className="text-gray-700 font-medium">{profile.role || "Customer"}</p>
      <p className="text-gray-400 text-sm">
        Click to change (requires secure word)
      </p>
    </div>
  </div>
</div>


      {/* <button className="mt-4 text-orange-600 text-sm border border-orange-600 px-3 py-1.5 rounded-md hover:bg-orange-50 transition">
        + Edit Email Address
      </button> */}
    </div>
  </div>
</div>

    </div>
  );
}
