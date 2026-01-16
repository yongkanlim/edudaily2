import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";

export default function AIRecipeImageDetector() {
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);

  const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_MOLMO_API_KEY;

  // Handle file change (drag or click)
  const handleFileChange = (file) => {
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setResult("");
    setIngredients([]);
  };

  // Drag & Drop events
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };
  const handleDragOver = (e) => e.preventDefault();

  // Upload to Supabase
  const uploadToSupabase = async (file) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error } = await supabase.storage
      .from("ai-recipe-detect")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    const { data } = supabase.storage
      .from("ai-recipe-detect")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Detect Malaysian dish
  const detectImage = async () => {
    if (!imageFile) return;
    setLoading(true);
    setResult("");
    setIngredients([]);

    try {
      const imageUrl = await uploadToSupabase(imageFile);

      const promptText = `
You are an expert Malaysian chef. Identify the MALAYSIAN dish in this image as accurately as possible.
- Only return the name of the Malaysian dish.

List of Malaysian dishes to choose from:
Nasi Lemak, Pan Mee, Asam Laksa, Char Kuey Teow, Roti Canai, Hainanese Chicken Rice,
Laksa Johor, Nasi Kerabu, Satay, Curry Laksa, Mee Rebus, Hokkien Mee, Nasi Dagang,
Mee Goreng Mamak, Mee Siam, Nasi Kandar, Beef Rendang, Chicken Rendang, Ayam Percik,
Nasi Ulam, Lontong, Otak-Otak, Rojak, Kuih Lapis, Kuih Seri Muka, Teh Tarik, Cendol,
Nasi Minyak, Nasi Tomato, Nasi Impit, Sup Tulang, Ikan Bakar, Sambal Sotong, Keropok Lekor,
Putu Mayam, Apam Balik, Popiah, Mee Kari, Laksa Penang, Laksa Kedah, Mee Bandung,
Mee Rebus Johor, Mee Hailam, Nasi Ayam Penyet, Kerabu Mangga, Sata, Kuih Ketayap,
Kuih Koci, Kuih Bangkit, Kuih Cara, Kuih Talam, Kuih Ketayap, Roti Jala, Roti Telur,
Roti Tissue, Apam Balik, Apam, Onde-Onde, Pulut Panggang, Serunding, Sambal Belacan,
Ikan Asam Pedas, Gulai Ikan, Gulai Ayam, Gulai Kambing, Nasi Goreng Kampung, Nasi Goreng Cina,
Nasi Goreng Pattaya, Mee Goreng, Mee Hoon Goreng, Mee Kari, Mee Rebus, Mee Soto,
Laksa Sarawak, Laksa Kedah, Laksa Penang, Laksa Johor, Curry Mee, Hokkien Mee, Wantan Mee,
Mee Kicap, Pan Mee, Char Mee, Yong Tau Foo, Ayam Goreng Berempah, Ayam Masak Merah,
Ayam Masak Lemak Cili Api, Ikan Bakar, Ikan Goreng, Udang Masak Lemak, Sotong Masak Sambal,
Kerabu, Kerabu Mangga, Kerabu Kacang Botol, Kerabu Taugeh, Sambal Petai, Sambal Belacan,
Kuih Muih assorted, Cendol, ABC (Ais Batu Campur), Ice Kacang, Teh Tarik, Milo Dinosaur

- Provide a short description (2-3 lines max) and a list of main ingredients.
- Output EXACTLY in this JSON format:
{
  "title": "<dish name>",
  "description": "<short description>",
  "ingredients": ["ingredient1", "ingredient2", "..."]
}
      `;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "allenai/molmo-2-8b:free",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: promptText },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      const aiText = data.choices[0].message.content;

      // Parse JSON from AI
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      let jsonData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (!jsonData) {
        setResult("❌ Could not parse AI response");
      } else {
        setResult(`${jsonData.title}\n${jsonData.description}`);
        setIngredients(jsonData.ingredients || []);
      }
    } catch (err) {
      console.error(err);
      setResult("❌ Failed to analyze image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        {/* White card content */}
        <div className="bg-white shadow-2xl rounded-2xl p-8 mb-10">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">
            AI Malaysian Dish Detector
          </h1>
          <p className="text-gray-600 mb-6">
            Upload an image and let AI identify the Malaysian dish
          </p>

          {/* Drag & Drop area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="w-full border-2 border-dashed border-orange-400 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-orange-600 transition mb-4"
          >
            <p className="text-gray-600 mb-2">
              {imageFile ? "Change Image or Drag & Drop" : "Drag & Drop an image here or click to upload"}
            </p>
            <label className="px-4 py-2 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition cursor-pointer">
              {imageFile ? "Change Image" : "Choose Image"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files[0] && handleFileChange(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>

          {preview && (
            <img
              src={preview}
              alt="preview"
              className="w-full h-64 object-cover rounded-xl mt-4 mb-4"
            />
          )}

          <button
            onClick={detectImage}
            disabled={loading || !imageFile}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 mb-4 rounded-xl transition font-semibold"
          >
            {loading ? "Detecting..." : "Detect Dish"}
          </button>

          {result && (
            <div className="mt-6 border-t pt-4">
              <h2 className="text-2xl font-bold text-orange-600 mb-2">
                {result.split("\n")[0]}
              </h2>
              <p className="text-gray-700 whitespace-pre-line mb-4">
                {result.split("\n").slice(1).join("\n")}
              </p>

              {ingredients.length > 0 && (
                <div>
                  <h3 className="font-semibold text-orange-600 mb-2">Ingredients:</h3>
                  <ul className="list-disc list-inside text-gray-700">
                    {ingredients.map((ing, idx) => (
                      <li key={idx}>{ing}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
