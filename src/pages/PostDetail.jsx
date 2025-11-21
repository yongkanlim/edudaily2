import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../supabaseClient";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [newSuggestion, setNewSuggestion] = useState("");
  const [replyBoxes, setReplyBoxes] = useState({}); 
  const [replyText, setReplyText] = useState({});
  const [replies, setReplies] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [userLikes, setUserLikes] = useState({});

  // ✅ Fetch post + user info + profile
  const fetchPostDetail = async () => {
    const { data: postData, error } = await supabase
      .from("communitypost")
      .select("postid, title, content, imageurl, dateposted, userid")
      .eq("postid", id)
      .single();

    if (error) {
      console.error("❌ Error fetching post:", error);
      return;
    }

    const { data: userData } = await supabase
      .from("users")
      .select("username")
      .eq("userid", postData.userid)
      .single();

    const { data: profileData } = await supabase
      .from("profile")
      .select("profilepicture")
      .eq("userid", postData.userid)
      .single();

    setPost({
      ...postData,
      username: userData?.username || "Anonymous",
      profilepicture:
        profileData?.profilepicture ||
        "https://cdn-icons-png.flaticon.com/512/847/847969.png",
    });
  };

 // ✅ Fetch suggestions with username + profile picture correctly
const fetchSuggestions = async () => {
  const { data: suggestionsData, error: suggestionsError } = await supabase
    .from("suggestions")
    .select("suggestionid, postid, userid, content, datesuggested")
    .eq("postid", id)
    .order("datesuggested", { ascending: true });

  if (suggestionsError) {
    console.error("❌ Error fetching suggestions:", suggestionsError);
    return;
  }

  if (!suggestionsData || suggestionsData.length === 0) {
    setSuggestions([]);
    return;
  }

  // ✅ Get all unique user IDs from suggestions
  const userIds = [...new Set(suggestionsData.map((s) => s.userid))];

  // ✅ Fetch usernames from users table (REAL column names)
  const { data: usersData, error: usersError } = await supabase
    .from("users")
    .select("userid, username")
    .in("userid", userIds);

  if (usersError) {
    console.error("❌ Error fetching users:", usersError);
  }

  // ✅ Fetch profile pictures from profile table (REAL column names)
  const { data: profilesData, error: profilesError } = await supabase
    .from("profile")
    .select("userid, profilepicture")
    .in("userid", userIds);

  if (profilesError) {
    console.error("❌ Error fetching profiles:", profilesError);
  }

  // ✅ Merge user + profile with suggestions
  const combined = suggestionsData.map((s) => {
    const user = usersData?.find((u) => u.userid === s.userid);
    const profile = profilesData?.find((p) => p.userid === s.userid);
    return {
      ...s,
      username: user?.username || "Anonymous",
      profilepicture:
        profile?.profilepicture ||
        "https://cdn-icons-png.flaticon.com/512/847/847969.png",
    };
  });

  console.log("✅ Combined suggestions (final):", combined);
  setSuggestions(combined);

  // --- Comment counts from suggestion_replies ---
const { data: repliesData } = await supabase
  .from("suggestion_replies")
  .select("suggestionid");

const groupedComments = {};
repliesData?.forEach((r) => {
  if (!groupedComments[r.suggestionid]) groupedComments[r.suggestionid] = 0;
  groupedComments[r.suggestionid]++;
});
setCommentCounts(groupedComments);

// --- Like counts from suggestion_likes table ---
const { data: likesData } = await supabase
  .from("suggestion_likes")
  .select("suggestionid, userid"); // ✅ add userid

const groupedLikes = {};
likesData?.forEach((l) => {
  if (!groupedLikes[l.suggestionid]) groupedLikes[l.suggestionid] = 0;
  groupedLikes[l.suggestionid]++;
});
setLikeCounts(groupedLikes);

// Determine which suggestions the current user has liked
const authUser = JSON.parse(localStorage.getItem("user"));
let currentUserId = null;
if (authUser?.email) {
  const { data: userRow } = await supabase
    .from("users")
    .select("userid")
    .eq("email", authUser.email)
    .single();
  currentUserId = userRow?.userid;
}

const likesByUser = {};
likesData?.forEach((l) => {
  if (l.userid === currentUserId) likesByUser[l.suggestionid] = true;
});
setUserLikes(likesByUser);

};

