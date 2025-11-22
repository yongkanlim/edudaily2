import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../supabaseClient";

export default function Community() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]); // ✅ store posts from Supabase
  const [filterTag, setFilterTag] = useState(null); // null = all
  const [allTags, setAllTags] = useState([]);
  const [showAllTags, setShowAllTags] = useState(false);
  const [likesCount, setLikesCount] = useState({});
const [favoritesCount, setFavoritesCount] = useState({});
const [commentsCount, setCommentsCount] = useState({});
const [userLikes, setUserLikes] = useState({});
const [userFavorites, setUserFavorites] = useState({});
const [userIdInt, setUserIdInt] = useState(null);


  // ✅ Fetch posts from Supabase
 const fetchPosts = async (userIdInt) => {
  const { data: postsData, error: postsError } = await supabase
    .from("communitypost")
    .select("postid, title, content, imageurl, dateposted, userid, tag, status")
    .eq("status", "Published")   // ✅ only published posts
    .order("dateposted", { ascending: false });

  if (postsError) {
    console.error("❌ Error fetching posts:", postsError);
    return;
  }



  const userIds = [...new Set(postsData.map((p) => p.userid))];

  const { data: usersData, error: usersError } = await supabase
    .from("users")
    .select("userid, username")
    .in("userid", userIds);

  if (usersError) console.error("❌ Error fetching users:", usersError);

  const { data: profilesData, error: profilesError } = await supabase
    .from("profile")
    .select("userid, profilepicture")
    .in("userid", userIds);

  if (profilesError) console.error("❌ Error fetching profiles:", profilesError);

  const combined = postsData.map((post) => {
    const user = usersData?.find((u) => u.userid === post.userid);
    const profile = profilesData?.find((p) => p.userid === post.userid);
    return {
      ...post,
      username: user?.username || "Anonymous",
      profilepicture:
        profile?.profilepicture ||
        "https://cdn-icons-png.flaticon.com/512/847/847969.png",
    };
  });

  // Fetch counts for likes, comments, favorites
const fetchCounts = async () => {
  const likeMap = {};
  const favMap = {};
  const commentMap = {};
  const userLikeMap = {};
  const userFavMap = {};

  await Promise.all(
    combined.map(async (post) => {
      // ✅ Fetch like count
      const { count: likeCount } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("postid", post.postid);
      likeMap[post.postid] = likeCount || 0;

      // ✅ Fetch favorite count
      const { count: favCount } = await supabase
        .from("post_favorites")
        .select("*", { count: "exact", head: true })
        .eq("postid", post.postid);
      favMap[post.postid] = favCount || 0;

      // ✅ Fetch comment count
      const { count: commentCount } = await supabase
        .from("suggestions")
        .select("*", { count: "exact", head: true })
        .eq("postid", post.postid);
      commentMap[post.postid] = commentCount || 0;

      // ✅ Check if current user liked this post
      const { data: liked } = await supabase
        .from("post_likes")
        .select("*")
        .eq("postid", post.postid)
        .eq("userid", userIdInt);
      userLikeMap[post.postid] = liked?.length > 0;

      // ✅ Check if current user favorited this post
      const { data: favorited } = await supabase
        .from("post_favorites")
        .select("*")
        .eq("postid", post.postid)
        .eq("userid", userIdInt);
      userFavMap[post.postid] = favorited?.length > 0;
    })
  );

  // ✅ Update state once
  setLikesCount(likeMap);
  setFavoritesCount(favMap);
  setCommentsCount(commentMap);
  setUserLikes(userLikeMap);
  setUserFavorites(userFavMap);
};


fetchCounts();

  console.log("✅ Combined data:", combined);
  setPosts(combined);

  // Extract unique tags from posts
const tagsSet = new Set();
combined.forEach(post => {
  if (post.tag) {
    post.tag.split(",").forEach(t => tagsSet.add(t.trim()));
  }
});
setAllTags([...tagsSet]);

};
  const filteredPosts = filterTag
  ? posts.filter(post => post.tag?.includes(filterTag))
  : posts;
  // ✅ Check user & fetch posts
  useEffect(() => {
    const checkUser = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    navigate("/login");
  } else {
    localStorage.setItem("user", JSON.stringify(session.user));
    setUser(session.user);

    // 🔥 Fetch integer userid (IMPORTANT!)
    const { data: userData } = await supabase
      .from("users")
      .select("userid")
      .eq("email", session.user.email)
      .single();

    if (userData) {
      setUserIdInt(userData.userid);   // store int userid
    }

    fetchPosts(userData.userid);
  }
};


    checkUser();
  }, [navigate]);

  if (!user) return null; // Prevent flash before redirect

  const toggleLike = async (postid) => {
  if (!user) return;

  if (userLikes[postid]) {
    await supabase
      .from("post_likes")
      .delete()
      .eq("postid", postid)
      .eq("userid", userIdInt);

    setUserLikes({ ...userLikes, [postid]: false });
    setLikesCount({ ...likesCount, [postid]: likesCount[postid] - 1 });
  } else {
    await supabase.from("post_likes").insert([
      { postid, userid: userIdInt }
    ]);

    setUserLikes({ ...userLikes, [postid]: true });
    setLikesCount({ ...likesCount, [postid]: likesCount[postid] + 1 });
  }
};

