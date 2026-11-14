import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import StoryDetail from "./pages/storyDetail";
import Blindspots from "./pages/blindspots";
import Location from "./pages/location";
import AboutUs from "./pages/aboutUs";
import ChatPage from "./pages/chatPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/story/:id"   element={<StoryDetail />} />
        <Route path="/blindspots"  element={<Blindspots />} />
        <Route path="/location"    element={<Location />} />
        <Route path="/about"       element={<AboutUs />} />
        <Route path="/chat"        element={<ChatPage />} />
      </Routes>
      {/* Global floating chatbot removed — chat is now story-specific (StoryChat) + full-page (/chat) */}
    </BrowserRouter>
  );
}
