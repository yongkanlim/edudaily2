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

    const { data: publicUrl } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    setProfile({ ...profile, profilepicture: publicUrl.publicUrl });
    setImagePreview(publicUrl.publicUrl);
  };

  // ✅ Handle save/update (fixed for Supabase NOT NULL columns)
const handleSave = async () => {
  if (!profile) return;
  setSaving(true);

  // Ensure all required fields have valid default values (NOT NULL-safe)
  const updates = {
    gender: profile.gender?.trim() || "Not specified",
    age: profile.age ? parseInt(profile.age) : 0,
    country: profile.country?.trim() || "Not specified",
    profilepicture:
      profile.profilepicture ||
      "https://cdn-icons-png.flaticon.com/512/847/847969.png",
    updateprofiledate: new Date(),
  };

  // ✅ Perform the update
  const { error } = await supabase
    .from("profile")
    .update(updates)
    .eq("userid", profile.userid);

  if (error) {
    alert("❌ Failed to update profile!");
    console.error(error);
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
          disabled
          className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-gray-700"
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
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 12H8m8 0a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <div>
          <p className="text-gray-700 font-medium">{profile.email}</p>
          <p className="text-gray-400 text-sm">1 month ago</p>
        </div>
      </div>

      <button className="mt-4 text-orange-600 text-sm border border-orange-600 px-3 py-1.5 rounded-md hover:bg-orange-50 transition">
        + Edit Email Address
      </button>
    </div>
  </div>
</div>

    </div>
  );
}
