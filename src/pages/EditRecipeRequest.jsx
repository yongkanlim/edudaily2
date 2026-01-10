import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";
import { useParams, useNavigate } from "react-router-dom";

export default function EditRecipeRequest() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recipeImage, setRecipeImage] = useState(null);
  const [recipeImagePreview, setRecipeImagePreview] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");

  const [instructions, setInstructions] = useState([
    { text: "", image: null, imagePreview: null },
  ]);

  const [ingredients, setIngredients] = useState([{ name: "", quantity: "" }]);

  const [dietaryCategories, setDietaryCategories] = useState([]);
  const [cuisineTypes, setCuisineTypes] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [goals, setGoals] = useState([]);

  const [showNewCategoryInput, setShowNewCategoryInput] = useState({
    dietary: false,
    cuisine: false,
    allergy: false,
    goal: false,
  });

  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);

  const defaultDietary = ["Vegetarian", "Vegan", "Pescatarian", "High-Protein", "Halal", "Low-Carb"];
  const defaultAllergies = ["Gluten", "Legumes", "Grain", "Fruit", "Nut", "Shell-fish", "Dairy", "Egg", "Soy"];
  const defaultCuisine = ["Malay", "Chinese", "Indian", "Western", "Thai", "Japanese", "Korean"];
  const defaultGoals = ["Weight loss", "Quick meals", "Healthy eating", "Weight gain"];

  // ✅ Get logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      const { data: userData, error } = await supabase
        .from("users")
        .select("userid")
        .eq("email", session.user.email)
        .single();
      if (!error && userData) setUserId(userData.userid);
    };
    fetchUser();
  }, []);

  // ✅ Fetch existing recipe request
  useEffect(() => {
    if (!userId) return;
    const fetchRequest = async () => {
      const { data, error } = await supabase
        .from("reciperequest")
        .select("*")
        .eq("requestid", id)
        .eq("userid", userId)
        .single();
      if (error || !data) {
        alert("Failed to fetch recipe request");
        navigate("/my-recipe-requests");
        return;
      }

      // Pre-fill form
      setTitle(data.title);
      setDescription(data.description);
      setRecipeImage(data.imageurl);
      setRecipeImagePreview(data.imageurl);
      setVideoUrl(data.videourl || "");
      setEstimatedTime(data.estimatedtime || "");

      // Parse instructions (extract image tags)
      if (data.instructions) {
        const parsedInstructions = data.instructions.split("\n").map((line) => {
          const imgMatch = line.match(/<img src="([^"]+)" \/>/);
          const text = line.replace(/<img src="[^"]+" \/>/, "").trim();
          return { text, image: imgMatch ? imgMatch[1] : null, imagePreview: imgMatch ? imgMatch[1] : null };
        });
        setInstructions(parsedInstructions.length > 0 ? parsedInstructions : [{ text: "", image: null, imagePreview: null }]);
      }

      // Parse ingredients
      if (data.ingredientstext) {
        const parsedIngredients = data.ingredientstext.split("\n").map((line) => {
          const [name, quantity] = line.split(",").map((s) => s.trim());
          return { name, quantity: quantity || "" };
        });
        setIngredients(parsedIngredients.length > 0 ? parsedIngredients : [{ name: "", quantity: "" }]);
      }

      // Categories
      setDietaryCategories(data.dietarycategory ? data.dietarycategory.split(", ").filter(Boolean) : []);
      setCuisineTypes(data.cuisinetype ? data.cuisinetype.split(", ").filter(Boolean) : []);
      setAllergies(data.allergies ? data.allergies.split(", ").filter(Boolean) : []);
      setGoals(data.goal ? data.goal.split(", ").filter(Boolean) : []);
    };
    fetchRequest();
  }, [id, userId, navigate]);

  // ✅ Recipe main image upload
  const handleRecipeImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = `${Date.now()}_${file.name}`;
    setLoading(true);
    const { error } = await supabase.storage.from("recipe-images").upload(fileName, file);
    if (error) {
      alert("Failed to upload recipe image!");
      setLoading(false);
      return;
    }
    const { data } = supabase.storage.from("recipe-images").getPublicUrl(fileName);
    setRecipeImage(data.publicUrl);
    setRecipeImagePreview(URL.createObjectURL(file));
    setLoading(false);
  };

  // ✅ Instruction image upload
  const handleInstructionImageUpload = async (file, index) => {
    if (!file) return;
    const fileName = `${Date.now()}_${file.name}`;
    setLoading(true);
    const { error } = await supabase.storage.from("recipe-images").upload(fileName, file);
    if (error) {
      alert("Failed to upload instruction image!");
      setLoading(false);
      return;
    }
    const { data } = supabase.storage.from("recipe-images").getPublicUrl(fileName);

    setInstructions((prev) =>
      prev.map((inst, i) =>
        i === index ? { ...inst, image: data.publicUrl, imagePreview: URL.createObjectURL(file) } : inst
      )
    );
    setLoading(false);
  };

  // ✅ Add/remove instruction
  const addInstruction = () => setInstructions([...instructions, { text: "", image: null, imagePreview: null }]);
  const removeInstruction = (index) => setInstructions(instructions.filter((_, i) => i !== index));

  // ✅ Add/remove ingredient
  const addIngredient = () => setIngredients([...ingredients, { name: "", quantity: "" }]);
  const removeIngredient = (index) => setIngredients(ingredients.filter((_, i) => i !== index));

  // ✅ Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Please fill in title and description!");
      return;
    }

    setLoading(true);
    const ingredientText = ingredients
      .filter((i) => i.name.trim())
      .map((i) => `${i.name.trim()}, ${i.quantity.trim()}`)
      .join("\n");

    const instructionText = instructions
      .map((inst) => `${inst.text}${inst.image ? `<img src="${inst.image}" />` : ""}`)
      .join("\n");

    const { error } = await supabase
      .from("reciperequest")
      .update({
        title: title.trim(),
        description: description.trim(),
        ingredientstext: ingredientText,
        instructions: instructionText,
        imageurl: recipeImage,
        videourl: videoUrl || null,
        dietarycategory: dietaryCategories.join(", ") || null,
        cuisinetype: cuisineTypes.join(", ") || null,
        allergies: allergies.join(", ") || null,
        goal: goals.join(", ") || null,
        estimatedtime: estimatedTime ? parseInt(estimatedTime) : null,
      })
      .eq("requestid", id);

    setLoading(false);
    if (error) {
      console.error(error);
      alert("Failed to update recipe request!");
    } else {
      alert("Recipe request updated successfully!");
      navigate("/my-recipe-requests");
    }
  };

  // ✅ Category selector (same as Add page)
  const CategorySelector = ({ title, items, selected, setSelected, type }) => (
    <div className="mb-4">
      <h4 className="font-semibold mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {[...items, ...selected.filter((s) => !items.includes(s))].map((item) => (
          <div
            key={item}
            onClick={() =>
              selected.includes(item)
                ? setSelected(selected.filter((t) => t !== item))
                : setSelected([...selected, item])
            }
            className={`px-3 py-1 rounded-full cursor-pointer border text-sm transition ${
              selected.includes(item)
                ? "bg-orange-600 text-white border-orange-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {item}
          </div>
        ))}

        <div
          onClick={() => setShowNewCategoryInput({ ...showNewCategoryInput, [type]: true })}
          className="px-3 py-1 rounded-full cursor-pointer border border-dashed text-gray-500 hover:bg-gray-100 text-sm"
        >
          + Add
        </div>
      </div>
      {showNewCategoryInput[type] && (
        <input
          type="text"
          autoFocus
          placeholder={`Add new ${title}`}
          className="mt-2 px-3 py-2 border rounded-md w-full focus:ring-2 focus:ring-orange-400 outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const val = e.target.value.trim();
              if (val && !selected.includes(val)) {
                setSelected([...selected, val]);
              }
              setShowNewCategoryInput({ ...showNewCategoryInput, [type]: false });
            }
          }}
          onBlur={() => setShowNewCategoryInput({ ...showNewCategoryInput, [type]: false })}
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Recipe Request</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-md">
          {/* Title */}
          <input
            type="text"
            placeholder="Recipe Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-400 outline-none"
          />

          {/* Description */}
          <textarea
            rows="4"
            placeholder="Recipe description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-400 outline-none resize-none"
          />

          {/* Recipe Main Image */}
          <div>
            <label className="block mb-2 font-semibold">Recipe Main Image</label>
            <label className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-md cursor-pointer hover:bg-blue-200 transition mt-2">
              {recipeImagePreview ? "Change Image" : "Upload Image"}
              <input type="file" accept="image/*" onChange={handleRecipeImageUpload} className="hidden" />
            </label>
            {recipeImagePreview && (
              <img src={recipeImagePreview} alt="Preview" className="mt-3 w-64 h-64 object-cover rounded-md border" />
            )}
          </div>

          {/* Video URL */}
          <div>
            <label className="block mb-2 font-semibold">Video URL (Optional)</label>
            <input
              type="url"
              placeholder="https://"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-400 outline-none"
            />
            {videoUrl && (
              <div className="mt-3 aspect-w-16 aspect-h-9">
                <iframe
                  src={videoUrl.replace("watch?v=", "embed/")}
                  title="Video Preview"
                  frameBorder="0"
                  allowFullScreen
                  className="w-full h-64 md:h-96 rounded-md"
                ></iframe>
              </div>
            )}
          </div>

          {/* Estimated Time */}
          <div>
            <label className="block mb-2 font-semibold">Estimated Time (minutes)</label>
            <input
              type="number"
              placeholder="e.g., 30"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-400 outline-none"
            />
          </div>

          {/* Instructions */}
          <div>
            <h4 className="font-semibold mb-2">Instructions</h4>
            {instructions.map((inst, index) => (
              <div key={index} className="mb-4 border p-3 rounded-md">
                <textarea
                  rows="2"
                  placeholder={`Step ${index + 1}`}
                  value={inst.text}
                  onChange={(e) =>
                    setInstructions((prev) => prev.map((i, idx) => (idx === index ? { ...i, text: e.target.value } : i)))
                  }
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-400 outline-none resize-none"
                />
                <label className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md cursor-pointer hover:bg-blue-200 transition mt-2">
                  {inst.imagePreview ? "Change Step Image" : "Upload Step Image"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleInstructionImageUpload(e.target.files[0], index)}
                    className="hidden"
                  />
                </label>

                {instructions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInstruction(index)}
                    className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-md cursor-pointer hover:bg-blue-200 transition mt-2 ml-3"
                  >
                    Remove Step
                  </button>
                )}
                {inst.imagePreview && (
                  <img src={inst.imagePreview} alt="Preview" className="mt-2 w-48 h-48 object-cover rounded-md border" />
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addInstruction}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition"
            >
              + Add Step
            </button>
          </div>

          {/* Ingredients */}
          <div>
            <h4 className="font-semibold mb-2">Ingredients</h4>
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Ingredient"
                  value={ing.name}
                  onChange={(e) =>
                    setIngredients((prev) =>
                      prev.map((i, index) => (index === idx ? { ...i, name: e.target.value } : i))
                    )
                  }
                  className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-400 outline-none"
                />
                <input
                  type="text"
                  placeholder="Quantity"
                  value={ing.quantity}
                  onChange={(e) =>
                    setIngredients((prev) =>
                      prev.map((i, index) => (index === idx ? { ...i, quantity: e.target.value } : i))
                    )
                  }
                  className="w-32 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-400 outline-none"
                />
                {ingredients.length > 1 && (
                  <button type="button" onClick={() => removeIngredient(idx)} className="text-red-500 hover:underline">
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addIngredient}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition"
            >
              + Add Ingredient
            </button>
          </div>

          {/* Categories */}
          <CategorySelector
            title="Dietary Categories"
            items={defaultDietary}
            selected={dietaryCategories}
            setSelected={setDietaryCategories}
            type="dietary"
          />
          <CategorySelector
            title="Allergies"
            items={defaultAllergies}
            selected={allergies}
            setSelected={setAllergies}
            type="allergy"
          />
          <CategorySelector
            title="Cuisine Type"
            items={defaultCuisine}
            selected={cuisineTypes}
            setSelected={setCuisineTypes}
            type="cuisine"
          />
          <CategorySelector
            title="Goals"
            items={defaultGoals}
            selected={goals}
            setSelected={setGoals}
            type="goal"
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-orange-700 transition"
          >
            {loading ? "Submitting..." : "Update Recipe Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
