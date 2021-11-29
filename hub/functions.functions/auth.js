const hubspot = require("@hubspot/api-client");

const PORTAL_API_KEY = process.env.PORTAL_API_KEY;

const CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
const CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
const REDIRECT_URI = `https://theme-loader.kohorta.co/_hcms/api/authenticated`;

const hubspotClient = new hubspot.Client();
const portalClient = new hubspot.Client({ apiKey: PORTAL_API_KEY });

exports.main = async (context, sendResponse) => {
  try {
    const code = context.params.code;
    const utk = getUtk(context.headers.Cookie);

    const getTokensResponse = await hubspotClient.oauth.defaultApi.createToken(
      "authorization_code",
      code,
      REDIRECT_URI,
      CLIENT_ID,
      CLIENT_SECRET
    );

    tokenStore = getTokensResponse.body;
    tokenStore.updatedAt = Date.now();

    const tokenInfo = await hubspotClient.oauth.defaultApi.getAccessToken(
      tokenStore.accessToken
    );

    hubspotClient.setAccessToken(tokenStore.accessToken);
    const ownersResponse = await hubspotClient.crm.owners.defaultApi.getPage();

    const owner = ownersResponse.body.results.find((el) => {
      return tokenInfo.body.userId == el.userId;
    });

    const newContact = {
      properties: {
        email: tokenInfo.body.user,
        firstname: owner.firstName,
        lastname: owner.lastName,
        app_data: JSON.stringify({
          hubUserId: tokenInfo.body.userId,
          utk: utk,
          portals: {
            [tokenInfo.body.hubId]: {
              domain: tokenInfo.body.hubDomain,
              owners: ownersResponse.body.results,
            },
          },
          api_credentials: { [tokenInfo.body.hubId]: tokenStore },
        }),
      },
    };

    const contactSearchRequest = {
      filterGroups: [
        {
          filters: [
            {
              value: tokenInfo.body.user,
              propertyName: "email",
              operator: "EQ",
            },
          ],
        },
      ],
      properties: ["email", "firstname", "lastname", "app_data"],
    };

    const foundContacts = await portalClient.crm.contacts.searchApi.doSearch(
      contactSearchRequest
    );

    let masterPortalUserID = "";

    if (foundContacts.body.total > 0) {
      const existedContact = foundContacts.body.results.find((el) => {
        return tokenInfo.body.user == el.properties.email;
      });

      const savedContact = await portalClient.crm.contacts.basicApi.update(
        existedContact.id,
        mergeAppData(newContact, existedContact)
      );
      masterPortalUserID = savedContact.body.id;
    } else {
      const savedContact = await portalClient.crm.contacts.basicApi.create(
        newContact
      );
      masterPortalUserID = savedContact.body.id;
    }

    return sendResponse({
      statusCode: 301,
      headers: {
        Location: `https://theme-loader.kohorta.co/authenticated?userid=${masterPortalUserID}&portalid=${tokenInfo.body.hubId}`,
      },
    });

    // sendResponse({
    //   body: {
    //     tokenStore,
    //     tokenInfo,
    //     ownersResponse,
    //     owner,
    //     foundContacts,
    //     context,
    //   },
    //   statusCode: 200,
    // });
  } catch (err) {
    sendResponse({ body: { err } });
  }
};

function mergeAppData(newContact, existedContact) {
  const newAppData = JSON.parse(newContact.properties.app_data);
  const oldAppData = JSON.parse(existedContact.properties.app_data);

  newAppData.portals = {
    ...oldAppData.portals,
    ...newAppData.portals,
  };

  newAppData.api_credentials = {
    ...oldAppData.api_credentials,
    ...newAppData.api_credentials,
  };

  newContact.properties.app_data = JSON.stringify(newAppData);

  return newContact;
}

function getUtk(cookie) {
  cookie = cookie || "";
  const utk = cookie.split("; ").find((row) => row.startsWith("hubspotutk="));
  return utk && utk.split("=")[1];
}

// const customerPayload = require("./test");
// exports.hubspot_handler = (event, context, callback) => {
//   try {
//     const customerCallback = (result) => callback(null, result);
//     customerPayload.main(event, customerCallback);
//   } catch (err) {
//     callback(err);
//   }
// };