const toggleFavorite = async (postid) => {
  if (!user) return;

  if (userFavorites[postid]) {
    await supabase
      .from("post_favorites")
      .delete()
      .eq("postid", postid)
      .eq("userid", userIdInt);

    setUserFavorites({ ...userFavorites, [postid]: false });
    setFavoritesCount({
      ...favoritesCount,
      [postid]: favoritesCount[postid] - 1,
    });
  } else {
    await supabase.from("post_favorites").insert([
      { postid, userid: userIdInt }
    ]);

    setUserFavorites({ ...userFavorites, [postid]: true });
    setFavoritesCount({
      ...favoritesCount,
      [postid]: favoritesCount[postid] + 1,
    });
  }
};


  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-12 gap-8">
        {/* ===== LEFT SIDEBAR ===== */}
        <aside className="hidden lg:block lg:col-span-2">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6">
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">
                Menu
              </h3>
              <ul className="text-sm text-gray-700 space-y-3">
              <li
                  onClick={() => {
                    window.location.hash = "questions";   // keep your original behavior
                    setFilterTag("Question");             // new filter
                  }}
                  className="flex items-center gap-2 text-orange-600 font-semibold cursor-pointer"
                >
                    <span className="text-lg">💬</span> Questions
                  </li>

                  <li
                    onClick={() => setShowAllTags(!showAllTags)}
                    className="hover:text-orange-600 cursor-pointer"
                  >
                    🏷 Tags
                  </li>


                  <li
                    onClick={() => {
                      window.location.hash = "recipe";      // keep your original behavior
                      setFilterTag("Recipe");               // new filter
                    }}
                    className="hover:text-orange-600 cursor-pointer"
                  >
                    🍳 Recipe
                  </li>

                  <li
                    onClick={() => {
                      window.location.hash = "all";         // optional
                      setFilterTag(null);                   // reset filter
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
                    className="hover:text-orange-600 cursor-pointer"
                  >
                    📝 My Drafts
                  </li>

              </ul>
            </div>
          </div>
        </aside>

        {/* ===== MIDDLE CONTENT (POST FEED) ===== */}
        <main className="lg:col-span-7 space-y-6">
          {/* 🔍 Search Box */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">
              Search
            </h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 absolute right-3 top-2.5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
            </div>
          </div>

            {showAllTags && allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {allTags.map((tag, index) => (
                  <span
                    key={index}
                    onClick={() => setFilterTag(tag)}
                    className="cursor-pointer px-3 py-1 text-sm font-medium bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

         {/* ✅ Dynamic Posts from Supabase */}
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => {
              // ✅ Handle multiple images stored as JSON or single URL
              let images = [];
              try {
                if (post.imageurl) {
                  if (typeof post.imageurl === "string") {
                    images = JSON.parse(post.imageurl);
                    if (!Array.isArray(images)) images = [post.imageurl];
                  } else if (Array.isArray(post.imageurl)) {
                    images = post.imageurl;
                  }
                }
              } catch {
                images = [post.imageurl];
              }

    return (
      <div
        key={post.postid}
        onClick={() => navigate(`/community/${post.postid}`)}
        className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer"
      >
        {/* 👤 User info */}
        <div className="flex items-start gap-3 mb-3">
          <img
            src={post.profilepicture}
            alt="User"
            className="w-10 h-10 rounded-full border border-gray-200 object-cover"
          />
          <div>
            <h4 className="font-semibold text-gray-800">{post.username}</h4>
            <p className="text-xs text-gray-400">
              {new Date(post.dateposted).toLocaleString()}
            </p>
          </div>
        </div>

        {/* 📝 Post content */}
        <h3 className="font-semibold text-gray-900 mb-1 text-lg">{post.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{post.content}</p>

        {/* 🖼️ Multi-image grid */}
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
                  alt={`Post Image ${index + 1}`}
                  className="object-cover w-full h-full"
                />
              </div>
            ))}

          </div>
        )}

{/* Tags */}
{post.tag && (
  <div className="flex flex-wrap gap-2 mb-2">
    {post.tag.split(",").map((t, index) => (
      <span
        key={index}
        onClick={(e) => {
          e.stopPropagation(); // prevent navigating to post
          setFilterTag(t.trim());
        }}
        className="cursor-pointer px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition"
      >
        {t.trim()}
      </span>
    ))}
  </div>
)}


      {/* ❤️ Like / ⭐ Favorite / 💬 Comments */}
<div className="flex gap-6 text-gray-700 text-sm mt-3">

  {/* LIKE BUTTON */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      toggleLike(post.postid);
    }}
    className="flex items-center gap-1 hover:text-red-500 transition"
  >
    <span>{userLikes[post.postid] ? "❤️" : "🤍"}</span>
    <span>{likesCount[post.postid] || 0}</span>
  </button>

  {/* COMMENT BUTTON */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      navigate(`/community/${post.postid}#comments`);
    }}
    className="flex items-center gap-1 hover:text-blue-500 transition"
  >
    <span>💬</span>
    <span>{commentsCount[post.postid] || 0}</span>
  </button>

  {/* FAVORITE BUTTON */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      toggleFavorite(post.postid);
    }}
    className="flex items-center gap-1 hover:text-yellow-500 transition"
  >
    <span>{userFavorites[post.postid] ? "⭐" : "✩"}</span>
    <span>{favoritesCount[post.postid] || 0}</span>
  </button>
</div>
      </div>
    );
  })
) : (
  <p className="text-gray-500 text-sm">No posts yet.</p>
)}

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
