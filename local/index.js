const express = require("express");
const axios = require("axios");
const querystring = require("querystring");
const FormData = require("form-data");
const path = require("path");
const fs = require("fs");

//including HubSpot related configurations 
const config = require("./config");

const app = express();

app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

app.get("/authenticated", async (req, res) => {
  //adding authorization code to the data object which will be exchanged to a access token via POST request
  const authData = { ...config.auth, code: req.query.code };

  //changing the auth data into the format which is required by the content type" "application/x-www-form-urlencoded"
  const stringData = querystring.stringify(authData);

  try {
    //Exchanging an authorization code for the access token via POST request
    const tokenRes = await axios.post(
      "https://api.hubapi.com/oauth/v1/token",
      stringData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    //successful json object with the access token is returned
    const access_token = tokenRes.data.access_token;
    console.log({ access_token });
    
    //preparing the data for the theme archive uploading. Data format is defined by the content type "multipart/form-data"
    const form = new FormData();
    form.append(
      "file",
      fs.createReadStream(path.join(__dirname, "demo_theme.zip"))
    );
    const formHeaders = form.getHeaders();

    //creating a unique file name to avoid the name clash with the already existing file name at the user's portal
    const fileName = `${Date.now()}_demo_theme.zip`;

    //sending the theme archive to the user's portal
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

    //unziping the theme archive at the user's portal
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

    // page slug `${Date.now()}-demo-homepage` guarantee unique slug 
    const pageData = { ...config.page, slug: `${Date.now()}-demo-homepage` };
    
    //creating the demo page at the user's portal
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
    
    //sending to the end-user responce with the link to the demo page
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
