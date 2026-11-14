# 📚 Knowledge Sources

Drop your curated documents here. The RAG ingestion pipeline will automatically
process them and add them to the vector store.

## Supported Formats

| Format | Extension | Notes |
|--------|-----------|-------|
| Plain Text | `.txt` | Direct ingestion |
| PDF | `.pdf` | Text extracted via PyPDF2 |
| Markdown | `.md` | Formatting stripped before chunking |

## Recommendations

- **Name files descriptively** — the filename is used as the source citation
  - ✅ `indian_flood_policy_2024.pdf`
  - ❌ `document1.pdf`
- **One topic per file** when possible — improves retrieval precision
- **Remove headers/footers** from PDFs if they contain repetitive text

## Example Sources

- Government policy documents
- Fact-check databases
- Reference books on Indian politics, economics, etc.
- Curated Wikipedia extracts on key topics

## Re-ingesting

After adding new files, run:
```bash
cd Edified/rag
python ingest_documents.py
```
