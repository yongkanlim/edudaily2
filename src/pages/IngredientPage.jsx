import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";

export default function IngredientPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchIngredients();
  }, []);

  async function fetchIngredients() {
    const { data, error } = await supabase.from("ingredient").select("*");

    if (error) {
      console.error("❌ Error fetching ingredients:", error.message);
    } else {
      setIngredients(data);
    }
    setLoading(false);
  }

  // Filtering logic
  const filteredIngredients = ingredients.filter((ing) => {
    const matchesType =
      selectedType === "All" ||
      ing.category?.toLowerCase() === selectedType.toLowerCase();
    const matchesSearch = ing.name
      ?.toLowerCase()
      .includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const ingredientTypes = [
    "Vegetables",
    "Fruits",
    "Meats",
    "Chicken",
    "Beef",
    "Lamb",
    "Pork",
    "Seafood",
    "Dairy Products",
    "Grains & Cereals",
    "Herbs & Spices",
    "Oils & Fats",
    "Legumes & Beans",
    "Nuts & Seeds",
    "Sauces & Condiments",
    "Baking Ingredients",
    "Beverages",
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between bg-white shadow-sm px-6 lg:px-16 py-4 gap-4 border-b">
        <div className="flex items-center gap-3">
          <select
            className="border border-gray-300 rounded-md px-4 py-2 text-gray-700 shadow-sm hover:border-green-400 focus:ring-2 focus:ring-green-300 focus:outline-none"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="All">All Categories</option>
            {ingredientTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-green-300 focus:outline-none"
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

        {/* <img
          src="https://i.pravatar.cc/40"
          alt="User"
          className="w-10 h-10 rounded-full border border-gray-300"
        /> */}
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8 p-6 lg:p-12">
        {/* Sidebar */}
        <aside className="w-full lg:w-1/5">
          <h3 className="font-bold text-lg mb-4">Type</h3>
          <ul className="space-y-1 text-gray-700">
            {ingredientTypes.map((type) => (
              <li
                key={type}
                onClick={() => setSelectedType(type)}
                className={`cursor-pointer hover:text-green-600 ${
                  selectedType === type
                    ? "font-semibold text-black"
                    : "text-gray-700"
                }`}
              >
                {type}
              </li>
            ))}
          </ul>
        </aside>

        {/* Ingredient Cards */}
        <main className="flex-1">
          {loading ? (
            <p className="text-center mt-10">Loading ingredients...</p>
          ) : filteredIngredients.length === 0 ? (
            <p className="text-center mt-10 text-gray-500">
              No ingredients found.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredIngredients.map((ing) => (
                <div
                  key={ing.ingredientid || ing.IngredientID}
                  className="bg-white rounded-2xl shadow hover:shadow-lg p-4 transition border border-gray-100 text-center"
                >
                  <img
                    src={
                      ing.imageurl ||
                      ing.ImageURL ||
                      "https://cdn-icons-png.flaticon.com/512/415/415733.png"
                    }
                    alt={ing.name || ing.Name}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                  <h2 className="font-semibold text-lg text-gray-800">
                    {ing.name || ing.Name}
                  </h2>
                  <p className="text-gray-600 font-medium mt-1">
                    RM {(ing.averageprice || ing.AveragePrice)?.toFixed(2)}{" "}
                    <span className="text-sm font-normal text-gray-500">
                      per {ing.unit || ing.Unit}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
