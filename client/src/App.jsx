import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import StoryDetail from "./pages/storyDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Cluster page — grid of story cards */}
        <Route path="/" element={<Home />} />

        {/* Contrast page — full story detail */}
        {/* :id is the MongoDB _id of the story */}
        <Route path="/story/:id" element={<StoryDetail />} />
      </Routes>
    </BrowserRouter>
  );
}