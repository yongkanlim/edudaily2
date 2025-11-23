import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";

export default function AddRecipeRequest() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [dietCategory, setDietCategory] = useState([]);
  const [cuisineType, setCuisineType] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [goal, setGoal] = useState([]);
  const [instructions, setInstructions] = useState([{ step: "", image: null, preview: null }]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoURL, setVideoURL] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [instructionImage, setInstructionImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const dietOptions = ["Vegetarian", "Vegan", "Pescatarian", "Halal", "Low-Carb"];
  const cuisineOptions = ["Malay", "Chinese", "Indian", "Western", "Thai", "Japanese", "Korean"];
  const allergyOptions = ["Gluten", "Dairy", "Egg", "Nut", "Soy", "Shell-fish"];
  const goalOptions = ["Weight loss", "Quick meals", "Healthy eating", "Weight gain"];

  const [ingredients, setIngredients] = useState([{ name: "", quantity: "" }]);

  function addIngredient() {
  setIngredients([...ingredients, { name: "", quantity: "" }]);
}

function removeIngredient(index) {
  const updated = [...ingredients];
  updated.splice(index, 1);
  setIngredients(updated);
}

function handleIngredientChange(index, field, value) {
  const updated = [...ingredients];
  updated[index][field] = value;
  setIngredients(updated);
}

  // Multi-select toggle
  function toggleOption(option, selected, setSelected) {
    if (selected.includes(option)) {
      setSelected(selected.filter((o) => o !== option));
    } else {
      setSelected([...selected, option]);
    }
  }

  // Dynamic instruction steps
  function addStep() {
    setInstructions([...instructions, { step: "", image: null, preview: null }]);
  }

  function removeStep(index) {
    const updated = [...instructions];
    updated.splice(index, 1);
    setInstructions(updated);
  }

  function handleStepChange(index, field, value) {
    const updated = [...instructions];
    updated[index][field] = value;
    setInstructions(updated);
  }

  async function uploadFile(file, folder) {
    if (!file) return null;
    const fileName = `${folder}_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("recipe-images").upload(fileName, file);
    if (error) return null;
    return supabase.storage.from("recipe-images").getPublicUrl(fileName).data.publicUrl;
  }

  async function submitRequest(e) {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");

    try {
      const imageURL = await uploadFile(imageFile, "recipe");

      // Upload all instruction step images
      const stepsWithImages = await Promise.all(
        instructions.map(async (inst) => ({
          step: inst.step,
          image: inst.image ? await uploadFile(inst.image, "instruction") : null,
        }))
      );

      let videoFileURL = videoFile ? await uploadFile(videoFile, "video") : null;

      const { error } = await supabase.from("RecipeRequest").insert([
        {
            title,
            description,
            estimatedtime: estimatedTime || null,
            dietarycategory: dietCategory.length ? dietCategory.join(", ") : null,
            cuisinetype: cuisineType.length ? cuisineType.join(", ") : null,
            allergies: allergies.length ? allergies.join(", ") : null,
            goal: goal.length ? goal.join(", ") : null,
            ingredientstext: JSON.stringify(ingredients), // <-- store ingredients as JSON
            instructions: JSON.stringify(stepsWithImages),
            imageurl: imageURL,
            videourl: videoFileURL || videoURL || null,
            status: "Pending",
            userid: (await supabase.auth.getUser()).data.user?.id,
        },
        ]);


      if (error) throw error;

      setSuccessMsg("🎉 Recipe request submitted successfully!");
      // Reset form
      setTitle(""); setDescription(""); setEstimatedTime("");
      setDietCategory([]); setCuisineType([]); setAllergies([]); setGoal([]);
      setInstructions([{ step: "", image: null, preview: null }]);
      setVideoFile(null); setVideoURL(""); setImageFile(null); setImagePreview(null);
    } catch (err) {
      console.error(err.message);
    }

    setLoading(false);
  }

  // Styled file input component
  function FileInput({ label, file, setFile }) {
    return (
      <div>
        <label className="font-semibold mb-2 block">{label}</label>
        <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer border border-gray-300">
          <span>Select File</span>
          <input
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>
        {file && <p className="mt-2 text-sm text-gray-500">{file.name}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6 mt-8">
        <h1 className="text-3xl font-bold text-orange-700 mb-6">📝 Submit a New Recipe Request</h1>
        {successMsg && (
          <p className="bg-green-100 text-green-700 p-3 rounded mb-4">{successMsg}</p>
        )}

        <form className="space-y-6" onSubmit={submitRequest}>
          <div>
            <label className="font-semibold">Recipe Title</label>
            <input
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-orange-300 outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="font-semibold">Description</label>
            <textarea
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-orange-300 outline-none"
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Estimated Time (Minutes)</label>
              <input
                type="number"
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-orange-300 outline-none"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
              />
            </div>
          </div>

          {/* Multi-select options */}
          <div>
            <label className="font-semibold">Dietary Category</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {dietOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleOption(opt, dietCategory, setDietCategory)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                    dietCategory.includes(opt)
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold">Cuisine Type</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {cuisineOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleOption(opt, cuisineType, setCuisineType)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                    cuisineType.includes(opt)
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold">Allergies</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {allergyOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleOption(opt, allergies, setAllergies)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                    allergies.includes(opt)
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold">Goal</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {goalOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleOption(opt, goal, setGoal)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                    goal.includes(opt)
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <FileInput label="Recipe Image" file={imageFile} setFile={(f) => { setImageFile(f); setImagePreview(f ? URL.createObjectURL(f) : null); }} />
          {imagePreview && <img src={imagePreview} alt="Recipe Preview" className="mt-3 w-48 h-48 object-cover rounded-lg border" />}

<div>
  <label className="font-semibold">Ingredients</label>
  {ingredients.map((ing, i) => (
    <div key={i} className="flex gap-2 mb-2">
      <input
        type="text"
        placeholder="Ingredient Name"
        className="border p-2 rounded-lg w-1/2 focus:ring-2 focus:ring-orange-300 outline-none"
        value={ing.name}
        onChange={(e) => handleIngredientChange(i, "name", e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Quantity"
        className="border p-2 rounded-lg w-1/2 focus:ring-2 focus:ring-orange-300 outline-none"
        value={ing.quantity}
        onChange={(e) => handleIngredientChange(i, "quantity", e.target.value)}
        required
      />
      {ingredients.length > 1 && (
        <button
          type="button"
          onClick={() => removeIngredient(i)}
          className="px-2 bg-red-100 hover:bg-red-200 rounded text-red-700"
        >
          Remove
        </button>
      )}
    </div>
  ))}
  <button
    type="button"
    onClick={addIngredient}
    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium mt-2"
  >
    + Add Ingredient
  </button>
</div>

          {/* Cooking Instructions Steps */}
<div>
  <label className="font-semibold">Cooking Instructions</label>
  {instructions.map((inst, i) => (
    <div key={i} className="border p-4 rounded-lg mb-4">
      <textarea
        className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-orange-300 outline-none mb-2"
        rows="3"
        placeholder={`Step ${i + 1}`}
        value={inst.step}
        onChange={(e) => handleStepChange(i, "step", e.target.value)}
      />
      <FileInput
        label="Step Image (Optional)"
        file={inst.image}
        setFile={(f) => {
          handleStepChange(i, "image", f);
          handleStepChange(i, "preview", f ? URL.createObjectURL(f) : null);
        }}
      />
      {inst.preview && (
        <img
          src={inst.preview}
          alt={`Step ${i + 1} Preview`}
          className="mt-2 w-32 h-32 object-cover rounded"
        />
      )}
    </div>
  ))}

  {/* Add / Remove Step Buttons */}
  <div className="flex gap-2">
    <button
      type="button"
      onClick={addStep}
      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium"
    >
      + Add Step
    </button>
    {instructions.length > 1 && (
      <button
        type="button"
        onClick={() => removeStep(instructions.length - 1)}
        className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 font-medium"
      >
        - Remove Step
      </button>
    )}
  </div>
</div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FileInput label="Upload Tutorial Video (Optional)" file={videoFile} setFile={setVideoFile} />
            </div>
            <div>
              <label className="font-semibold">Or Enter Video URL</label>
              <input
                type="url"
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-orange-300 outline-none"
                placeholder="https://..."
                value={videoURL}
                onChange={(e) => setVideoURL(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-orange-700 transition w-full"
          >
            {loading ? "Submitting..." : "Submit Recipe Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
