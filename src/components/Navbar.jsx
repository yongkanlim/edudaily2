import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSupabaseUser } from "../components/useSupabaseUser";
import { supabase } from "../supabaseClient";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSupabaseUser();
  const [avatar, setAvatar] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

// Watch for Supabase user changes (so avatar updates live)
useEffect(() => {
  const fetchAvatar = async () => {
    if (!user?.email) return;

    // ⚡ Step 1: Show cached avatar immediately (if exists)
    const cachedAvatar = localStorage.getItem("avatar");
    if (cachedAvatar) setAvatar(cachedAvatar);

    // ⚡ Step 2: Get UserID (only if not cached)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("userid")
      .eq("email", user.email)
      .single();

    if (userError || !userData) {
      console.error("Error fetching UserID:", userError);
      return;
    }

    // ⚡ Step 3: Get latest profile picture
    const { data, error } = await supabase
      .from("profile")
      .select("profilepicture")
      .eq("userid", userData.userid)
      .maybeSingle();

    if (!error && data?.profilepicture) {
      setAvatar(data.profilepicture);
      localStorage.setItem("avatar", data.profilepicture); // ✅ cache it
    } else {
      const defaultAvatar =
        "https://cdn-icons-png.flaticon.com/512/847/847969.png";
      setAvatar(defaultAvatar);
      localStorage.setItem("avatar", defaultAvatar);
    }
  };

  fetchAvatar();
}, [user]);

useEffect(() => {
  const fetchNotifications = async () => {
    if (!user?.email) return;

    // Get user ID
    const { data: userRow } = await supabase
      .from("users")
      .select("userid")
      .eq("email", user.email)
      .single();

    if (!userRow) return;

    const myUserID = userRow.userid;

    // Fetch likes
    const { data: likeRows } = await supabase
      .from("post_likes")
      .select("postid, userid, created_at, users(username)")
      .neq("userid", myUserID)
      .in(
        "postid",
        (
          await supabase
            .from("communitypost")
            .select("postid")
            .eq("userid", myUserID)
        ).data?.map((p) => p.postid) || []
      );

    // Fetch comments
    const { data: commentRows, error: commentError } = await supabase
  .from("suggestions")
  .select(`
    postid,
    userid,
    datesuggested,
    users(username)
  `)
  .neq("userid", myUserID)
  .in(
    "postid",
    (await supabase.from("communitypost").select("postid").eq("userid", myUserID)).data?.map(p => p.postid) || []
  );

if (commentError) console.error("Error fetching comments:", commentError);

    // Fetch favorites
    const { data: favRows } = await supabase
      .from("post_favorites")
      .select("postid, userid, created_at, users(username)")
      .neq("userid", myUserID)
      .in(
        "postid",
        (
          await supabase
            .from("communitypost")
            .select("postid")
            .eq("userid", myUserID)
        ).data?.map((p) => p.postid) || []
      );

    const notifList = [];

    likeRows?.forEach((row) =>
      notifList.push({
        type: "like",
        user: row.users?.username || "Someone",
        postid: row.postid,
      })
    );

    commentRows?.forEach((row) =>
      notifList.push({
        type: "comment",
        user: row.users?.username || "Someone",
        postid: row.postid,
      })
    );

    favRows?.forEach((row) =>
      notifList.push({
        type: "favorite",
        user: row.users?.username || "Someone",
        postid: row.postid,
      })
    );

    setNotifications(notifList.reverse());
  };

  fetchNotifications();
}, [user]);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Recipes", path: "/recipes" },
    { name: "Ingredient Info", path: "/ingredients" },
    { name: "Community", path: "/community" },
    { name: "About Us", path: "/about" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-extrabold text-gray-900">
          EDU<span className="text-orange-600">DAILY</span>
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-8 text-base font-medium">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`transition-all ${
                  location.pathname === item.path
                    ? "text-orange-600 font-semibold border-b-2 border-orange-600 pb-1"
                    : "text-gray-700 hover:text-orange-600"
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Buttons */}
<div className="hidden md:flex items-center space-x-3">
  {/* Conditionally show community buttons */}
  {location.pathname === "/community" && (
    <button
      onClick={() => navigate("/create-question")}
      className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md text-base font-medium hover:bg-orange-700 transition-all"
    >
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-4 h-4"
      >
        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
      </svg>

      Create Post
    </button>
  )}

  {/* 🔔 Notification Bell */}
  <div className="relative">
  {/* Notification Bell */}
  <button
    onClick={() => setShowNotif(!showNotif)}
    className="relative p-2 text-gray-600 hover:text-orange-600 transition"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14V10a6 6 0 10-12 0v4a2.032 2.032 0 01-.595 1.595L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
    <span className="absolute top-1 right-1 block w-2 h-2 bg-red-500 rounded-full"></span>
  </button>

  {/* Dropdown */}
  {showNotif && (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 shadow-lg rounded-lg z-50">
      <div className="p-3 font-semibold text-gray-700 border-b">Notifications</div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 text-center">
            No notifications yet
          </div>
        ) : (
          notifications.map((n, index) => (
            <div
              key={index}
              onClick={() => navigate(`/community/${n.postid}`)}
              className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm"
            >
              <span className="font-semibold text-orange-600">{n.user}</span>{" "}
              {n.type === "like" && "liked your post"}
              {n.type === "comment" && "commented on your post"}
              {n.type === "favorite" && "favorited your post"}
            </div>
          ))
        )}
      </div>
    </div>
  )}