const fetchReplies = async () => {
  const { data, error } = await supabase
    .from("suggestion_replies")
    .select("replyid, suggestionid, userid, content, datereplied")
    .in(
      "suggestionid",
      suggestions.map((s) => s.suggestionid)
    )
    .order("datereplied", { ascending: true });

  if (error) {
    console.error("❌ Error fetching replies:", error);
    return;
  }

  if (!data || data.length === 0) {
    setReplies({});
    return;
  }

  // extract unique userids
  const replyUserIds = [...new Set(data.map((r) => r.userid))];

  // fetch usernames
  const { data: usersData } = await supabase
    .from("users")
    .select("userid, username")
    .in("userid", replyUserIds);

  // fetch profile pics
  const { data: profilesData } = await supabase
    .from("profile")
    .select("userid, profilepicture")
    .in("userid", replyUserIds);

  const merged = data.map((r) => {
    const user = usersData?.find((u) => u.userid === r.userid);
    const profile = profilesData?.find((p) => p.userid === r.userid);
    return {
      ...r,
      username: user?.username || "Anonymous",
      profilepicture:
        profile?.profilepicture ||
        "https://cdn-icons-png.flaticon.com/512/847/847969.png",
    };
  });

  // group replies by suggestionid
  const grouped = {};
  merged.forEach((r) => {
    if (!grouped[r.suggestionid]) grouped[r.suggestionid] = [];
    grouped[r.suggestionid].push(r);
  });

  setReplies(grouped);
};


    // ✅ Add new suggestion (fixed to always use correct integer userid)
  const handleAddSuggestion = async () => {
    if (!newSuggestion.trim()) return;

    // 🔍 Get Supabase Auth user from localStorage
    const authUser = JSON.parse(localStorage.getItem("user"));
    if (!authUser || !authUser.email) {
      alert("Please log in first.");
      return;
    }

    console.log("👤 Auth user from localStorage:", authUser);

    // 🔍 Fetch integer userid from users table using the auth email
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("userid")
      .eq("email", authUser.email)
      .single();

    if (userError || !userRow) {
      console.error("❌ User not found in 'users' table:", userError);
      alert("User not found in database. Please register again.");
      return;
    }

    console.log("✅ Matched userRow:", userRow);

    // ✅ Now insert suggestion with correct integer userid
    const { error } = await supabase.from("suggestions").insert([
      {
        postid: Number(id),
        userid: Number(userRow.userid),
        content: newSuggestion.trim(),
        datesuggested: new Date(),
      },
    ]);

    if (error) {
      console.error("❌ Suggestion insert error:", error);
      alert("Failed to add suggestion. Check console.");
      return;
    }

    console.log("✅ Suggestion successfully added!");
    setNewSuggestion("");
    fetchSuggestions();
  };

  const handleAddReply = async (suggestionid) => {
  const text = replyText[suggestionid];
  if (!text || !text.trim()) return;

  const authUser = JSON.parse(localStorage.getItem("user"));
  if (!authUser?.email) {
    alert("Please log in first");
    return;
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("userid")
    .eq("email", authUser.email)
    .single();

  if (!userRow) {
    alert("User not found");
    return;
  }

  await supabase.from("suggestion_replies").insert([
    {
      suggestionid,
      userid: Number(userRow.userid),
      content: text.trim(),
    },
  ]);

  // refresh replies
  setReplyText({ ...replyText, [suggestionid]: "" });
  setReplyBoxes({ ...replyBoxes, [suggestionid]: false });
  fetchReplies();
};

const handleToggleLike = async (suggestionid) => {
  const authUser = JSON.parse(localStorage.getItem("user"));
  if (!authUser?.email) {
    alert("Please log in first");
    return;
  }

  // Get the current user's userid
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("userid")
    .eq("email", authUser.email)
    .single();

  if (userError || !userRow) {
    alert("User not found");
    return;
  }

  const userid = userRow.userid;

  // Check if the user already liked this suggestion
  const { data: existingLike } = await supabase
    .from("suggestion_likes")
    .select("likeid")
    .eq("suggestionid", suggestionid)
    .eq("userid", userid)
    .single();

  if (existingLike) {
    // User already liked → remove like
    const { error } = await supabase
      .from("suggestion_likes")
      .delete()
      .eq("likeid", existingLike.likeid);

    if (error) {
      console.error("❌ Error removing like:", error);
      return;
    }
  } else {
    // User hasn't liked → add like
    const { error } = await supabase.from("suggestion_likes").insert([
      {
        suggestionid,
        userid,
        dateliked: new Date(),
      },
    ]);

    if (error) {
      console.error("❌ Error adding like:", error);
      return;
    }
  }

  // Refresh like counts
  const { data: likesData } = await supabase.from("suggestion_likes").select("suggestionid");
  const groupedLikes = {};
  likesData?.forEach((l) => {
    if (!groupedLikes[l.suggestionid]) groupedLikes[l.suggestionid] = 0;
    groupedLikes[l.suggestionid]++;
  });
  setLikeCounts(groupedLikes);

  setUserLikes({
  ...userLikes,
  [suggestionid]: !userLikes[suggestionid],
});

};


 useEffect(() => {
  fetchPostDetail();
  const load = async () => {
    await fetchSuggestions();
    if (suggestions.length > 0) {
      await fetchReplies();
    }
  };
  load();
}, [id, suggestions.length]);



  if (!post)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* ===== POST HEADER ===== */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-orange-600 mb-4 hover:underline"
        >
          ← Back to Community
        </button>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6">
          <div className="flex items-start gap-3 mb-3">
            <img
              src={post.profilepicture}
              alt="User"
              className="w-12 h-12 rounded-full border border-gray-200 object-cover"
            />
            <div>
              <h4 className="font-semibold text-gray-800">{post.username}</h4>
              <p className="text-xs text-gray-400">
                {new Date(post.dateposted).toLocaleString()}
              </p>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {post.title}
          </h2>
          <p className="text-gray-700 mb-4">{post.content}</p>
          {/* 🖼️ Multi-image grid display */}
          {post.imageurl && (() => {
            let images = [];

            try {
              if (typeof post.imageurl === "string") {
                images = JSON.parse(post.imageurl);
                if (!Array.isArray(images)) images = [post.imageurl];
              } else if (Array.isArray(post.imageurl)) {
                images = post.imageurl;
              }
            } catch {
              images = [post.imageurl];
            }

            return (
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
                    className="w-full h-64 rounded-md overflow-hidden border bg-gray-100 flex items-center justify-center"
                  >
                    <img
                      src={img}
                      alt={`Post Image ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
            );
          })()}

        </div>

        {/* ===== Suggestion Input Box ===== */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6">
          <h3 className="text-center text-gray-800 text-lg font-semibold mb-5">
            Suggestions
          </h3>
          <textarea
            value={newSuggestion}
            onChange={(e) => setNewSuggestion(e.target.value)}
            placeholder="Type here your wise suggestion"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setNewSuggestion("")}
              className="px-4 py-1 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSuggestion}
              className="px-4 py-1 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Suggest
            </button>
          </div>
        </div>

        {/* ===== Suggestions List ===== */}
        {suggestions.map((s) => (
          <div
            key={s.suggestionid}
            className="border border-gray-200 rounded-xl p-4 mb-4 hover:shadow-sm transition bg-gray-50"
          >
            <div className="flex items-start gap-3 mb-2">
              <img
                src={s.profilepicture}
                alt="User"
                className="w-10 h-10 rounded-full border border-gray-200 object-cover"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 text-sm">
                  {s.username}
                </h4>
                <p className="text-xs text-gray-400 mb-1">
                  {new Date(s.datesuggested).toLocaleString()}
                </p>
                <p className="text-gray-700 text-sm">{s.content}</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                ⋮
              </button>
            </div>

            {/* Icons Row */}
            <div className="flex items-center gap-6 mt-2 text-gray-500 text-sm">
             <span
  onClick={() => handleToggleLike(s.suggestionid)}
  className="flex items-center gap-1 cursor-pointer hover:text-orange-600"
>
  {userLikes[s.suggestionid] ? "❤️" : "🤍"} <span>{likeCounts[s.suggestionid] || 0}</span>
</span>

              <span className="flex items-center gap-1 cursor-pointer hover:text-orange-600">
                💬 <span>{commentCounts[s.suggestionid] || 0}</span>
              </span>
             <span
                  onClick={() =>
                    setReplyBoxes({
                      ...replyBoxes,
                      [s.suggestionid]: !replyBoxes[s.suggestionid],
                    })
                  }
                  className="text-xs text-orange-500 cursor-pointer hover:underline ml-auto"
                >
                  Reply
                </span>

            </div>

             {/* ====== Reply Input Box (toggle) ====== */}
{replyBoxes[s.suggestionid] && (
  <div className="mt-3 ml-12">
    <textarea
      value={replyText[s.suggestionid] || ""}
      onChange={(e) =>
        setReplyText({
          ...replyText,
          [s.suggestionid]: e.target.value,
        })
      }
      placeholder="Write a reply..."
      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
    />

    <div className="flex justify-end gap-2 mt-2">
      <button
        onClick={() => {
          setReplyBoxes({ ...replyBoxes, [s.suggestionid]: false });
          setReplyText({ ...replyText, [s.suggestionid]: "" });
        }}
        className="px-3 py-1 text-sm border rounded-md"
      >
        Cancel
      </button>
      <button
        onClick={() => handleAddReply(s.suggestionid)}
        className="px-3 py-1 text-sm bg-orange-600 text-white rounded-md"
      >
        Reply
      </button>
    </div>
  </div>
)}

{/* ====== Replies List ====== */}
{replies[s.suggestionid] &&
  replies[s.suggestionid].map((r) => (
    <div
      key={r.replyid}
      className="ml-12 mt-3 p-3 bg-white border border-gray-200 rounded-lg"
    >
      <div className="flex gap-3">
        <img
          src={r.profilepicture}
          className="w-8 h-8 rounded-full border object-cover"
        />
        <div>
          <h5 className="font-semibold text-sm">{r.username}</h5>
          <p className="text-xs text-gray-400">
            {new Date(r.datereplied).toLocaleString()}
          </p>
          <p className="text-gray-700 text-sm mt-1">{r.content}</p>
        </div>
      </div>
    </div>
  ))}
          </div>

        ))}
       

      </div>
    </div>
  );
}
