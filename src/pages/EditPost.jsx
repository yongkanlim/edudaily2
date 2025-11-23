import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../supabaseClient";

export default function EditPost() {
  const { postid } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [post, setPost] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState(["Question"]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch current user & post data
  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);

      const { data: postData, error } = await supabase
        .from("communitypost")
        .select("*")
        .eq("postid", postid)
        .single();

      if (error) {
        alert("Post not found");
        navigate("/community");
        return;
      }

      // Check ownership
      const { data: userData } = await supabase
        .from("users")
        .select("userid")
        .eq("email", session.user.email)
        .single();

      if (userData.userid !== postData.userid) {
        alert("You cannot edit this post");
        navigate("/community");
        return;
      }

      setPost(postData);
      setTitle(postData.title);
      setContent(postData.content);
      setTags(postData.tag ? postData.tag.split(",").map(t => t.trim()) : ["Question"]);
      try {
        const images = typeof postData.imageurl === "string" ? JSON.parse(postData.imageurl) : postData.imageurl || [];
        setImageUrls(Array.isArray(images) ? images : [images]);
      } catch {
        setImageUrls([postData.imageurl]);
      }
      setLoading(false);
    };

    fetchData();
  }, [postid, navigate]);

  if (!user || loading) return null;

  // ✅ Upload multiple images
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
        console.error("Upload error:", uploadError.message);
        alert(`Failed to upload ${file.name}!`);
        continue;
      }

      const { data } = supabase.storage
        .from("post-images")
        .getPublicUrl(fileName);

      uploadedUrls.push(data.publicUrl);
    }

    setImageUrls(prev => [...prev, ...uploadedUrls]);
    setLoading(false);
  };

  // ✅ Update post
  const handleUpdate = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Please fill in title and content");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("communitypost")
      .update({
        title: title.trim(),
        content: content.trim(),
        tag: tags.join(", "),
        imageurl: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
        dateposted: new Date().toISOString(),
      })
      .eq("postid", postid);

    setLoading(false);

    if (error) {
      alert("Failed to update post");
      console.error(error);
    } else {
      alert("Post updated successfully!");
      navigate(`/community`);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-12 gap-8">

        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:block lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">
              Menu
            </h3>
            <ul className="text-sm text-gray-700 space-y-3">
              <li onClick={() => navigate("/community")} className="cursor-pointer hover:text-orange-600">⭐ All Posts</li>
              <li onClick={() => navigate("/your-questions")} className="hover:text-orange-600 cursor-pointer">📝 Your questions</li>
              <li onClick={() => navigate("/your-recipes")} className="hover:text-orange-600 cursor-pointer">🍲 Your recipes</li>
            </ul>
          </div>
        </aside>

        {/* MIDDLE CONTENT */}
        <main className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-md hover:shadow-lg transition">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">✏️ Edit Post</h2>

            <form onSubmit={e => { e.preventDefault(); handleUpdate(); }} className="space-y-5">
              <input
                type="text"
                placeholder="Type a catchy question title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-400 outline-none"
              />

              <textarea
                rows="7"
                placeholder="Describe your question in detail..."
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-400 outline-none resize-none"
              />

              {/* IMAGE PREVIEW */}
              {imageUrls.length > 0 && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="w-full h-48 rounded-md overflow-hidden border bg-gray-100 flex items-center justify-center relative">
                      <img src={url} alt={`Uploaded ${index + 1}`} className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 text-white bg-red-500 px-2 rounded-full text-xs hover:bg-red-600"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* TAG SELECTOR */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {["Question", "Recipe"].map(t => (
                    <div
                      key={t}
                      onClick={() => {
                        setTags(prev =>
                          prev.includes(t) ? prev.filter(tag => tag !== t) : [...prev, t]
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

                  <div
                    onClick={() => setShowTagInput(true)}
                    className="px-3 py-1 rounded-full text-sm cursor-pointer border border-dashed border-gray-400 text-gray-500 hover:bg-gray-100"
                  >
                    + Add Tag
                  </div>
                </div>

                {showTagInput && (
                  <input
                    type="text"
                    autoFocus
                    placeholder="Type new tag & press Enter"
                    className="border border-gray-300 px-3 py-2 rounded-md w-full mb-2 focus:ring-2 focus:ring-orange-400 outline-none"
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        const newTag = e.target.value.trim();
                        if (newTag !== "" && !tags.includes(newTag)) setTags([...tags, newTag]);
                        setShowTagInput(false);
                      }
                    }}
                    onBlur={() => setShowTagInput(false)}
                  />
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((t, index) => (
                    <span key={index} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs flex items-center gap-1">
                      {t}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter(tag => tag !== t))}
                        className="text-orange-600 hover:text-orange-800"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
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
                </div>
                <div className="flex gap-3">
                    <button
                    type="button"
                    onClick={() => navigate("/community")}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                    >
                    Cancel
                    </button>

                    <button
                    type="submit"
                    disabled={loading}
                    className="bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-md hover:bg-orange-700 transition"
                    >
                    {loading ? "Updating..." : "Update Post"}
                    </button>
                </div>
              </div>
            </form>
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-3">📌 Must-read posts</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="hover:text-orange-600 cursor-pointer">✅ Please read rules before you start</li>
              <li className="hover:text-orange-600 cursor-pointer">🌍 Vision & Strategy of EduDaily</li>
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
