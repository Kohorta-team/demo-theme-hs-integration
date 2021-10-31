const express = require("express");
const axios = require("axios");
const querystring = require("querystring");
const FormData = require("form-data");
const path = require("path");
const fs = require("fs");

const config = require("./config");

const app = express();

app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

app.get("/authenticated", async (req, res) => {
  //adding authorization code to object which will be exchanged to access token via POST request
  const authData = { ...config.auth, code: req.query.code };

  //changing auth data format because of "Content-Type" is "application/x-www-form-urlencoded"
  const stringData = querystring.stringify(authData);

  try {
    //Exchanging authorization code for tokens via POST request
    const tokenRes = await axios.post(
      "https://api.hubapi.com/oauth/v1/token",
      stringData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    //if successful json object with access token will be returned
    const access_token = tokenRes.data.access_token;
    console.log({ access_token });
    const form = new FormData();
    form.append(
      "file",
      fs.createReadStream(path.join(__dirname, "demo_theme.zip"))
    );
    const formHeaders = form.getHeaders();

    //be careful to upload an archive with already existed file name at user's portal
    const fileName = `${Date.now()}_demo_theme.zip`;

    const themeResp = await axios.post(
      `https://api.hubapi.com/cms/v3/source-code/published/content/${fileName}`,
      form,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "multipart/form-data",
          ...formHeaders,
        },
      }
    );

    const themeExtractResp = await axios.post(
      `https://api.hubapi.com/cms/v3/source-code/extract/${fileName}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const pageData = { ...config.page, slug: `${Date.now()}-demo-homepage` };
    const pageResp = await axios.post(
      `https://api.hubapi.com/cms/v3/pages/site-pages`,
      pageData,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const pageUrl = pageResp.data.url;
    console.log(pageUrl);

    let respFile = fs.readFileSync(path.join(__dirname, "views/auth.html"), {
      encoding: "utf-8",
    });
    respFile = pageUrl ? respFile.replace("#LINK", pageUrl) : respFile;
    res.send(respFile);
  } catch (error) {
    console.log("Error in uploadTemplate");
    if (error.isAxiosError) {
      console.log(error.response.data);
      console.log(error.response.status);
    } else {
      console.log(error);
    }
    res.send(error);
  }
});

app.use((error, req, res, next) => {
  res.render("error", { error: error.message });
});

app.listen(3000, () => console.log(`Listening on http://localhost:${3000}`));
