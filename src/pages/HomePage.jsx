import React from "react";
import Navbar from "../components/Navbar";
import heroImage from "../assets/Malaysia-food-nasi-lemak.png"; // Change this to your image name

export default function HomePage() {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-6 lg:px-12 py-16 md:py-24 gap-12">
        {/* Left Text Section */}
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
            Your Guide to Everyday <br /> Cooking Skills.
          </h1>
          <p className="text-gray-600 text-lg">
            Empowering Beginners with Smart, Budget-Friendly Recipes — Learn to
            Cook with Confidence, Plan with Ease.
          </p>
          <button className="bg-orange-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-orange-700 transition-all shadow-md">
            Explore all Recipes
          </button>
        </div>

        {/* Right Image Section */}
        <div className="md:w-1/2 flex justify-center">
          <img
            src={heroImage}
            alt="Nasi Lemak Dish"
            className="rounded-lg shadow-md w-full md:w-[90%] object-cover"
          />
        </div>
      </section>
            {/* Popular Recipes Section */}
      <section className="bg-orange-50 py-16 px-6 lg:px-12 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
          Popular Recipes You Can’t Miss
        </h2>
        <p className="text-gray-700 max-w-2xl mx-auto mb-10">
          From quick meals to cultural delights, cook smarter with guided steps and personalized tips.
        </p>

        {/* Recipe Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-center">
          {/* Card 1 */}
          <div className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
            <img
              src="https://img.taste.com.au/XpRJtoPU/taste/2016/11/malaysian-laksa-78650-1.jpeg"
              alt="Laksa"
              className="w-full h-48 object-cover"
            />
            <div className="p-5">
              <h3 className="text-xl font-bold text-gray-900">Laksa</h3>
              <p className="text-gray-600 text-sm mt-2">
                A rich and spicy noodle soup made with coconut milk and aromatic herbs.
              </p>
              <button className="bg-orange-500 text-white px-4 py-2 rounded-md mt-4 hover:bg-orange-600 transition">
                See Full Details
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
            <img
              src="https://asianinspirations.com.au/wp-content/uploads/2019/01/R00230_Malaysian_Chicken_Curry-2-940x626.jpg"
              alt="Chicken Curry"
              className="w-full h-48 object-cover"
            />
            <div className="p-5">
              <h3 className="text-xl font-bold text-gray-900">Chicken Curry</h3>
              <p className="text-gray-600 text-sm mt-2">
                Tender chicken simmered in a fragrant blend of spices and coconut milk.
              </p>
              <button className="bg-orange-500 text-white px-4 py-2 rounded-md mt-4 hover:bg-orange-600 transition">
                See Full Details
              </button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
            <img
              src="https://tse4.mm.bing.net/th/id/OIP.6UM8nAIcLdvK8DCgiKE0WwAAAA?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"
              alt="Beef Rendang"
              className="w-full h-48 object-cover"
            />
            <div className="p-5">
              <h3 className="text-xl font-bold text-gray-900">Beef Rendang</h3>
              <p className="text-gray-600 text-sm mt-2">
                Tender beef infused with a complex mix of spices and coconut milk.
              </p>
              <button className="bg-orange-500 text-white px-4 py-2 rounded-md mt-4 hover:bg-orange-600 transition">
                See Full Details
              </button>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
            <img
              src="https://rasamalaysia.com/wp-content/uploads/2009/11/char-koay-teow1.jpg"
              alt="Char Kuey Teow"
              className="w-full h-48 object-cover"
            />
            <div className="p-5">
              <h3 className="text-xl font-bold text-gray-900">Char Kuey Teow</h3>
              <p className="text-gray-600 text-sm mt-2">
                Stir-fried noodle dish with flat rice noodles, prawns, sausage, and bean sprouts.
              </p>
              <button className="bg-orange-500 text-white px-4 py-2 rounded-md mt-4 hover:bg-orange-600 transition">
                See Full Details
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* Explore by Cuisine Type Section */}
      <section className="bg-white py-16 px-6 lg:px-12 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
          Explore by <span className="text-orange-600">Cuisine Type</span>
        </h2>
        <p className="text-gray-700 max-w-2xl mx-auto mb-10">
          Discover new flavors and cooking techniques with our diverse selection of cuisine types.
        </p>

        {/* Cuisine Image Grid */}
        <div className="flex flex-wrap justify-center gap-6">
          {/* Cuisine 1 */}
          <div className="w-64 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
            <img
              src="https://img.freepik.com/premium-photo/nasi-kerabu-nasi-ulam-popular-malay-rice-dish-traditional-malaysian-cuisine-generative-ai_186666-224.jpg?w=2000"
              alt="Nasi Kerabu"
              className="w-full h-44 object-cover"
            />
          </div>

          {/* Cuisine 2 */}
          <div className="w-64 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
            <img
              src="https://images.saymedia-content.com/.image/t_share/MTc0NjIwNzQxNDQxNjkzNjQx/how-to-make-malaysian-steamed-pandan-coconut-cake-puteri-ayu.jpg"
              alt="kuih puteri ayu"
              className="w-full h-44 object-cover"
            />
          </div>

          {/* Cuisine 3 */}
          <div className="w-64 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
            <img
              src="https://www.asiakingtravel.com/cuploads/files/Roti-Canai---a-popular-street-food-in-Malaysia---Cosmo-Appliances.jpg"
              alt="Roti Canai"
              className="w-full h-44 object-cover"
            />
          </div>

          {/* Cuisine 4 */}
          <div className="w-64 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
            <img
              src="https://www.196flavors.com/wp-content/uploads/2020/09/mee-rebus-3-FP-600x600.jpg"
              alt="Mee rebus"
              className="w-full h-44 object-cover"
            />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4 mt-10">
          <button className="bg-gray-200 text-gray-700 p-3 rounded-full hover:bg-gray-300 transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button className="bg-orange-500 text-white p-3 rounded-full hover:bg-orange-600 transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

    </div>
  );
}
