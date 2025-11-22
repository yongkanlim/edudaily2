import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../supabaseClient";

export default function YourRecipes() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [likesCount, setLikesCount] = useState({});
  const [favoritesCount, setFavoritesCount] = useState({});
  const [commentsCount, setCommentsCount] = useState({});
  const [userLikes, setUserLikes] = useState({});
  const [userFavorites, setUserFavorites] = useState({});
  const [userIdInt, setUserIdInt] = useState(null);

  // Fetch recipes & associated data
  const fetchRecipes = async (useridInt) => {
    try {
      const { data: posts, error } = await supabase
        .from("communitypost")
        .select("*")
        .eq("userid", useridInt)
        .ilike("tag", "%Recipe%") // <-- matches "Recipe" anywhere in the string
        .order("dateposted", { ascending: false });

      if (error) {
        console.error("❌ Error fetching recipes:", error);
        return;
      }

      // Add username & profile picture
      const combined = posts.map((post) => ({
        ...post,
        username: user?.user_metadata?.full_name || "You",
        profilepicture:
          user?.user_metadata?.avatar_url ||
          "https://cdn-icons-png.flaticon.com/512/847/847969.png",
      }));

      // Likes / Favorites / Comments
      const likeMap = {};
      const favMap = {};
      const commentMap = {};
      const userLikeMap = {};
      const userFavMap = {};

      await Promise.all(
        combined.map(async (post) => {
          // Likes count
          const { count: likeCount } = await supabase
            .from("post_likes")
            .select("*", { count: "exact", head: true })
            .eq("postid", post.postid);
          likeMap[post.postid] = likeCount || 0;

          // Favorites count
          const { count: favCount } = await supabase
            .from("post_favorites")
            .select("*", { count: "exact", head: true })
            .eq("postid", post.postid);
          favMap[post.postid] = favCount || 0;

          // Comments count
          const { count: commentCount } = await supabase
            .from("suggestions")
            .select("*", { count: "exact", head: true })
            .eq("postid", post.postid);
          commentMap[post.postid] = commentCount || 0;

          // User liked?
          const { data: liked } = await supabase
            .from("post_likes")
            .select("*")
            .eq("postid", post.postid)
            .eq("userid", useridInt);
          userLikeMap[post.postid] = liked?.length > 0;

          // User favorited?
          const { data: favorited } = await supabase
            .from("post_favorites")
            .select("*")
            .eq("postid", post.postid)
            .eq("userid", useridInt);
          userFavMap[post.postid] = favorited?.length > 0;
        })
      );

      setLikesCount(likeMap);
      setFavoritesCount(favMap);
      setCommentsCount(commentMap);
      setUserLikes(userLikeMap);
      setUserFavorites(userFavMap);

      setRecipes(combined);
    } catch (err) {
      console.error("❌ Unexpected error fetching recipes:", err);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);

      const { data: userRow, error } = await supabase
        .from("users")
        .select("userid")
        .eq("email", session.user.email)
        .single();

      if (error) {
        console.error("❌ Error fetching user ID:", error);
        return;
      }

      if (userRow) {
        setUserIdInt(userRow.userid);
        fetchRecipes(userRow.userid);
      }
    };
    checkUser();
  }, [navigate]);

  if (!user) return null;

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
      await supabase.from("post_likes").insert([{ postid, userid: userIdInt }]);
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
      setFavoritesCount({ ...favoritesCount, [postid]: favoritesCount[postid] - 1 });
    } else {
      await supabase.from("post_favorites").insert([{ postid, userid: userIdInt }]);
      setUserFavorites({ ...userFavorites, [postid]: true });
      setFavoritesCount({ ...favoritesCount, [postid]: favoritesCount[postid] + 1 });
    }
  };

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
                <li onClick={() => navigate("/your-recipes")} className="hover:text-orange-600 cursor-pointer font-semibold text-orange-600">
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

        {/* ===== MAIN CONTENT ===== */}
        <main className="lg:col-span-7 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🍲 Your Recipes</h2>
            
          {recipes.length > 0 ? (
            recipes.map((post) => {
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
                  onClick={() => navigate(`/recipe/${post.postid}`)}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer"
                >
                  {/* User info */}
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

                  {/* Post content */}
                  <h3 className="font-semibold text-gray-900 mb-1 text-lg">{post.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{post.content}</p>

                  {/* Images */}
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
                      {images.map((img, idx) => (
                        <div
                          key={idx}
                          className="w-full h-48 rounded-md overflow-hidden border bg-gray-100 flex items-center justify-center"
                        >
                          <img src={img} alt={`Post ${idx + 1}`} className="object-cover w-full h-full" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Like / Comment / Favorite */}
                  <div className="flex gap-6 text-gray-700 text-sm mt-3">
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
            <p className="text-gray-500">You have not added any recipes yet.</p>
          )}
        </main>
      </div>
    </div>
  );
}
