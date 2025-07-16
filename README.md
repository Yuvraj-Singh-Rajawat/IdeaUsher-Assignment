# 📝 Posts REST API (Node.js + MongoDB + AWS S3)

This is a RESTful API that allows users to create, filter, search, and retrieve posts with associated tags and image uploads to AWS S3. It's built with Node.js, Express.js, MongoDB, and AWS SDK v3.

## ✅ Features

- Create posts with compressed image uploads (via `sharp`) to AWS S3
- Attach multiple **predefined** tags to a post (many-to-many relationship)
- Search posts by title, description, image URL, or tag names
- Filter posts by tags using a dedicated endpoint
- Sort and paginate post listings
- Create and manage tags
- Modular file structure with clean and maintainable code
- Uses AWS SDK v3 and MongoDB via Mongoose
- Validates tags before uploading images to avoid orphan files

> ⚠️ **Note:** Tags must be created before creating a post. Posts can only reference tags that already exist in the system.

## 🛠 Tech Stack

- Node.js + Express.js
- MongoDB + Mongoose
- AWS S3 (SDK v3)
- Multer (with memory storage)
- Sharp (image compression)
- dotenv (for environment config)

## 📁 Folder Structure

```
.
├── config/
│   ├── db.js
│   └── s3.js
│
├── controllers/
│   ├── postController.js
│   └── tagController.js
│
├── middleware/
│   └── upload.js 
│
├── models/
│   ├── Post.js
│   └── Tag.js
│
├── routes/
│   ├── postRoutes.js
│   └── tagRoutes.js
│
├── .env
├── app.js
├── package.json
├── package-lock.json
└── README.md
```

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Yuvraj-Singh-Rajawat/IdeaUsher-Assignment.git
   cd IdeaUsher-Assignment
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:

   ```env
   PORT=5000
   MONGO_URI=your_mongodb_uri

   AWS_REGION=your-region
   AWS_ACCESS_KEY=your-access-key
   AWS_SECRET_KEY=your-secret-key
   AWS_BUCKET_NAME=your-bucket-name
   ```

4. Start the server:
   ```bash
   node server.js
   ```

## 📸 API Usage

### ✅ Tag APIs

| Method | Endpoint     | Description           |
|--------|--------------|-----------------------|
| POST   | `/api/tags`  | Create a new tag      |
| GET    | `/api/tags`  | Get all tags          |

### ✅ Post APIs

| Method | Endpoint                    | Description                                                  |
|--------|-----------------------------|--------------------------------------------------------------|
| POST   | `/api/posts`                | Create a post with title, description, tags, and image       |
| GET    | `/api/posts`                | Get all posts with optional filter, sort, and pagination     |
| GET    | `/api/posts/search?keyword=...`| Search posts by title, description, tags, image URL          |
| GET    | `/api/posts/filter?tags=...`| Filter posts by tag names                       |

### 📥 Create a Post (with image)
- Method: `POST /api/posts`
- Type: `multipart/form-data`
- Fields:
  - `title`: string
  - `description`: string
  - `tags`: JSON array (e.g., `["nodejs", "backend"]`)
  - `image`: File

### 📤 Create a Tag
- Method: `POST /api/tags`
- Body (JSON):
```json
{ "name": "nodejs" }
```

> ✅ Use these created tags when creating a post.

## 📌 Notes

- Tags must be created first using the Tag API.
- Posts reference existing tag IDs and names.
- Image is only uploaded after successful validation to avoid orphan files.

## 🧠 Future Improvements

- Add authentication (JWT)
- Add update/delete routes for posts and tags

## 👨‍💻 Author

**Yuvraj Singh Rajawat**  
[GitHub](https://github.com/Yuvraj-Singh-Rajawat) | [LinkedIn](https://linkedin.com/in/yuvraj-singh-rajawat-)

---

MIT License