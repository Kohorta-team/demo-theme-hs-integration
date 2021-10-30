const express = require("express");
const axios = require("axios");
const querystring = require("querystring");
const FormData = require("form-data");
const path = require("path");
const fs = require("fs");

// value of AUTHORIZATION_URL has been copied from HubSpot app creation page in developer account
const AUTHORIZATION_URL = `https://app.hubspot.com/oauth/authorize?client_id=49985d26-b5f2-4d4f-8f8f-41d2416de4ac&redirect_uri=http://localhost:3000/authenticated&scope=contacts%20content%20oauth`;

const app = express();
app.use(express.static("public"));

app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

// values of client_id, client_secret and redirect_uri have been copied from HubSpot app creation page in developer account
const formData = {
  grant_type: "authorization_code",
  client_id: "49985d26-b5f2-4d4f-8f8f-41d2416de4ac",
  client_secret: "14d2d8b1-c225-4d40-bffc-bdbf86b8df9f",
  redirect_uri: "http://localhost:3000/authenticated",
  code: "",
};

app.get("/authenticated", async (req, res) => {
  //adding authorization code to object which will be exchanged to access token via POST request
  formData.code = req.query.code;
  const stringData = querystring.stringify(formData);

  //Exchanging authorization code for tokens via POST request
  try {
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

    const pageResp = await axios.post(
      `https://api.hubapi.com/content/api/v2/pages`,
      {
        name: "Home demo page",
        template_path: "demo_theme/templates/home.html",
        publish_immediately: true,
        slug: `${Date.now()}-demo-homepage`,
        is_draft: false,
        subcategory: "site_page",
        html_title: "Home demo page",
        page_title: "Home demo page",
        title: "Home demo page",
        is_published: true,
        state: "PUBLISHED_OR_SCHEDULED",
        current_state: "PUBLISHED",
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          accept: "application/json",
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
  }
});

app.use((error, req, res, next) => {
  res.render("error", { error: error.message });
});

app.listen(3000, () => console.log(`Listening on http://localhost:${3000}`));
