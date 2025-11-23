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
      </Routes>
    </BrowserRouter>
  );
}
