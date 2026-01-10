import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";
import { PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function AdminIngredientPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("All");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("view"); // view | edit | delete
  const navigate = useNavigate();

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

  useEffect(() => {
    fetchIngredients();
  }, []);

  async function fetchIngredients() {
    const { data, error } = await supabase.from("ingredient").select("*");
    if (error) console.error("❌ Error fetching ingredients:", error.message);
    else setIngredients(data);
    setLoading(false);
  }

  const filteredIngredients = ingredients.filter((ing) => {
  const categories = (ing.category || ing.Category || "")
    .split(",")        // split comma-separated values
    .map((c) => c.trim().toLowerCase());

  const matchesType =
    selectedType === "All" || categories.includes(selectedType.toLowerCase());

  const matchesSearch = ing.name
    ?.toLowerCase()
    .includes(search.toLowerCase());

  return matchesType && matchesSearch;
});


  // Delete ingredient function
  const deleteIngredient = async (id) => {
    if (!window.confirm("Are you sure you want to delete this ingredient?")) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("ingredient").delete().eq("ingredientid", id);
      if (error) {
        alert("Failed to delete ingredient!");
        console.error(error);
      } else {
        alert("Ingredient deleted successfully!");
        setIngredients((prev) => prev.filter((ing) => ing.ingredientid !== id));
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while deleting the ingredient.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
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

      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between bg-white shadow-sm px-6 lg:px-16 py-4 gap-4 border-b">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
          <button
            onClick={() => navigate("/admin/add-ingredient")}
            className="bg-orange-50 border border-orange-300 text-orange-700 px-4 py-2 rounded-full font-medium"
          >
            + Add ingredient
          </button>

          <button
            onClick={() => setMode("edit")}
            className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-medium"
          >
            Edit ingredient
          </button>

          <button
            onClick={() => setMode("delete")}
            className="bg-red-100 text-red-600 px-4 py-2 rounded-full font-medium"
          >
            Delete ingredient
          </button>

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

        <div className="flex items-center gap-3">
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
      </div>

      <div className="flex flex-col lg:flex-row gap-8 p-6 lg:p-12">
        {/* Sidebar */}
        <aside className="w-full lg:w-1/5">
          <h3 className="font-bold text-lg mb-4">Type</h3>
          <ul className="space-y-1 text-gray-700">
            {ingredientTypes.map((type) => (
              <li
                key={type}
                onClick={() =>
                    setSelectedType((prev) => (prev === type ? "All" : type))
                }
                className={`cursor-pointer hover:text-green-600 ${
                    selectedType === type ? "font-semibold text-black" : "text-gray-700"
                }`}
                >
                {type}
                </li>

            ))}
          </ul>
        </aside>

        {/* Ingredient Grid */}
        <main className="flex-1">
          {loading ? (
            <p className="text-center mt-10">Loading ingredients...</p>
          ) : filteredIngredients.length === 0 ? (
            <p className="text-center mt-10 text-gray-500">No ingredients found.</p>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredIngredients.map((ing) => (
                <div
                  key={ing.ingredientid || ing.IngredientID}
                  className="relative bg-white rounded-2xl shadow hover:shadow-lg p-4 transition border border-gray-100 text-center cursor-pointer"
                  onClick={() =>
                    mode === "edit" && navigate(`/admin/edit-ingredient/${ing.ingredientid}`)
                  }
                >
                  {/* Admin Icons */}
                  {mode !== "view" && (
                    <div className="absolute top-3 right-3 z-10 flex gap-2">
                      {mode === "edit" && (
                        <button
                          onClick={() =>
                            navigate(`/admin/edit-ingredient/${ing.ingredientid}`)
                          }
                          className="bg-white p-2 rounded-full shadow hover:bg-green-100"
                        >
                          <PencilIcon className="w-5 h-5 text-green-600" />
                        </button>
                      )}
                      {mode === "delete" && (
                        <button
                          onClick={() => deleteIngredient(ing.ingredientid)}
                          className="bg-white p-2 rounded-full shadow hover:bg-red-100"
                        >
                          <TrashIcon className="w-5 h-5 text-red-600" />
                        </button>
                      )}
                    </div>
                  )}

                  <img
                    src={
                      ing.imageurl ||
                      ing.ImageURL ||
                      "https://cdn-icons-png.flaticon.com/512/415/415733.png"
                    }
                    alt={ing.name || ing.Name}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                  <h2 className="font-semibold text-lg text-gray-800">{ing.name || ing.Name}</h2>
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
