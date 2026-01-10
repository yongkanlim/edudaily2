import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import Navbar from "../../components/Navbar";
import { useNavigate, useParams } from "react-router-dom";

export default function EditIngredient() {
  const navigate = useNavigate();
  const { id } = useParams(); // ingredient id
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [averagePrice, setAveragePrice] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const ingredientTypes = [
    "Vegetables","Fruits","Meats","Chicken","Beef","Lamb","Pork","Seafood",
    "Dairy Products","Grains & Cereals","Herbs & Spices","Oils & Fats",
    "Legumes & Beans","Nuts & Seeds","Sauces & Condiments","Baking Ingredients","Beverages",
  ];

  useEffect(() => {
    fetchIngredient();
  }, [id]);

  const fetchIngredient = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ingredient")
      .select("*")
      .eq("ingredientid", id)
      .single();

    if (error) {
      alert("Failed to fetch ingredient!");
      console.error(error);
      navigate("/admin/ingredientpage");
    } else {
      setName(data.name);
      setUnit(data.unit);
      setAveragePrice(data.averageprice);
      setImage(data.imageurl);
      setImagePreview(data.imageurl);
      setCategories(data.category ? data.category.split(",") : []);
    }
    setLoading(false);
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("ingredientimg")
      .upload(fileName, file, { upsert: true });

    if (error) {
      alert("Failed to upload image!");
      setLoading(false);
      return;
    }

    const { data } = supabase.storage
      .from("ingredientimg")
      .getPublicUrl(fileName);

    setImage(data.publicUrl);
    setImagePreview(URL.createObjectURL(file));
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter ingredient name");
      return;
    }

    setLoading(true);

    // Prevent duplicate name for other ingredients
    const { data: existing } = await supabase
      .from("ingredient")
      .select("ingredientid")
      .eq("name", name.trim())
      .neq("ingredientid", id)
      .single();

    if (existing) {
      alert("Another ingredient with this name already exists!");
      setLoading(false);
      return;
    }

    const categoryString = categories.join(",");
    if (categoryString.length > 255) {
      alert("Selected categories are too long. Reduce selection.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("ingredient")
      .update({
        name: name.trim(),
        unit: unit.trim() || "",
        averageprice: averagePrice ? parseFloat(averagePrice) : 0,
        imageurl: image || null,
        category: categoryString || null,
      })
      .eq("ingredientid", id);

    setLoading(false);

    if (error) {
      alert("Failed to update ingredient!");
      console.error(error);
      return;
    }

    alert("Ingredient updated successfully!");
    navigate("/admin/ingredientpage");
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Ingredient</h1>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-md">
          {/* Name */}
          <div>
            <label className="block mb-2 font-semibold">Ingredient Name</label>
            <input
              type="text"
              placeholder="e.g., Carrot"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-400 outline-none"
            />
          </div>
          {/* Unit & Price */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block mb-2 font-semibold">Unit</label>
              <input
                type="text"
                placeholder="e.g., 1kg, pcs"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-400 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block mb-2 font-semibold">Average Price (RM)</label>
              <input
                type="number"
                placeholder="e.g., 5.50"
                value={averagePrice}
                onChange={(e) => setAveragePrice(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-400 outline-none"
              />
            </div>
          </div>
          {/* Categories */}
          <div>
            <label className="block mb-2 font-semibold">Categories</label>
            <div className="flex flex-wrap gap-2">
              {ingredientTypes.map((type) => (
                <div
                  key={type}
                  onClick={() =>
                    categories.includes(type)
                      ? setCategories(categories.filter((c) => c !== type))
                      : setCategories([...categories, type])
                  }
                  className={`px-3 py-1 rounded-full cursor-pointer border text-sm transition ${
                    categories.includes(type)
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {type}
                </div>
              ))}
            </div>
          </div>
          {/* Image */}
          <div>
            <label className="block mb-2 font-semibold">Ingredient Image</label>
            <label className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md cursor-pointer hover:bg-gray-200 transition">
              {imagePreview ? "Change Image" : "Upload Image"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files[0])}
                className="hidden"
              />
            </label>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-3 w-48 h-48 object-cover rounded-md border"
              />
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-orange-700 transition"
          >
            {loading ? "Updating..." : "Update Ingredient"}
          </button>
        </form>
      </div>
    </div>
  );
}
