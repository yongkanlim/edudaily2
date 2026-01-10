import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RecipesPage from "./pages/RecipePage";
import IngredientsPage from "./pages/IngredientPage";
import RecipeDetail from "./pages/RecipeDetail";
import Register from "./pages/RegisterPage";
import Login from "./pages/LoginPage";
import Community from "./pages/CommunityPage";
import Profile from "./pages/ProfilePage";
import CreateQuestion from "./pages/CreateQuestion";
import PostDetail from "./pages/PostDetail";
import Drafts from "./pages/Drafts";
import YourQuestions from "./pages/YourQuestion";
import YourAnswers from "./pages/YourAnswer";
import YourLikes from "./pages/YourLikes";
import YourRecipes from "./pages/YourRecipes";
import AddRecipeRequest from "./pages/AddRecipeRequest";
import EditPost from "./pages/EditPost";
import AdminRecipePage from "./pages/admin/AdminRecipePage";
import ResetPassword from "./pages/ResetPassword";
import AddRecipe from "./pages/admin/AddRecipePage";
import EditRecipe from "./pages/admin/EditRecipe";
import AdminIngredientPage from "./pages/admin/AdminIngredientPage";
import AddIngredient from "./pages/admin/AddIngredient";
import EditIngredient from "./pages/admin/EditIngredient";
import AdminRecipeRequests from "./pages/admin/AdminRecipeRequests";
import AdminRecipeRequestDetail from "./pages/admin/AdminRecipeRequestDetail";
import MyRecipeRequests from "./pages/MyRecipeRequests";
import MyRecipeRequestDetail from "./pages/MyRecipeRequestDetail";
import EditRecipeRequest from "./pages/EditRecipeRequest";
import AiChatbot from "./components/AiChatbot";
import chatbotIcon from "./assets/chatbot.png";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
        <Route path="/ingredients" element={<IngredientsPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/community" element={<Community />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/create-question" element={<CreateQuestion />} />
        <Route path="/community/:id" element={<PostDetail />} />
        <Route path="/drafts" element={<Drafts />} />
        <Route path="/your-questions" element={<YourQuestions />} />
        <Route path="/your-answers" element={<YourAnswers />} />
        <Route path="/your-likes" element={<YourLikes />} />
        <Route path="/your-recipes" element={<YourRecipes />} />
        <Route path="/addreciperequest" element={<AddRecipeRequest />} />
        <Route path="/edit-post/:postid" element={<EditPost />} />
        <Route path="/admin/recipepage" element={<AdminRecipePage />} />
        <Route path="/addrecipe" element={<AddRecipe />} />
        <Route path="/admin/edit-recipe/:recipeId" element={<EditRecipe />} />
        <Route path="/admin/ingredientpage" element={<AdminIngredientPage />} />
        <Route path="/admin/add-ingredient" element={<AddIngredient />} />
        <Route path="/admin/edit-ingredient/:id" element={<EditIngredient />} />
        <Route path="/admin/recipe-requests" element={<AdminRecipeRequests />} />
        <Route path="/admin/recipe-request/:id" element={<AdminRecipeRequestDetail />} />
        <Route path="/my-recipe-requests" element={<MyRecipeRequests />} />
        <Route path="/recipe-request/:id" element={<MyRecipeRequestDetail />} />
        <Route path="/edit-recipe-request/:id" element={<EditRecipeRequest />} />
      </Routes>

      <AiChatbot apiKey="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" buttonImage={chatbotIcon} position="bottom-right" />

    </BrowserRouter>
  );
}
