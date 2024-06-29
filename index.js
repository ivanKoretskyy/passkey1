import express from "express";
const app = express();
app.use(express.json());
import posts from "./routes/posts.js";

app.use("/posts", posts);
app.listen(process.env.PORT || "8088", () => {console.info("App running on port " + (process.env.PORT || "8088"))});
