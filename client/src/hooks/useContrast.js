import { useState, useEffect } from "react";
import { fetchContrast } from "../api/stories";

// Custom hook for the contrast page.
// StoryDetail.jsx calls useContrast(id) and gets back the full story object.
export default function useContrast(storyId) {
  const [story,   setStory]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!storyId) return;

    setLoading(true);
    setError(null);

    fetchContrast(storyId)
      .then((res) => setStory(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [storyId]);

  return { story, loading, error };
}