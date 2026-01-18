import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";
import RecipeFeedback from "../components/RecipeFeedback";

export default function RecipeDetail() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [baseIngredients, setBaseIngredients] = useState([]); // store original for scaling
  const [serving, setServing] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tutorial, setTutorial] = useState(null);

  useEffect(() => {
    fetchRecipeDetail();
  }, [id]);

async function fetchRecipeDetail() {
  try {
    // Fetch main recipe details
    const { data: recipeData, error: recipeError } = await supabase
      .from("recipe")
      .select("*")
      .eq("recipeid", id)
      .single();

    if (recipeError) throw recipeError;

    setRecipe({
      ...recipeData,
      instructions: recipeData.instructions?.replace(/\n/g, "<br>"),
    });

    // Fetch ingredients
    const { data: ingredientData, error: ingError } = await supabase
      .from("recipeingredient")
      .select(
        "quantityrequired, ingredient:ingredientid(name, averageprice, unit)"
      )
      .eq("recipeid", id);

    if (ingError) throw ingError;

    const formatted = ingredientData.map((item) => {
  const unit = item.ingredient.unit?.toLowerCase();
  const quantity = Number(item.quantityrequired);
  const avgPrice = Number(item.ingredient.averageprice);

  let estimatedCost = 0;

  // Only calculate cost for units that can be measured accurately
  const calculableUnits = ["kg", "pack", "liter", "can", "block"];

  if (calculableUnits.includes(unit)) {
    estimatedCost = quantity * avgPrice;
  }

  return {
    name: item.ingredient.name,
    unit,
    unitPrice: avgPrice, // always use real average price
    quantity,
    estimatedCost,
  };
});


    setIngredients(formatted);
    setBaseIngredients(formatted);

    // Fetch tutorial
    const { data: tutorialData, error: tutError } = await supabase
      .from("tutorial")
      .select("videourl, title, description")
      .eq("recipeid", id)
      .single();

    if (!tutError && tutorialData) {
      setTutorial(tutorialData);
    }
  } catch (err) {
    console.error("❌ Error loading recipe detail:", err.message);
  } finally {
    setLoading(false);
  }
}


// Update ingredients when serving changes
function handleServingChange(e) {
  const newServing = parseFloat(e.target.value);
  if (isNaN(newServing) || newServing <= 0) return;

  setServing(newServing);

  const scaled = baseIngredients.map((ing) => {
    const quantity = ing.quantity * newServing;

    let estimatedCost = 0;
    if (ing.unitPrice > 0) {
      estimatedCost = quantity * ing.unitPrice;
    }

    return {
      ...ing,
      quantity,
      estimatedCost,
    };
  });

  setIngredients(scaled);
}


  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!recipe) return <p className="text-center mt-10 text-gray-500">Recipe not found.</p>;

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Breadcrumb (now clickable links) */}
      <div className="max-w-6xl mx-auto mt-6 px-6 text-sm text-gray-500">
        <p className="flex items-center gap-1">
          <Link to="/" className="text-orange-600 hover:underline">Home</Link> /
          <Link to="/recipes" className="text-orange-600 hover:underline">Recipe</Link> /
          <span className="text-orange-800 font-semibold">{recipe.title}</span>
        </p>
      </div>

      {/* Recipe Info Card */}
      <section className="max-w-6xl mx-auto mt-6 bg-orange-50 rounded-lg shadow p-6 flex flex-col md:flex-row justify-between gap-6">
        {/* Left Info */}
        <div className="flex-1 space-y-3">
          <h1 className="text-3xl font-bold text-gray-800">{recipe.title}</h1>
          <div className="flex items-center gap-4 text-gray-700">
            <span>⏱ {recipe.estimatedtime} minutes</span>
            <span>💰 RM {recipe.estimatedcost}</span>
          </div>

          {/* Serving Input */}
          <div className="flex items-center gap-3">
            <span className="font-medium">Serving:</span>
            <input
              type="number"
              min="1"
              value={serving}
              onChange={handleServingChange}
              className="w-16 border border-gray-300 rounded-md text-center"
            />
          </div>

          <p className="text-gray-700 font-medium">🌏 {recipe.cuisinetype}</p>
          <p className="text-gray-600">
            🧾 {recipe.allergies || "No listed allergies"}
          </p>

          <div className="flex gap-3 mt-4">
            <button className="bg-orange-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-orange-700 transition">
              Print
            </button>
            <div className="flex items-center gap-2 text-orange-600">
              ⭐⭐⭐⭐⭐
              <span className="text-gray-600">(4.8)</span>
            </div>
          </div>
        </div>

        {/* Right Image */}
        <div className="md:w-1/3">
          <img
            src={
              recipe.imageurl ||
              "https://cdn-icons-png.flaticon.com/512/857/857681.png"
            }
            alt={recipe.title}
            className="w-full rounded-lg shadow-md object-cover"
          />
        </div>
      </section>

      {/* Ingredients Table */}
      <section className="max-w-6xl mx-auto mt-8 px-6 pb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          🧂 Ingredient List
        </h2>
        <table className="w-full border border-gray-200 rounded-lg overflow-hidden text-left shadow-sm">
          <thead className="bg-orange-100 text-gray-800">
            <tr>
              <th className="py-3 px-4">Ingredient</th>
              <th className="py-3 px-4">Quantity</th>
              <th className="py-3 px-4">Unit Price (RM)</th>
              <th className="py-3 px-4">Estimated Cost (RM)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ingredients.map((ing, index) => (
              <tr key={index} className="hover:bg-orange-50">
                <td className="py-3 px-4">{ing.name}</td>
                <td className="pl-5">
                  {ing.quantity.toFixed(2)} {ing.unit}
                </td>

                <td className="py-3 px-4">
                  RM {ing.unitPrice?.toFixed(2)} / {ing.unit}
                </td>
                <td className="py-3 px-4">
                  RM {ing.estimatedCost?.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Instructions Section */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          🍳 Cooking Instructions
        </h2>
        <div
  className="bg-gray-50 border border-gray-200 rounded-lg p-5 shadow-sm leading-relaxed text-gray-700"
  dangerouslySetInnerHTML={{
    __html: recipe.instructions || "No instructions available for this recipe.",
  }}
/>

      </section>

      {/* Video Tutorial Section */}
{tutorial && (
  <section className="max-w-6xl mx-auto px-6 pb-20">
    <h2 className="text-2xl font-semibold text-gray-800 mb-3">
      🎥 Video Tutorial
    </h2>
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 shadow-sm">
      <h3 className="text-xl font-bold text-gray-700 mb-2">
        {tutorial.title}
      </h3>
      <p className="text-gray-600 mb-4">{tutorial.description}</p>
      <div className="relative w-full pb-[56.25%] overflow-hidden rounded-lg shadow">
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src={tutorial.videourl}
          title={tutorial.title}
          allowFullScreen
        ></iframe>
      </div>

    </div>
  </section>
)}

<RecipeFeedback
  recipeId={recipe.recipeid}
  userId={recipe.userid}
/>
    </div>

  );
}
