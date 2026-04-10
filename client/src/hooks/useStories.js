import { useState, useEffect } from "react";

const API = "http://localhost:5000/api/stories";

export default function useStories(category = "all") {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(999);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    setError(null);
    setPage(1);
    setStories([]);
    setTotalPages(999);

    const url = category && category !== "all"
      ? `${API}?page=1&limit=10&category=${category}`
      : `${API}?page=1&limit=10`;

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        console.log("[useStories] initial fetch response:", { page: json.page, pages: json.pages, total: json.total, dataLen: json.data?.length });
        const items = json.data || [];
        const tp = json.pages || 1;
        setStories(items);
        setTotalPages(tp);
        setPage(1);
        setLoading(false);
        console.log("[useStories] after setState: page=1, totalPages=", tp, "hasMore=", 1 < tp);
      })
      .catch((err) => {
        console.error("[useStories] fetch error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [category]);

  // Load next page
  function loadMore() {
    if (loadingMore) return;
    const next = page + 1;
    console.log("[useStories] loadMore called, fetching page", next);
    setLoadingMore(true);

    const url = category && category !== "all"
      ? `${API}?page=${next}&limit=10&category=${category}`
      : `${API}?page=${next}&limit=10`;

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        console.log("[useStories] loadMore response:", { page: json.page, pages: json.pages, dataLen: json.data?.length });
        setStories((prev) => [...prev, ...(json.data || [])]);
        setTotalPages(json.pages || 1);
        setPage(next);
        setLoadingMore(false);
      })
      .catch((err) => {
        console.error("[useStories] loadMore error:", err);
        setError(err.message);
        setLoadingMore(false);
      });
  }

  const hasMore = page < totalPages;
  console.log("[useStories] render: page=", page, "totalPages=", totalPages, "hasMore=", hasMore, "loading=", loading, "storiesLen=", stories.length);

  return { stories, loading, loadingMore, error, hasMore, loadMore };
}