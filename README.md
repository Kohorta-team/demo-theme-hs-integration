# Themie - HubSpot integration

This is educational app for [HubSpot Dev Day 2021](https://events.hubspot.com/events/details/hubspot-hubspot-global-presents-developer-day-2021/). The idea of the app is to install theme on customer's HubSpot account and create the demo page. 

[Live demo](https://theme-hs.web.app/)

### How to install

Type in terminal
    
    git clone https://github.com/Kohorta-team/demo-theme-hs-integration.git
    cd demo-theme-hs-integration
    npm install

### How to test localy

1) Create a new HubSpot app in [HubSpot developer account](https://app.hubspot.com/signup/developers) with scopes: `contacts, content, oauth` and redirect url: `localhost:3000/authenticated`

2) Open `config.js` and paste your OAuth credentials into auth object

```javascript
const auth = {
  grant_type: "authorization_code",
  client_id: "YOUR APP CLIENT ID",
  client_secret: "YOUR APP CLIENT SECRET",
  redirect_uri: "http://localhost:3000/authenticated",
  code: "",
}; 
```

3) Copy installation URL from HubSpot app page and paste it in `index.html` file in the `views` folder

    Example of authorization URL:
  
        https://app.hubspot.com/oauth/authorize?client_id=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx&scope=contacts%20automation&redirect_uri=https://www.example.com/

4) start the app by typing in terminal:

        npm start
