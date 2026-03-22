import axios from "axios";

// All requests go to the Express server running on port 5000.
// Only this file knows about the backend URL — no other file
// should ever hardcode "localhost:5000" anywhere.
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Called by useStories hook — fetches the cluster page feed
export const fetchStories = (params = {}) =>
  api.get("/stories", { params });

// Called by useContrast hook — fetches one full story for contrast page
export const fetchContrast = (storyId) =>
  api.get(`/contrast/${storyId}`);