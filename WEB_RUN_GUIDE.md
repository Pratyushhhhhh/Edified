# Edified - Web Execution Guide

Follow these steps to run the Edified Frontend and Backend.

## 1. Prerequisites
- **Node.js**: v18 or higher
- **MongoDB**: Access to the Atlas cluster or a local instance with the `news_aggregator` database.

---

## 2. Backend Setup (Server)
1.  **Navigate to the server folder**:
    ```bash
    cd server
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment Variables**:
    Create a `.env` file in the `server/` directory:
    ```env
    PORT=5000
    MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/news_aggregator
    NODE_ENV=development
    ```
    *Note: Ensure the URI ends with `/news_aggregator`.*
4.  **Start the server**:
    ```bash
    npm run dev
    ```
    The server will run on `http://localhost:5000`.

---

## 3. Frontend Setup (Client)
1.  **Navigate to the client folder**:
    ```bash
    cd ../client
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start the development server**:
    ```bash
    npm run dev
    ```
    The website will be available at `http://localhost:5173`.

---

## 4. Troubleshooting
- **"No stories found"**: Ensure your MongoDB collection name in `server/models/story.js` matches your actual collection (currently set to `cluster_test_v2`).
- **CORS Errors**: If the frontend cannot talk to the backend, ensure `cors` is enabled in `server/server.js`.
