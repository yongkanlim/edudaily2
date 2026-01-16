// src/pages/WebGame.jsx
import Navbar from "../components/Navbar";
import UnityGame from "../components/UnityGame";

export default function WebGame() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      {/* Top navigation */}
      <Navbar />

      {/* Page header */}
      <div className="px-6 py-4 bg-gray-800 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white">
          Web Game Experience
        </h1>
        <p className="text-gray-400 text-sm">
          Play the 3D Unity WebGL game directly in your browser
        </p>
      </div>

      {/* Unity game container */}
      <div className="flex-1 overflow-hidden">
        <UnityGame />
      </div>
    </div>
  );
}
