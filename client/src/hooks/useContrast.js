import { useState, useEffect } from "react";

export default function useContrast(storyId) {
  const [story,   setStory]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!storyId) return;
    setLoading(true);

    fetch(`http://localhost:5000/api/contrast/${storyId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setStory(json.data);
        else setError(json.message);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [storyId]);

  return { story, loading, error };
}