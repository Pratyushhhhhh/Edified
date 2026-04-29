import { useState, useEffect } from "react";

const API = "http://localhost:5000/api/stories";

export default function useStories(category = "all", maxArticles = null, location = null) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(999);

  function buildUrl(p) {
    const params = new URLSearchParams({ page: p, limit: 10 });
    if (category && category !== "all") params.set("category", category);
    if (maxArticles) params.set("maxArticles", maxArticles);
    if (location) params.set("location", location);
    return `${API}?${params.toString()}`;
  }

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    setError(null);
    setPage(1);
    setStories([]);
    setTotalPages(999);

    fetch(buildUrl(1))
      .then(r => r.json())
      .then(json => {
        const items = json.data || [];
        const tp = json.pages || 1;
        setStories(items);
        setTotalPages(tp);
        setPage(1);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, maxArticles, location]);

  function loadMore() {
    if (loadingMore) return;
    const next = page + 1;
    setLoadingMore(true);

    fetch(buildUrl(next))
      .then(r => r.json())
      .then(json => {
        setStories(prev => [...prev, ...(json.data || [])]);
        setTotalPages(json.pages || 1);
        setPage(next);
        setLoadingMore(false);
      })
      .catch(err => {
        setError(err.message);
        setLoadingMore(false);
      });
  }

  const hasMore = page < totalPages;
  return { stories, loading, loadingMore, error, hasMore, loadMore };
}