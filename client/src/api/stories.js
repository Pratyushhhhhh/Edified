import axios from "axios";

//"localhost:5000"
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

//useStories hook 
export const fetchStories = (params = {}) =>
  api.get("/stories", { params });

//useContrast hook 
export const fetchContrast = (storyId) =>
  api.get(`/contrast/${storyId}`);