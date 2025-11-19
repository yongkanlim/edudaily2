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
      </Routes>
    </BrowserRouter>
  );
}
