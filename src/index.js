import express from "express";
import posts from "./routes/posts.js";

const app = express();

app.use(express.json());
app.use(express.static("src/public"));

app.use("/posts", posts);

app.listen(process.env.PORT || "8088", () => {console.info("App running on port " + (process.env.PORT || "8088"))});