</div>


  {/* Profile / Login buttons */}
  {user ? (
    <div className="relative">
      <img
        src={avatar || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
        alt="Profile"
        className="w-10 h-10 rounded-full border border-gray-300 cursor-pointer"
        onClick={() => setOpen((prev) => !prev)}
      />

      {open && (
  <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 shadow-lg rounded-lg z-50">
    <div className="flex flex-col">
      <button
        onClick={() => {
          navigate("/profile");
          setOpen(false);
        }}
        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-all"
      >
        View Profile
      </button>

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          localStorage.removeItem("user");
          window.location.reload();
        }}
        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-all"
      >
        Logout
      </button>
    </div>
  </div>
)}

    </div>
  ) : (
    <>
      <Link
        to="/register"
        className="bg-orange-600 text-white px-3 py-1.5 rounded-sm text-sm hover:bg-orange-700 transition-all"
      >
        Register
      </Link>
      <Link
        to="/login"
        className="border border-orange-600 text-orange-600 px-3 py-1.5 rounded-sm text-sm hover:bg-orange-50 transition-all"
      >
        Login
      </Link>
    </>
  )}
</div>



        {/* Mobile Menu Icon */}
        <button
          className="md:hidden text-gray-800"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
  <div className="md:hidden bg-white border-t border-gray-100 py-4">
    <ul className="flex flex-col items-center space-y-4">
      {navItems.map((item) => (
        <li key={item.name}>
          <Link
            to={item.path}
            onClick={() => setOpen(false)}
            className={`transition-all ${
              location.pathname === item.path
                ? "text-orange-600 font-semibold"
                : "text-gray-700 hover:text-orange-600"
            }`}
          >
            {item.name}
          </Link>
        </li>
      ))}
    </ul>

    {/* ✅ Replace Register/Login with Profile & Logout if user logged in */}
    <div className="flex flex-col items-center mt-4 space-y-2">
      {user ? (
        <>
          <button
            onClick={() => {
              setOpen(false);
              navigate("/profile");
            }}
            className="flex items-center gap-2 text-gray-700 font-medium hover:text-orange-600"
          >
            <img
              src={
                user.user_metadata?.avatar_url ||
                "https://cdn-icons-png.flaticon.com/512/847/847969.png"
              }
              alt="Profile"
              className="w-10 h-10 rounded-full border border-gray-300"
            />
            <span>My Profile</span>
          </button>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              localStorage.removeItem("user");
              window.location.reload();
            }}
            className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded-md text-sm hover:bg-gray-100 transition-all"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link
            to="/register"
            className="bg-orange-600 text-white px-3 py-1.5 rounded-sm text-sm hover:bg-orange-700 transition-all"
          >
            Register
          </Link>

          <Link
            to="/login"
            className="border border-orange-600 text-orange-600 px-5 py-2 rounded-md hover:bg-orange-50 transition-all"
          >
            Login
          </Link>
        </>
      )}
    </div>
  </div>
)}

    </nav>
  );
}
