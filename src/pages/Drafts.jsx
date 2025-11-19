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
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">📝 Your Drafts</h2>

        {drafts.length > 0 ? (
          drafts.map((draft) => {
            // ✅ Parse images from JSON or handle single URL
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

                {/* ✅ Display draft images */}
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
      </div>
    </div>
  );
}
