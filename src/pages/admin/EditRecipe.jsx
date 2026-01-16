import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import Navbar from "../../components/Navbar";
import { useParams, useNavigate } from "react-router-dom";

export default function EditRecipe() {
  const { recipeId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recipeImage, setRecipeImage] = useState(null);
  const [recipeImagePreview, setRecipeImagePreview] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");

  const [instructions, setInstructions] = useState([{ text: "", image: null, imagePreview: null }]);
  const [ingredients, setIngredients] = useState([{ name: "", quantity: "", unit: "", averagePrice: "", image: null, imagePreview: null }]);
  const [dietaryCategories, setDietaryCategories] = useState([]);
  const [cuisineTypes, setCuisineTypes] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [goals, setGoals] = useState([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState({ dietary: false, cuisine: false, allergy: false, goal: false });
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  const defaultDietary = ["Vegetarian","Vegan","Pescatarian","High-Protein","Halal","Low-Carb"];
  const defaultAllergies = ["Gluten","Legumes","Grain","Fruit","Nut","Shell-fish","Dairy","Egg","Soy"];
  const defaultCuisine = ["Malay","Chinese","Indian","Western","Thai","Japanese","Korean"];
  const defaultGoals = ["Weight loss","Quick meals","Healthy eating","Weight gain"];

  const [ingredientOptions, setIngredientOptions] = useState([]);

  // Get logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }

      const { data: userData, error } = await supabase
        .from("users")
        .select("userid")
        .eq("email", session.user.email)
        .single();
      if (!error && userData) setUserId(userData.userid);
    };
    fetchUser();
  }, []);

  // Fetch recipe data
  useEffect(() => {
    const fetchRecipe = async () => {
      if (!recipeId) return;
      setLoading(true);

      const { data: recipeData, error } = await supabase
        .from("recipe")
        .select("*")
        .eq("recipeid", recipeId)
        .single();

      if (error || !recipeData) { alert("Failed to fetch recipe"); setLoading(false); return; }

      setTitle(recipeData.title);
      setDescription(recipeData.description);
      setRecipeImage(recipeData.imageurl);
      setRecipeImagePreview(recipeData.imageurl);
      setEstimatedTime(recipeData.estimatedtime || "");
      setEstimatedCost(recipeData.estimatedcost || "");
      setDietaryCategories(recipeData.dietarycategory ? recipeData.dietarycategory.split(", ") : []);
      setCuisineTypes(recipeData.cuisinetype ? recipeData.cuisinetype.split(", ") : []);
      setAllergies(recipeData.allergies ? recipeData.allergies.split(", ") : []);
      setGoals(recipeData.goal ? recipeData.goal.split(", ") : []);

      // Instructions: parse text & images
      if (recipeData.instructions) {
        const lines = recipeData.instructions.split("\n").map(line => {
          const imgMatch = line.match(/<img src="(.+?)"/);
          return {
            text: line.replace(/^\d+\. /, "").replace(/<img.*?>/,""),
            image: imgMatch ? imgMatch[1] : null,
            imagePreview: imgMatch ? imgMatch[1] : null
          };
        });
        setInstructions(lines.length ? lines : [{ text: "", image: null, imagePreview: null }]);
      }

      // Fetch tutorial video
      const { data: tutorialData } = await supabase
        .from("tutorial")
        .select("*")
        .eq("recipeid", recipeId)
        .single();
      if (tutorialData) {
        setVideoUrl(tutorialData.videourl || "");
        setVideoDescription(tutorialData.description || "");
      }

      // Fetch recipe ingredients
      const { data: recipeIng } = await supabase
        .from("recipeingredient")
        .select("quantityrequired, ingredient(* )")
        .eq("recipeid", recipeId);

      if (recipeIng && recipeIng.length) {
        const ingData = recipeIng.map(r => ({
          name: r.ingredient.name,
          quantity: r.quantityrequired,
          unit: r.ingredient.unit,
          averagePrice: r.ingredient.averageprice,
          image: r.ingredient.imageurl,
          imagePreview: r.ingredient.imageurl
        }));
        setIngredients(ingData.length ? ingData : [{ name: "", quantity: "", unit: "", averagePrice: "", image: null, imagePreview: null }]);
      }

      setLoading(false);
    };

    fetchRecipe();
  }, [recipeId]);

  // Fetch all ingredients for autocomplete
  useEffect(() => {
    const fetchIngredients = async () => {
      const { data, error } = await supabase
        .from("ingredient")
        .select("ingredientid, name, averageprice, unit");
      if (!error && data) setIngredientOptions(data);
    };
    fetchIngredients();
  }, []);

  // --- The image upload & add/remove handlers are the same as AddRecipe ---
  const handleRecipeImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = `${Date.now()}_${file.name}`;
    setLoading(true);
    const { error } = await supabase.storage.from("recipe-images").upload(fileName, file);
    if (error) { alert("Failed to upload recipe image!"); setLoading(false); return; }

    const { data } = supabase.storage.from("recipe-images").getPublicUrl(fileName);
    setRecipeImage(data.publicUrl);
    setRecipeImagePreview(URL.createObjectURL(file));
    setLoading(false);
  };

  const handleInstructionImageUpload = async (file, index) => {
    if (!file) return;
    const fileName = `${Date.now()}_${file.name}`;
    setLoading(true);
    const { error } = await supabase.storage.from("recipe-images").upload(fileName, file);
    if (error) { alert("Failed to upload instruction image!"); setLoading(false); return; }

    const { data } = supabase.storage.from("recipe-images").getPublicUrl(fileName);
    setInstructions(prev =>
      prev.map((inst, i) => i === index ? { ...inst, image: data.publicUrl, imagePreview: URL.createObjectURL(file) } : inst)
    );
    setLoading(false);
  };

  const handleIngredientImageUpload = async (file, index) => {
    if (!file) return;
    const fileName = `${Date.now()}_${file.name}`;
    setLoading(true);
    const { error } = await supabase.storage.from("ingredientimg").upload(fileName, file);
    if (error) { alert("Failed to upload ingredient image!"); setLoading(false); return; }

    const { data } = supabase.storage.from("ingredientimg").getPublicUrl(fileName);
    setIngredients(prev =>
      prev.map((ing, i) => i === index ? { ...ing, image: data.publicUrl, imagePreview: URL.createObjectURL(file) } : ing)
    );
    setLoading(false);
  };

  const addInstruction = () => setInstructions([...instructions, { text: "", image: null, imagePreview: null }]);
  const removeInstruction = (index) => setInstructions(instructions.filter((_, i) => i !== index));
  const addIngredient = () => setIngredients([...ingredients, { name: "", quantity: "", unit: "", averagePrice: "", image: null, imagePreview: null }]);
  const removeIngredient = (index) => setIngredients(ingredients.filter((_, i) => i !== index));

  const handleIngredientNameChange = (value, index) => {
    const matched = ingredientOptions.find((ing) => ing.name.toLowerCase() === value.toLowerCase());
    setIngredients((prev) =>
      prev.map((i, idx) =>
        idx === index
          ? { ...i, name: value, unit: matched ? matched.unit : i.unit, averagePrice: matched ? matched.averageprice : i.averagePrice }
          : i
      )
    );
  };

  const ingredientExists = (name) => ingredientOptions.some(ing => ing.name.toLowerCase() === name.toLowerCase());

  const CategorySelector = ({ title, items, selected, setSelected, type }) => (
    <div className="mb-4">
      <h4 className="font-semibold mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {[...items, ...selected.filter(s => !items.includes(s))].map(item => (
          <div key={item} onClick={() => selected.includes(item) ? setSelected(selected.filter(t => t !== item)) : setSelected([...selected, item])}
            className={`px-3 py-1 rounded-full cursor-pointer border text-sm transition ${selected.includes(item) ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}>
            {item}
          </div>
        ))}
        <div onClick={() => setShowNewCategoryInput({ ...showNewCategoryInput, [type]: true })}
          className="px-3 py-1 rounded-full cursor-pointer border border-dashed text-gray-500 hover:bg-gray-100 text-sm">
          + Add
        </div>
      </div>
      {showNewCategoryInput[type] && (
        <input type="text" autoFocus placeholder={`Add new ${title}`}
          className="mt-2 px-3 py-2 border rounded-md w-full focus:ring-2 focus:ring-orange-400 outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const val = e.target.value.trim();
              if (val && !selected.includes(val)) setSelected([...selected, val]);
              setShowNewCategoryInput({ ...showNewCategoryInput, [type]: false });
            }
          }}
          onBlur={() => setShowNewCategoryInput({ ...showNewCategoryInput, [type]: false })}
        />
      )}
    </div>
  );

  // Submit updates
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) { alert("Please fill in title and description!"); return; }
    setLoading(true);

    const instructionText = instructions.map((inst, i) => {
      const imgTag = inst.image ? `<img src="${inst.image}" />` : "";
      return `${i + 1}. ${inst.text}${imgTag}`;
    }).join("\n");

    // Update recipe
    const { error: recipeError } = await supabase.from("recipe").update({
      title: title.trim(),
      description: description.trim(),
      instructions: instructionText,
      estimatedtime: estimatedTime ? parseInt(estimatedTime) : null,
      estimatedcost: estimatedCost ? parseFloat(estimatedCost) : null,
      dietarycategory: dietaryCategories.join(", ") || null,
      cuisinetype: cuisineTypes.join(", ") || null,
      allergies: allergies.join(", ") || null,
      goal: goals.join(", ") || null,
      imageurl: recipeImage || null,
    }).eq("recipeid", recipeId);

    if (recipeError) { alert("Failed to update recipe!"); console.error(recipeError); setLoading(false); return; }

    // Update tutorial video
    if (videoUrl.trim()) {
      const { data: existingVideo } = await supabase.from("tutorial").select("*").eq("recipeid", recipeId).single();
      if (existingVideo) {
        await supabase.from("tutorial").update({
          title: `${title} Tutorial`,
          videourl: videoUrl.trim(),
          description: videoDescription.trim() || null
        }).eq("tutorialid", existingVideo.tutorialid);
      } else {
        await supabase.from("tutorial").insert({
          title: `${title} Tutorial`,
          videourl: videoUrl.trim(),
          description: videoDescription.trim() || null,
          recipeid: recipeId,
          userid: userId
        });
      }
    }

    // Update ingredients
    await supabase.from("recipeingredient").delete().eq("recipeid", recipeId); // clear old ingredients

    for (let ing of ingredients) {
      if (!ing.name.trim()) continue;

      let { data: existing, error: ingError } = await supabase.from("ingredient").select("ingredientid").eq("name", ing.name.trim()).single();
      let ingredientId;

      if (existing) {
        ingredientId = existing.ingredientid;
        if (ing.image) {
          await supabase.from("ingredient").update({ imageurl: ing.image }).eq("ingredientid", ingredientId);
        }
      } else {
        const { data: newIng } = await supabase.from("ingredient").insert([{
          name: ing.name.trim(),
          averageprice: ing.averagePrice ? parseFloat(ing.averagePrice) : 0,
          unit: ing.unit || "",
          imageurl: ing.image || null
        }]).select().single();
        ingredientId = newIng.ingredientid;
      }

      await supabase.from("recipeingredient").insert([{
        recipeid: recipeId,
        ingredientid: ingredientId,
        quantityrequired: ing.quantity ? parseFloat(ing.quantity) : 0
      }]);
    }

    setLoading(false);
    alert("Recipe updated successfully!");
    navigate("/recipe/" + recipeId); // redirect to recipe page
  };

  // --- UI is identical to AddRecipe, just using the states above ---
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Recipe</h1>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-md">
          {/* Title & Description */}
          <input type="text" placeholder="Recipe Title" value={title} onChange={(e)=>setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-400 outline-none" />
          <textarea rows="4" placeholder="Recipe description" value={description} onChange={(e)=>setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-400 outline-none resize-none" />

          {/* Recipe Image */}
          <div>
            <label className="block mb-2 font-semibold">Recipe Main Image</label>
            <label className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-md cursor-pointer hover:bg-blue-200 transition mt-2">
              {recipeImagePreview ? "Change Image" : "Upload Image"}
              <input type="file" accept="image/*" onChange={handleRecipeImageUpload} className="hidden"/>
            </label>
            {recipeImagePreview && <img src={recipeImagePreview} alt="Preview" className="mt-3 w-64 h-64 object-cover rounded-md border" />}
          </div>

          {/* Video URL */}
          <div>
            <label className="block mb-2 font-semibold">Video URL (Optional)</label>
            <input type="url" placeholder="https://" value={videoUrl} onChange={(e)=>setVideoUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-400 outline-none" />
          </div>

          {/* Video Description */}
          <div>
            <label className="block mb-2 font-semibold">Video Description (Optional)</label>
            <textarea rows="3" placeholder="Add a description for the tutorial video" value={videoDescription} onChange={(e)=>setVideoDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-400 outline-none resize-none" />
          </div>

          {/* Time & Cost */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block mb-2 font-semibold">Estimated Time (minutes)</label>
              <input type="number" placeholder="e.g., 30" value={estimatedTime} onChange={(e)=>setEstimatedTime(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-400 outline-none"/>
            </div>
            <div className="flex-1">
              <label className="block mb-2 font-semibold">Estimated Cost (RM)</label>
              <input type="number" placeholder="e.g., 10" value={estimatedCost} onChange={(e)=>setEstimatedCost(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-400 outline-none"/>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h4 className="font-semibold mb-2">Instructions</h4>
            {instructions.map((inst, index)=>(
              <div key={index} className="mb-4 border p-3 rounded-md">
                <textarea rows="2" placeholder={`Step ${index + 1}`} value={inst.text}
                  onChange={(e)=>setInstructions(prev=>prev.map((i,idx)=>(idx===index?{...i,text:e.target.value}:i)))}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-400 outline-none resize-none" />
                <label className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md cursor-pointer hover:bg-blue-200 transition mt-2">
                  {inst.imagePreview ? "Change Step Image" : "Upload Step Image"}
                  <input type="file" accept="image/*" onChange={(e)=>handleInstructionImageUpload(e.target.files[0], index)} className="hidden"/>
                </label>
                {instructions.length > 1 && <button type="button" onClick={()=>removeInstruction(index)}
                  className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-md cursor-pointer hover:bg-blue-200 transition mt-2 ml-3">
                  Remove Step
                </button>}
                {inst.imagePreview && <img src={inst.imagePreview} alt="Preview" className="mt-2 w-48 h-48 object-cover rounded-md border" />}
              </div>
            ))}
            <button type="button" onClick={addInstruction} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition">+ Add Step</button>
          </div>

          {/* Ingredients */}
          <div>
            <h4 className="font-semibold mb-2">Ingredients</h4>
            <h4 className="mb-2 text-gray-500 text-sm">
              Upload an image only if the ingredient list is empty.
            </h4>
            <datalist id="ingredient-list">
              {ingredientOptions.map((ing) => (
                <option key={ing.ingredientid} value={ing.name} />
              ))}
            </datalist>

            {ingredients.map((ing, idx)=>(
              <div key={idx} className="mb-3">
                <div className="flex gap-2 mb-1">
                  <input type="text" list="ingredient-list" placeholder="Ingredient" value={ing.name} onChange={(e) => handleIngredientNameChange(e.target.value, idx)}
                    className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-400 outline-none" />
                  {ing.name && !ingredientExists(ing.name) && (
                    <span className="text-xs text-orange-600 ml-1 border border-gray-300 rounded-md p-2 flex items-center justify-center">
                      New ingredient (will be added)</span>
                  )}
                  <input type="text" placeholder="Quantity" value={ing.quantity} onChange={e=>setIngredients(prev=>prev.map((i,index)=>(index===idx?{...i,quantity:e.target.value}:i)))}
                    className="w-20 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-400 outline-none"/>
                  <input type="text" placeholder="Unit" value={ing.unit} onChange={e=>setIngredients(prev=>prev.map((i,index)=>(index===idx?{...i,unit:e.target.value}:i)))}
                    className="w-20 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-400 outline-none"/>
                  <input type="number" placeholder="Avg Price" value={ing.averagePrice} onChange={e=>setIngredients(prev=>prev.map((i,index)=>(index===idx?{...i,averagePrice:e.target.value}:i)))}
                    className="w-24 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-400 outline-none"/>
                  <label className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md cursor-pointer text-sm hover:bg-gray-200">
                    Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleIngredientImageUpload(e.target.files[0], idx)} />
                  </label>
                  {ing.imagePreview && (
                    <img src={ing.imagePreview} alt="Ingredient" className="mt-2 w-20 h-20 object-cover rounded-md border"/>
                  )}
                  {ingredients.length > 1 && <button type="button" onClick={()=>removeIngredient(idx)} className="text-red-500 hover:underline">✕</button>}
                  
                </div>
              </div>
            ))}
            <button type="button" onClick={addIngredient} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition">+ Add Ingredient</button>
          </div>

          <CategorySelector title="Dietary Categories" items={defaultDietary} selected={dietaryCategories} setSelected={setDietaryCategories} type="dietary"/>
          <CategorySelector title="Allergies" items={defaultAllergies} selected={allergies} setSelected={setAllergies} type="allergy"/>
          <CategorySelector title="Cuisine Type" items={defaultCuisine} selected={cuisineTypes} setSelected={setCuisineTypes} type="cuisine"/>
          <CategorySelector title="Goals" items={defaultGoals} selected={goals} setSelected={setGoals} type="goal"/>

          <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-orange-700 transition">
            {loading ? "Updating..." : "Update Recipe"}
          </button>
        </form>
      </div>
    </div>
  );
}
