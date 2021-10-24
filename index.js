const express = require("express");
const axios = require("axios");
const path = require("path");

const AUTHORIZATION_URL = `https://app.hubspot.com/oauth/authorize?client_id=49985d26-b5f2-4d4f-8f8f-41d2416de4ac&redirect_uri=http://localhost:3000/authenticated&scope=contacts%20content%20oauth`;

const app = express();
app.use(express.static("public"));

app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

app.get("/authenticated", async (req, res) => {
  res.sendFile(path.join(__dirname, "views/auth.html"));
});

app.use((error, req, res, next) => {
  res.render("error", { error: error.message });
});

app.listen(3000, () => console.log(`Listening on http://localhost:${3000}`));
