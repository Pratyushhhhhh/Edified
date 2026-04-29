import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import StoryDetail from "./pages/storyDetail";
import Blindspots from "./pages/blindspots";
import Location from "./pages/location";
import AboutUs from "./pages/aboutUs";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home — story cluster grid with category sidebar */}
        <Route path="/" element={<Home />} />

        {/* Story detail — full contrast view */}
        <Route path="/story/:id" element={<StoryDetail />} />

        {/* Blindspots — underreported stories */}
        <Route path="/blindspots" element={<Blindspots />} />

        {/* Location — city-tagged stories */}
        <Route path="/location" element={<Location />} />

        {/* About Us — static editorial page */}
        <Route path="/about" element={<AboutUs />} />
      </Routes>
    </BrowserRouter>
  );
}