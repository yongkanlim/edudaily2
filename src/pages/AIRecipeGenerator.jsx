import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import ingredientPrices from "../data/ingredient_prices.json";
import Navbar from "../components/Navbar";

export default function AIRecipeGenerator() {
  const [loading, setLoading] = useState(false);
  const [recipeData, setRecipeData] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState("");

  const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
  const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

  /* ------------------------------------
     HELPERS
  ------------------------------------ */
  const fetchUnsplashImage = async (query) => {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          query
        )}&per_page=1&client_id=${UNSPLASH_ACCESS_KEY}`
      );
      const data = await res.json();
      return data.results?.[0]?.urls?.regular || "";
    } catch {
      return "";
    }
  };

  /* ------------------------------------
     MATCH INGREDIENT TO CSV JSON
  ------------------------------------ */
  const matchIngredientPrice = (ingredientName) => {
    const lower = ingredientName.toLowerCase();

    const key = Object.keys(ingredientPrices).find((k) =>
      lower.includes(k.toLowerCase().split(" ")[0])
    );

    return key ? ingredientPrices[key] : null;
  };

  /* ------------------------------------
     GENERATE RECIPE
  ------------------------------------ */
  const generateRecipe = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setStatus("Generating recipe using Malaysian ingredient prices...");

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-chat",
            temperature: 0.6,
            max_tokens: 2200,
            messages: [
              {
                role: "system",
                content: `
You are a Malaysian culinary expert.

STRICT RULES (MUST FOLLOW):
1. Ingredient units can be "kg", "piece", "clove", "leaf", etc.
2. Only calculate cost for ingredients in "kg".
3. If unit is NOT "kg", display the actual unit and still show pricePerUnit but no calculation will implement.
Display like this:
5 pieces × RM 0.50 = RM 0.00
4. JSON ONLY. No markdown.
5. Estimate the suitable time for each recipe.
6. Each step in instructions must be clear and easy to follow with line breaks.

FORMAT:
{
  "recipe": {
    "title": "",
    "description": "",
    "instructions": "",
    "estimatedtime": 60,
    "dietarycategory": "",
    "cuisinetype": "Malaysian",
    "allergies": "",
    "goal": ""
  },
  "ingredients": [
    {
      "name": "",
      "quantity": 1,
      "unit": "kg",
      "estimatedUnitPrice": 10.5
    }
  ]
}
                `,
              },
              {
                role: "user",
                content: `Generate a Malaysian recipe for: ${prompt}. Use common household portion size.`,
              },
            ],
          }),
        }
      );

      const data = await response.json();
      const aiText = data.choices[0].message.content;
      const json = JSON.parse(aiText.match(/\{[\s\S]*\}/)[0]);

      /* ------------------------------------
         IMAGE
      ------------------------------------ */
      json.recipe.imageurl = await fetchUnsplashImage(json.recipe.title);

      /* ------------------------------------
         PRICE CALCULATION
      ------------------------------------ */
      let totalCost = 0;

      json.ingredients = json.ingredients.map((ing) => {
      const csvPrice = matchIngredientPrice(ing.name);
      const unitPrice = csvPrice ? csvPrice.avgPrice : ing.estimatedUnitPrice;

      if (ing.unit.toLowerCase() === "kg") {
        const cost = ing.quantity * unitPrice;
        totalCost += cost;

        return {
          name: ing.name,
          quantity: Number(ing.quantity.toFixed(2)),
          unit: "kg",
          pricePerUnit: Number(unitPrice.toFixed(2)),
          cost: Number(cost.toFixed(2)),
        };
      } else {
        // For non-kg units, display actual unit and price per unit, but cost is 0
        return {
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          pricePerUnit: Number(unitPrice.toFixed(2)), // <-- display actual unit price
          cost: 0.0, // <-- cost is 0
        };
      }
    });


      json.recipe.estimatedcost = Number(totalCost.toFixed(2));

      setRecipeData(json);
      setStatus("Recipe generated successfully ✅");
    } catch (err) {
      console.error(err);
      setStatus("Failed to generate recipe ❌");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------
     SAVE TO SUPABASE
  ------------------------------------ */
  const saveToSupabase = async () => {
    if (!recipeData) return;

    setLoading(true);
    setStatus("Saving to database...");

    try {
      const { data: recipe } = await supabase
        .from("recipe")
        .insert({ ...recipeData.recipe, userid: null })
        .select()
        .single();

      for (const ing of recipeData.ingredients) {
        let { data: ingredient } = await supabase
          .from("ingredient")
          .select("*")
          .eq("name", ing.name)
          .eq("unit", ing.unit)
          .maybeSingle();

        if (!ingredient) {
          const img = await fetchUnsplashImage(ing.name);
          const { data } = await supabase
            .from("ingredient")
            .insert({
              name: ing.name,
              averageprice: ing.pricePerUnit,
              unit: ing.unit,
              imageurl: img,
            })
            .select()
            .single();
          ingredient = data;
        }

        await supabase.from("recipeingredient").insert({
          recipeid: recipe.recipeid,
          ingredientid: ingredient.ingredientid,
          quantityrequired: ing.quantity,
        });
      }

      setRecipeData(null);
      setPrompt("");
      setStatus("Saved successfully 🎉");
    } catch (err) {
      console.error(err);
      setStatus("Save failed ❌");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------
     UI
  ------------------------------------ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      <Navbar />
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl p-8 my-10">
        <h1 className="text-3xl font-bold text-orange-600 mb-2">
          AI Malaysian Recipe Generator
        </h1>
        <p className="text-gray-600 mb-6">
          Powered by real Malaysian ingredient prices
        </p>

        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full border rounded-xl p-4 mb-4 focus:ring-2 focus:ring-orange-500"
          placeholder="Example: Chicken Rendang"
        />

        <button
          onClick={generateRecipe}
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl transition font-semibold"
        >
          {loading ? "Generating..." : "Generate Recipe"}
        </button>

        <p className="mt-4 text-sm text-gray-600">{status}</p>

        {recipeData && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-2xl font-bold mb-2">
              {recipeData.recipe.title}
            </h2>

            <img
              src={recipeData.recipe.imageurl}
              alt=""
              className="w-full h-64 object-cover rounded-xl mb-4"
            />

            <p className="text-lg font-semibold mb-3">
              💰 Estimated Cost: RM {recipeData.recipe.estimatedcost}
            </p>

            <ul className="space-y-2">
              {recipeData.ingredients.map((i, idx) => (
                <li
                  key={idx}
                  className="flex justify-between bg-orange-50 p-3 rounded-lg"
                >
                  <span>{i.name}</span>
                  <span>
                    {i.quantity} {i.unit} × RM {i.pricePerUnit.toFixed(2)} = RM {i.cost.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mb-4">
              <h3 className="font-semibold text-orange-600 mt-4 mb-3">
                Instructions:
              </h3>
              <p className="text-gray-700 whitespace-pre-line">
                {recipeData.recipe.instructions}
              </p>
            </div>

            <button
              onClick={saveToSupabase}
              className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold"
            >
              Save to Database
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
