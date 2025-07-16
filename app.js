const express = require("express");
const dotenv = require("dotenv");

const app = express();
app.use(express.json());

dotenv.config();

const connectDB = require("./config/db");
const postRouter = require("./routes/postRoutes");
const tagRouter = require("./routes/tagRoutes");

connectDB();

app.use("/api/posts", postRouter);
app.use("/api/tags", tagRouter);

// for testing purposes
app.get("/", (req, res) => {
  res.send("API is running Fine😊");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
