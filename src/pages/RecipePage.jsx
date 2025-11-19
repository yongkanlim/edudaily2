import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function RecipePage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("Easy");
  const [price, setPrice] = useState("Under RM 5");
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecipes();
  }, []);

  async function fetchRecipes() {
    const { data, error } = await supabase.from("recipe").select("*");
    if (error) console.error("❌ Error fetching recipes:", error.message);
    else setRecipes(data);
    setLoading(false);
  }

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* --- Top Banner Section (new) --- */}
      <div className="bg-white border-b shadow-sm">
        {/* Top Controls Row */}
        <div className="flex flex-wrap items-center justify-between px-6 lg:px-16 py-4 gap-4">
          {/* Add Recipe Request Button */}
          <button className="bg-orange-50 border border-orange-300 text-orange-700 px-4 py-2 rounded-full font-medium hover:bg-orange-100 transition">
            + Add recipe request
          </button>

          {/* Center Controls */}
          <div className="flex items-center gap-3">
            {/* Dropdown */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 text-gray-700 shadow-sm hover:border-orange-400 focus:ring-2 focus:ring-orange-300 focus:outline-none"
            >
              <option>All Categories</option>
              <option>Main Dish</option>
              <option>Dessert</option>
              <option>Vegetarian</option>
              <option>Healthy</option>
            </select>

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
            value="Newest"
            className="border border-gray-300 rounded-md px-3 py-2 text-gray-700 shadow-sm hover:border-orange-400 focus:ring-2 focus:ring-orange-300 focus:outline-none"
          >
            <option>Newest</option>
            <option>Oldest</option>
          </select>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-gray-700 shadow-sm hover:border-orange-400 focus:ring-2 focus:ring-orange-300 focus:outline-none"
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
          <select
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-gray-700 shadow-sm hover:border-orange-400 focus:ring-2 focus:ring-orange-300 focus:outline-none"
          >
            <option>Under RM 5</option>
            <option>Under RM 10</option>
            <option>Under RM 20</option>
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
                  onClick={() => setCategory(c)}
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">Allergies</h3>
            <ul className="space-y-1 text-gray-700">
              {[
                "Gluten",
                "Legumes",
                "Grain",
                "Fruit",
                "Nut",
                "Shell-fish",
                "Dairy",
                "Egg",
                "Soy",
              ].map((a) => (
                <li key={a} className="cursor-pointer hover:text-orange-600">
                  {a}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">Cuisine Type</h3>
            <ul className="space-y-1 text-gray-700">
              {[
                "Malay",
                "Chinese",
                "Indian",
                "Western",
                "Thai",
                "Japanese",
                "Korean",
              ].map((c) => (
                <li key={c} className="cursor-pointer hover:text-orange-600">
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">Goals</h3>
            <ul className="space-y-1 text-gray-700">
              {[
                "Weight loss",
                "Quick meals",
                "Healthy eating",
                "Weight gain",
              ].map((g) => (
                <li key={g} className="cursor-pointer hover:text-orange-600">
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
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.recipeid || recipe.RecipeID}
                  onClick={() => navigate(`/recipe/${recipe.recipeid || recipe.RecipeID}`)}
                  className="bg-white rounded-xl shadow hover:shadow-lg transition border border-gray-100 cursor-pointer"
                >

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
