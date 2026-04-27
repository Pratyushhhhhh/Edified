from pymongo import MongoClient
from config import MONGO_URI, DB_NAME, COL_RAW_ARTICLES, COL_CLUSTERS

def run():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    print("\n" + "="*50)
    print(" 📷 IMAGE DIAGNOSTICS")
    print("="*50)
    
    # 1. Check Articles (test_v2)
    articles = list(db[COL_RAW_ARTICLES].find({}, {"imageUrl": 1, "top_image": 1, "source_name": 1}))
    total_articles = len(articles)
    articles_with_images = sum(1 for a in articles if a.get("imageUrl") or a.get("top_image"))
    
    print(f"\nRAW ARTICLES ({COL_RAW_ARTICLES}):")
    print(f"Total Articles: {total_articles}")
    print(f"With Images:    {articles_with_images} ({(articles_with_images/total_articles*100) if total_articles else 0:.1f}%)")
    print(f"Without Images: {total_articles - articles_with_images}")
    
    # Analyze which sources are failing to get images
    sources_missing_images = {}
    for a in articles:
        if not a.get("imageUrl") and not a.get("top_image"):
            src = a.get("source_name", "Unknown")
            sources_missing_images[src] = sources_missing_images.get(src, 0) + 1
            
    print("\nTop Sources Missing Images (Articles):")
    for src, count in sorted(sources_missing_images.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  - {src}: {count}")

    # 2. Check Clusters (cluster_test_v2)
    clusters = list(db[COL_CLUSTERS].find({}, {"imageUrl": 1, "coverSource": 1}))
    total_clusters = len(clusters)
    
    placeholders = sum(1 for c in clusters if "placehold.co" in c.get("imageUrl", ""))
    real_images = total_clusters - placeholders
    
    print(f"\nCLUSTERS ({COL_CLUSTERS}):")
    print(f"Total Clusters: {total_clusters}")
    print(f"With Real Images:  {real_images} ({(real_images/total_clusters*100) if total_clusters else 0:.1f}%)")
    print(f"With Placeholders: {placeholders}")
    
    # Analyze which sources are responsible for placeholder clusters
    placeholder_sources = {}
    for c in clusters:
        if "placehold.co" in c.get("imageUrl", ""):
            src = c.get("coverSource", "Unknown")
            placeholder_sources[src] = placeholder_sources.get(src, 0) + 1
            
    print("\nTop Sources Creating Placeholder Clusters:")
    for src, count in sorted(placeholder_sources.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  - {src}: {count}")
        
    print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    run()
