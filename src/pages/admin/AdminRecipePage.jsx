import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";
import { PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function RecipePage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [price, setPrice] = useState("All");
  const navigate = useNavigate();
  const [allergy, setAllergy] = useState("All"); 
  const [cuisineType, setCuisineType] = useState("All");
  const [goal, setGoal] = useState("All");
  const [sortOrder, setSortOrder] = useState("Newest");
  const [mode, setMode] = useState("view"); // view | edit | delete

  useEffect(() => {
    fetchRecipes();
  }, []);

  async function fetchRecipes() {
    const { data, error } = await supabase.from("recipe").select("*");
    if (error) console.error("❌ Error fetching recipes:", error.message);
    else setRecipes(data);
    setLoading(false);
  }

  const filteredRecipes = recipes.filter((recipe) => {
  const matchesSearch = recipe.title?.toLowerCase().includes(search.toLowerCase());

  const matchesCategory = category === "All" || recipe.dietarycategory === category;
  
  const matchesPrice =
  price === "All" ? true :
  price === "Under RM 5" ? recipe.estimatedcost <= 5 :
  price === "Under RM 10" ? recipe.estimatedcost <= 10 :
  price === "Under RM 20" ? recipe.estimatedcost <= 20 :
  price === "RM 20 and above" ? recipe.estimatedcost > 20 : true;

  const matchesAllergy = allergy === "All" || !allergy || recipe.allergies?.includes(allergy);
  const matchesCuisine = cuisineType === "All" || !cuisineType || recipe.cuisinetype === cuisineType;
  const matchesGoal = goal === "All" || !goal || recipe.goal === goal;

  return (
    matchesSearch &&
    matchesCategory &&
    matchesPrice &&
    matchesAllergy &&
    matchesCuisine &&
    matchesGoal
    );
  });

const sortedRecipes = [...filteredRecipes].sort((a, b) => {
  if (sortOrder === "Newest") return (b.recipeid || b.RecipeID) - (a.recipeid || a.RecipeID);
  if (sortOrder === "Oldest") return (a.recipeid || a.RecipeID) - (b.recipeid || b.RecipeID);
  return 0;
});

// Delete recipe function
const deleteRecipe = async (recipeId) => {
  if (!window.confirm("Are you sure you want to delete this recipe?")) return;

  setLoading(true);
  try {
    // Delete recipe ingredients first (foreign key)
    await supabase.from("recipeingredient").delete().eq("recipeid", recipeId);

    // Delete tutorial video if exists
    await supabase.from("tutorial").delete().eq("recipeid", recipeId);

    // Delete the recipe itself
    const { error } = await supabase.from("recipe").delete().eq("recipeid", recipeId);

    if (error) {
      alert("Failed to delete recipe!");
      console.error(error);
    } else {
      alert("Recipe deleted successfully!");
      // Remove from local state
      setRecipes(prev => prev.filter(r => r.recipeid !== recipeId));
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong while deleting the recipe.");
  }
  setLoading(false);
};

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
        {/* 🔴 Admin Mode Banner */}
        {mode !== "view" && (
        <div
            className={`px-6 py-3 flex justify-between items-center ${
            mode === "delete" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}
        >
            <span className="font-medium capitalize">{mode} mode</span>
            <button
            onClick={() => setMode("view")}
            className="bg-white px-3 py-1 rounded shadow flex items-center gap-1"
            >
            <XMarkIcon className="w-4 h-4" /> Exit
            </button>
        </div>
        )}

      {/* --- Top Banner Section (new) --- */}
      <div className="bg-white border-b shadow-sm">
        {/* Top Controls Row */}
        <div className="flex flex-wrap items-center justify-between px-6 lg:px-16 py-4 gap-4">
          {/* --- Admin Action Buttons (Left Side) --- */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
            {/* Add Recipe */}
            <button
                onClick={() => navigate("/addrecipe")}
                className="bg-orange-50 border border-orange-300 text-orange-700 px-4 py-2 rounded-full font-medium"
            >
                + Add recipe
            </button>

            {/* Edit Mode */}
            <button
                onClick={() => setMode("edit")}
                className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-medium"
            >
                Edit recipe
            </button>

            {/* Delete Mode */}
            <button
                onClick={() => setMode("delete")}
                className="bg-red-100 text-red-600 px-4 py-2 rounded-full font-medium"
            >
                Delete recipe
            </button>

            {/* Manage Recipe Requests */}
            <button
              onClick={() => navigate("/admin/recipe-requests")}
              className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-medium"
            >
              Manage Recipe Requests
            </button>

            {/* Exit Button for Edit/Delete Mode */}
            {mode !== "view" && (
                <button
                onClick={() => setMode("view")}
                className="bg-gray-100 text-gray-800 px-3 py-2 rounded-full font-medium flex items-center gap-1 mt-2 lg:mt-0"
                >
                <XMarkIcon className="w-4 h-4" />
                Exit {mode} mode
                </button>
            )}
            </div>

          {/* Center Controls */}
          <div className="flex items-center gap-3">
            
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-orange-300 focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* Food Banner Image */}
        <div
          className="w-full h-64 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://as2.ftcdn.net/v2/jpg/08/49/46/15/1000_F_849461596_SsGPu5tIgRRP7OP7vzwYPSWtzvpV8U8w.jpg?auto=format&fit=crop&w=20000&q=50')",
          }}
        ></div>
      </div>

      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between bg-white shadow-sm px-6 lg:px-16 py-4 gap-4 border-b">
        <div className="flex gap-3">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-gray-700 shadow-sm hover:border-orange-400 focus:ring-2 focus:ring-orange-300 focus:outline-none"
          >
            <option>Newest</option>
            <option>Oldest</option>
          </select>

          <select
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-gray-700 shadow-sm hover:border-orange-400 focus:ring-2 focus:ring-orange-300 focus:outline-none"
          >
            <option>All price</option>
            <option>Under RM 5</option>
            <option>Under RM 10</option>
            <option>Under RM 20</option>
            <option>RM 20 and above</option>
          </select>

          <button className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md flex items-center gap-2 text-gray-700 transition">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 14.414V20a1 1 0 01-1.447.894l-4-2A1 1 0 018 18v-3.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 p-6 lg:p-12">
        {/* Left Sidebar Filters */}
        <aside className="w-full lg:w-1/5 space-y-8">
          <div>
            <h3 className="font-bold text-lg mb-3">Category</h3>
            <ul className="space-y-1 text-gray-700">
              {["Vegetarian", "Vegan", "Pescatarian", "High-Protein", "Halal", "Low-Carb"].map((c) => (
                <li
                  key={c}
                  className={`cursor-pointer hover:text-orange-600 ${
                    category === c ? "font-semibold text-black" : ""
                  }`}
                  onClick={() => setCategory(category === c ? "All" : c)}
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">Allergies</h3>
            <ul className="space-y-1 text-gray-700">
                {["Gluten","Legumes","Grain","Fruit","Nut","Shell-fish","Dairy","Egg","Soy"].map((a) => (
                  <li
                    key={a}
                    className={`cursor-pointer hover:text-orange-600 ${allergy === a ? "font-semibold text-black" : ""}`}
                    onClick={() => setAllergy(allergy === a ? "All" : a)}
                  >
                    {a}
                  </li>
                ))}
              </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">Cuisine Type</h3>
            <ul className="space-y-1 text-gray-700">
              {["Malay","Chinese","Indian","Western","Thai","Japanese","Korean"].map((c) => (
                <li
                  key={c}
                  className={`cursor-pointer hover:text-orange-600 ${cuisineType === c ? "font-semibold text-black" : ""}`}
                  onClick={() => setCuisineType(cuisineType === c ? "All" : c)}
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">Goals</h3>
            <ul className="space-y-1 text-gray-700">
              {["Weight loss","Quick meals","Healthy eating","Weight gain"].map((g) => (
                <li
                  key={g}
                  className={`cursor-pointer hover:text-orange-600 ${goal === g ? "font-semibold text-black" : ""}`}
                  onClick={() => setGoal(goal === g ? "All" : g)}
                >
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Recipe Grid */}
        <main className="flex-1">
          {loading ? (
            <p className="text-center text-gray-500 mt-10">Loading recipes...</p>
          ) : filteredRecipes.length === 0 ? (
            <p className="text-center text-gray-500 mt-10">No recipes found.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
              {sortedRecipes.map((recipe) => (
                <div
                    key={recipe.recipeid || recipe.RecipeID}
                    className="relative bg-white rounded-xl shadow hover:shadow-lg transition border border-gray-100 cursor-pointer"
                    onClick={() => mode === "view" && navigate(`/recipe/${recipe.recipeid || recipe.RecipeID}`)}
                    >
                    {/* Admin Icons */}
                    {mode !== "view" && (
                        <div className="absolute top-3 right-3 z-10 flex gap-2">
                        {mode === "edit" && (
                            <button
                            onClick={() => navigate(`/admin/edit-recipe/${recipe.recipeid}`)}
                            className="bg-white p-2 rounded-full shadow hover:bg-green-100"
                            >
                            <PencilIcon className="w-5 h-5 text-green-600" />
                            </button>
                        )}
                        {mode === "delete" && (
                            <button
                            onClick={() => deleteRecipe(recipe.recipeid)}
                            className="bg-white p-2 rounded-full shadow hover:bg-red-100"
                            >
                            <TrashIcon className="w-5 h-5 text-red-600" />
                            </button>
                        )}
                        </div>
                    )}

                  <img
                    src={
                      recipe.imageurl ||
                      "https://cdn-icons-png.flaticon.com/512/857/857681.png"
                    }
                    alt={recipe.title || recipe.Title}
                    className="w-full h-56 object-cover rounded-t-xl"
                  />
                  <div className="p-4">
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                      <span>⏱ {recipe.estimatedtime || "30"} mins</span>
                      <span>💰 RM{recipe.estimatedcost || "5"}</span>
                    </div>
                    <h2 className="font-bold text-lg text-gray-800 mb-2">
                      {recipe.title || recipe.Title}
                    </h2>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {recipe.description || recipe.Description}
                    </p>
                    <div className="text-sm flex justify-between text-gray-500">
                      <span>{recipe.cuisinetype || "Malay"}</span>
                      <span>⭐ {recipe.rating || "4.5"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
