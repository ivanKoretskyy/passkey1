import express from "express";
import posts from "./routes/posts.js";
import session from 'express-session';
import {router as passkeyRoutes} from './routes/routes.js';
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("src/public"));
app.use(
    session({
      // @ts-ignore
      secret: process.env.SESSION_SECRET || 'secret',
      saveUninitialized: true,
      resave: false,
      cookie: {
        maxAge: 86400000,
        httpOnly: true, // Ensure to not expose session cookies to clientside scripts
      },

    }),
);

app.use("/posts", posts);
app.use('/api/passkey', passkeyRoutes);

app.listen("8080", () => {console.info("App running on port 8080")});
