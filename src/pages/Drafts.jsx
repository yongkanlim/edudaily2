import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../supabaseClient";

export default function Drafts() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    const fetchDrafts = async () => {
      // ✅ Get Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // ✅ Map email to integer UserID
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("userid")
        .eq("email", session.user.email)
        .single();

      if (userError || !userRow) {
        console.error("❌ User not found:", userError);
        return;
      }

      setUser(userRow);

      // ✅ Fetch drafts
      const { data: draftData, error } = await supabase
        .from("communitypost")
        .select("postid, title, content, imageurl, dateposted, status")
        .eq("status", "Draft")
        .eq("userid", userRow.userid)
        .order("dateposted", { ascending: false });

      if (error) {
        console.error("❌ Error fetching drafts:", error);
        return;
      }

      setDrafts(draftData);
    };

    fetchDrafts();
  }, [navigate]);

  if (!user) return null;

  return (
  <div className="bg-white min-h-screen">
    <Navbar />

    <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-12 gap-8">

      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="hidden lg:block lg:col-span-2">
        <div className="sticky top-24 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6">

            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">
              Menu
            </h3>
           <ul className="text-sm text-gray-700 space-y-3">

  {/* QUESTIONS */}
  <li
    onClick={() => {
      navigate("/community");          // go back to community page
      window.location.hash = "questions";
      setFilterTag("Question");        // your existing filter behavior
    }}
    className="flex items-center gap-2 hover:text-orange-600 cursor-pointer"
  >
    <span className="text-lg">💬</span> Questions
  </li>

  {/* TAGS */}
  <li
    onClick={() => {
      navigate("/community");
      window.location.hash = "tags";
      setShowAllTags(!showAllTags);
    }}
    className="hover:text-orange-600 cursor-pointer"
  >
    🏷 Tags
  </li>

  {/* RECIPE */}
  <li
    onClick={() => {
      navigate("/community");
      window.location.hash = "recipe";
      setFilterTag("Recipe");
    }}
    className="hover:text-orange-600 cursor-pointer"
  >
    🍳 Recipe
  </li>

  {/* ALL POSTS */}
  <li
    onClick={() => {
      navigate("/community");
      window.location.hash = "all";
      setFilterTag(null);
    }}
    className="hover:text-orange-600 cursor-pointer"
  >
    ⭐ All Posts
  </li>

</ul>


            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3 mt-7">
              Personal Navigator
            </h3>
            <ul className="text-sm text-gray-700 space-y-3">
                <li onClick={() => navigate("/your-questions")} className="hover:text-orange-600 cursor-pointer">
                  📝 Your questions
                </li>
                <li onClick={() => navigate("/your-answers")} className="hover:text-orange-600 cursor-pointer">
                  💬 Your answers
                </li>
                <li onClick={() => navigate("/your-likes")} className="hover:text-orange-600 cursor-pointer">
                  ❤️ Your likes
                </li>
                <li onClick={() => navigate("/your-recipes")} className="hover:text-orange-600 cursor-pointer">
                  🍲 Your recipes
                </li>
                <li
                    onClick={() => navigate("/drafts")}
                    className="hover:text-orange-600 cursor-pointer font-semibold text-orange-600"
                  >
                    📝 My Drafts
                  </li>

              </ul>

          </div>
        </div>
      </aside>

      {/* ================= MIDDLE CONTENT (YOUR ORIGINAL CODE) ================= */}
      <main className="lg:col-span-7 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">📝 Your Drafts</h2>

        {drafts.length > 0 ? (
          drafts.map((draft) => {
            let images = [];
            try {
              if (draft.imageurl) {
                if (typeof draft.imageurl === "string") {
                  images = JSON.parse(draft.imageurl);
                  if (!Array.isArray(images)) images = [draft.imageurl];
                } else if (Array.isArray(draft.imageurl)) {
                  images = draft.imageurl;
                }
              }
            } catch {
              images = [draft.imageurl];
            }

            return (
              <div
                key={draft.postid}
                onClick={() => navigate(`/community/edit/${draft.postid}`)}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <h3 className="font-semibold text-gray-900 mb-1 text-lg">
                  {draft.title}
                </h3>
                <p className="text-gray-600 text-sm mb-2">{draft.content}</p>
                <p className="text-xs text-gray-400 mb-3">
                  {new Date(draft.dateposted).toLocaleString()}
                </p>

                {images.length > 0 && (
                  <div
                    className={`grid gap-3 mb-3 ${
                      images.length === 1
                        ? "grid-cols-1"
                        : images.length === 2
                        ? "grid-cols-2"
                        : "grid-cols-3"
                    }`}
                  >
                    {images.map((img, index) => (
                      <div
                        key={index}
                        className="w-full h-48 rounded-md overflow-hidden border bg-gray-100 flex items-center justify-center"
                      >
                        <img
                          src={img}
                          alt={`Draft Image ${index + 1}`}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-gray-500">You have no drafts.</p>
        )}
      </main>

      {/* ================= RIGHT SIDEBAR ================= */}
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
