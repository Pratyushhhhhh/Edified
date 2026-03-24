import { useState, useEffect } from "react";
import { fetchStories } from "../api/stories";

// Custom hook — keeps all fetch logic out of the Home page component.
// Home.jsx just calls useStories() and gets back { stories, loading, error }.
// It never needs to know about axios, URLs, or error handling.
export default function useStories(category = "all") {
  const [stories, setStories]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = category !== "all" ? { category } : {};

    fetchStories(params)
      .then((res) => setStories(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [category]); // re-runs whenever category filter changes

  return { stories, loading, error };
}