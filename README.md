# demo-theme-hs-integration

This is educational app for HubSpot Dev Day 2021. It uses HubSpot API to install theme on customer's HubSpot account and creates one site page.
[Live demo](https://theme-hs.web.app/)

To use HubSpot API it's required to have app credentials. To obtain one is possible by creating HubSpot [developer account](https://app.hubspot.com/signup/developers) and creating an app in this account.

1) Open config.js and paste your OAuth credentials into auth object

```javascript
const auth = {
  grant_type: "authorization_code",
  client_id: "YOUR APP CLIENT ID",
  client_secret: "YOUR APP CLIENT SECRET",
  redirect_uri: "http://localhost:3000/authenticated",
  code: "",
}; 
```

2)Copy installation URL from app page and paste it in index.html page
Example authorization URL
<https://app.hubspot.com/oauth/authorize?client_id=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx&scope=contacts%20automation&redirect_uri=https://www.example.com/>

3)start the app by typing in terminal:
npm i
npm start
