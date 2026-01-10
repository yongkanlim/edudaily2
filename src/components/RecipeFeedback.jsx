import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function RecipeFeedback({ recipeId }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [comments, setComments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

useEffect(() => {
  getCurrentUser();
}, []);

async function getCurrentUser() {
  const authUser = JSON.parse(localStorage.getItem("user"));
  if (!authUser?.email) return;

  const { data, error } = await supabase
    .from("users")
    .select("userid")
    .eq("email", authUser.email)
    .single();

  if (!error && data) {
    setCurrentUserId(data.userid);
  }
}

  useEffect(() => {
    fetchComments();
  }, [recipeId]);

  // ================= FETCH FEEDBACK WITH USER + PROFILE =================
  async function fetchComments() {
    const { data: feedbackData, error } = await supabase
      .from("feedback")
      .select("feedbackid, userid, message, datesubmitted")
      .eq("recipeid", recipeId)
      .order("datesubmitted", { ascending: false });

    if (error) {
      console.error("❌ Fetch feedback error:", error);
      return;
    }

    if (!feedbackData || feedbackData.length === 0) {
      setComments([]);
      return;
    }

    const userIds = [...new Set(feedbackData.map((f) => f.userid))];

    const { data: usersData } = await supabase
      .from("users")
      .select("userid, username")
      .in("userid", userIds);

    const { data: profilesData } = await supabase
      .from("profile")
      .select("userid, profilepicture")
      .in("userid", userIds);

    const merged = feedbackData.map((f) => {
      const user = usersData?.find((u) => u.userid === f.userid);
      const profile = profilesData?.find((p) => p.userid === f.userid);

      return {
        ...f,
        username: user?.username || "Anonymous",
        profilepicture:
          profile?.profilepicture ||
          "https://cdn-icons-png.flaticon.com/512/847/847969.png",
      };
    });

    setComments(merged);
  }

  // ================= RATING =================
  async function submitRating(value) {
  if (!currentUserId) {
    alert("Please log in first");
    return;
  }

  setRating(value);

  await supabase.from("reciperating").upsert({
    recipeid: recipeId,
    userid: currentUserId,
    rating: value,
  });
}

  // ================= ADD FEEDBACK =================
  async function submitFeedback() {
  if (!feedback.trim()) return;
  if (!currentUserId) {
    alert("Please log in first");
    return;
  }

  await supabase.from("feedback").insert({
    recipeid: recipeId,
    userid: currentUserId,
    message: feedback.trim(),
  });

  setFeedback("");
  fetchComments();
}

  // ================= EDIT FEEDBACK =================
  async function handleUpdate(feedbackid) {
    if (!editText.trim()) return;

    await supabase
      .from("feedback")
      .update({ message: editText.trim() })
      .eq("feedbackid", feedbackid);

    setEditingId(null);
    setEditText("");
    fetchComments();
  }

  // ================= DELETE FEEDBACK =================
  async function handleDelete(feedbackid) {
    if (!window.confirm("Delete this feedback?")) return;

    await supabase
      .from("feedback")
      .delete()
      .eq("feedbackid", feedbackid);

    fetchComments();
  }

  return (
    <div className="mt-16">
      {/* ================= RATING ================= */}
      <div className="bg-orange-50 py-6 text-center">
        <h2 className="text-xl font-bold text-orange-600 mb-2">
          Recipe Rating
        </h2>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => submitRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="text-3xl text-yellow-400 cursor-pointer"
            >
              {(hover || rating) >= star ? "★" : "☆"}
            </button>
          ))}
        </div>
      </div>

      {/* ================= ADD FEEDBACK ================= */}
      <div className="max-w-4xl mx-auto mt-8 bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold mb-4">Feedback</h3>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Type here your feedback"
          className="w-full border rounded-lg p-3 mb-3"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setFeedback("")}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Cancel
          </button>
          <button
            onClick={submitFeedback}
            className="px-4 py-2 bg-orange-500 text-white rounded"
          >
            Post
          </button>
        </div>
      </div>

      {/* ================= FEEDBACK LIST ================= */}
      <div className="max-w-4xl mx-auto mt-6 space-y-4">
        {comments.map((c) => (
          <div
            key={c.feedbackid}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <img
                src={c.profilepicture}
                alt="User"
                className="w-10 h-10 rounded-full border object-cover"
              />

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800 text-sm">
                    {c.username}
                  </h4>
                  {c.userid === currentUserId && (
                    <div className="text-xs text-gray-400 flex gap-3">
                      <button
                        onClick={() => {
                          setEditingId(c.feedbackid);
                          setEditText(c.message);
                        }}
                        className="hover:text-orange-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.feedbackid)}
                        className="hover:text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-400 mb-1">
                  {new Date(c.datesubmitted).toLocaleString()}
                </p>

                {editingId === c.feedbackid ? (
                  <>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full border rounded-md p-2 text-sm"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 text-sm border rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdate(c.feedbackid)}
                        className="px-3 py-1 text-sm bg-orange-600 text-white rounded-md"
                      >
                        Save
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-700 text-sm">{c.message}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
