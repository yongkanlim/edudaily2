import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";

export default function CreateQuestion() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState([]); // ✅ multiple image URLs
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState(["Question"]); // default tag
  const [showTagInput, setShowTagInput] = useState(false);

  // ✅ Get logged-in user and their UserID
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }

      const { data: userData, error } = await supabase
        .from("users")
        .select("userid")
        .eq("email", session.user.email)
        .single();

      if (!error && userData) {
        setUserId(userData.userid);
      }
    };
    fetchUser();
  }, []);

  // ✅ Upload multiple images to Supabase Storage
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLoading(true);
    const uploadedUrls = [];

    for (const file of files) {
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(fileName, file);

      if (uploadError) {
        console.error("❌ Upload error:", uploadError.message);
        alert(`Failed to upload ${file.name}!`);
        continue;
      }

      const { data } = supabase.storage
        .from("post-images")
        .getPublicUrl(fileName);

      uploadedUrls.push(data.publicUrl);
    }

    setImageUrls((prev) => [...prev, ...uploadedUrls]);
    setLoading(false);

    if (uploadedUrls.length > 0) {
      alert("✅ Images uploaded successfully!");
    }
  };

  // ✅ Publish post (status = Published)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("Please fill in both fields!");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("communitypost").insert([
      {
        userid: userId,
        title: title.trim(),
        content: content.trim(),
        imageurl: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null, // store as JSON array
        tag: tags
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
          .join(", "),

        status: "Published",
      },
    ]);

    setLoading(false);

    if (error) {
      console.error("❌ Error inserting question:", error);
      alert("Failed to post your question!");
    } else {
      alert("✅ Question posted successfully!");
      setTitle("");
      setContent("");
      setImageUrls([]);
    }
  };

  // ✅ Save as Draft (status = Draft)
  const handleSaveDraft = async () => {
    if (!title.trim() && !content.trim()) {
      alert("Please write something before saving as draft!");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("communitypost").insert([
      {
        userid: userId,
        title: title.trim() || "(Untitled Draft)",
        content: content.trim(),
        imageurl: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
        status: "Draft",
      },
    ]);

    setLoading(false);

    if (error) {
      console.error("❌ Draft save error:", error);
      alert("Failed to save draft!");
    } else {
      alert("💾 Draft saved successfully!");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-12 gap-8">
        {/* ===== LEFT SIDEBAR ===== */}
        <aside className="hidden lg:block lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">
              Menu
            </h3>
            <ul className="text-sm text-gray-700 space-y-3">
              <li
                onClick={() => (window.location.hash = "questions")}
                className="flex items-center gap-2 text-orange-600 font-semibold cursor-pointer"
              >
                <span className="text-lg">💬</span> Questions
              </li>
              <li className="hover:text-orange-600 cursor-pointer">🏷 Tags</li>
              <li className="hover:text-orange-600 cursor-pointer">⭐ Ranking</li>
              <li
                onClick={() => (window.location.hash = "recipe")}
                className="hover:text-orange-600 cursor-pointer"
              >
                🍳 Recipe
              </li>
            </ul>
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3 mt-7">
              Personal Navigator
            </h3>
            <ul className="text-sm text-gray-700 space-y-3">
              <li className="hover:text-orange-600 cursor-pointer">📝 Your questions</li>
              <li className="hover:text-orange-600 cursor-pointer">💬 Your answers</li>
              <li className="hover:text-orange-600 cursor-pointer">❤️ Your likes & votes</li>
              <li className="hover:text-orange-600 cursor-pointer">🍲 Your recipes</li>
            </ul>
          </div>
        </aside>

        {/* ===== MIDDLE CONTENT ===== */}
        <main className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-md hover:shadow-lg transition">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
              🧠 Ask a New Question
            </h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title input */}
              <input
                type="text"
                placeholder="Type a catchy question title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-400 outline-none"
              />

              {/* Content textarea */}
              <textarea
                rows="7"
                placeholder="Describe your question in detail..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-400 outline-none resize-none"
              ></textarea>

              {/* ✅ Preview uploaded images */}
              {imageUrls.length > 0 && (
  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
    {imageUrls.map((url, index) => (
      <div
        key={index}
        className="w-full h-48 rounded-md overflow-hidden border bg-gray-100 flex items-center justify-center"
      >
        <img
          src={url}
          alt={`Uploaded ${index + 1}`}
          className="object-cover w-full h-full"
        />
      </div>
    ))}
  </div>
)}

{/* TAG SELECTOR */}
<div>
  <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>

  <div className="flex flex-wrap gap-2 mb-3">
    {/* PRESET TAGS */}
    {["Question", "Recipe"].map((t) => (
      <div
        key={t}
        onClick={() => {
          setTags((prev) =>
            prev.includes(t)
              ? prev.filter((tag) => tag !== t)
              : [...prev, t]
          );
        }}
        className={`px-3 py-1 rounded-full text-sm cursor-pointer border transition ${
          tags.includes(t)
            ? "bg-orange-600 text-white border-orange-600"
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
        }`}
      >
        {t}
      </div>
    ))}

    {/* ADD NEW TAG BUTTON */}
    <div
      onClick={() => setShowTagInput(true)}
      className="px-3 py-1 rounded-full text-sm cursor-pointer border border-dashed border-gray-400 text-gray-500 hover:bg-gray-100"
    >
      + Add Tag
    </div>
  </div>

  {/* NEW TAG INPUT BOX */}
  {showTagInput && (
    <input
      type="text"
      autoFocus
      placeholder="Type new tag & press Enter"
      className="border border-gray-300 px-3 py-2 rounded-md w-full mb-2 focus:ring-2 focus:ring-orange-400 outline-none"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const newTag = e.target.value.trim();
          if (newTag !== "" && !tags.includes(newTag)) {
            setTags([...tags, newTag]);
          }
          setShowTagInput(false);
        }
      }}
      onBlur={() => setShowTagInput(false)}
    />
  )}

  {/* DISPLAY SELECTED TAGS */}
  <div className="flex flex-wrap gap-2 mt-2">
    {tags.map((t, index) => (
      <span
        key={index}
        className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs flex items-center gap-1"
      >
        {t}
        <button
          type="button"
          onClick={() => setTags(tags.filter((tag) => tag !== t))}
          className="text-orange-600 hover:text-orange-800"
        >
          ✕
        </button>
      </span>
    ))}
  </div>
</div>




              {/* Action buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* ✅ Add multiple images */}
                  <label className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition cursor-pointer">
                    📷 Add Images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {/* ✅ Save Draft */}
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={loading}
                    className="bg-gray-100 text-gray-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition"
                  >
                    💾 Save as Draft
                  </button>
                </div>

                {/* ✅ Publish */}
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-md hover:bg-orange-700 transition"
                >
                  {loading ? "Posting..." : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </main>

        {/* ===== RIGHT SIDEBAR ===== */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-3">📌 Must-read posts</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="hover:text-orange-600 cursor-pointer">
                ✅ Please read rules before you start
              </li>
              <li className="hover:text-orange-600 cursor-pointer">
                🌍 Vision & Strategy of EduDaily
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-3">🔗 Featured Links</h4>
            <ul className="text-sm text-orange-600 space-y-2">
              <li className="hover:underline cursor-pointer">EduDaily Recipe</li>
              <li className="hover:underline cursor-pointer">EduDaily Ingredient Info</li>
              <li className="hover:underline cursor-pointer">EduDaily Homepage</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
