const hubspot = require("@hubspot/api-client");

const PORTAL_API_KEY = process.env.PORTAL_API_KEY;

const CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
const CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;

const hubspotClient = new hubspot.Client();
const portalClient = new hubspot.Client({ apiKey: PORTAL_API_KEY });

exports.main = async (context, sendResponse) => {
  const { userid, portalid } = context.params;
  const utk = getUtk(context.headers.Cookie);

  try {
    const user = await portalClient.crm.contacts.basicApi.getById(userid, [
      "email",
      "firstname",
      "lastname",
      "app_data",
    ]);

    const app_data = JSON.parse(user.body.properties.app_data);

    if (utk != app_data.utk) {
      return sendResponse({
        statusCode: 301,
        headers: {
          Location: `https://theme-loader.kohorta.co`,
        },
      });
    }

    const refreshToken = app_data.api_credentials[portalid].refreshToken;

    const tokenRes = await hubspotClient.oauth.defaultApi.createToken(
      "refresh_token",
      undefined,
      undefined,
      CLIENT_ID,
      CLIENT_SECRET,
      refreshToken
    );

    hubspotClient.setAccessToken(tokenRes.body.accessToken);

    const doTheAppThing = await hubspotClient.crm.contacts.basicApi.getPage();

    sendResponse({
      body: {
        // app_data,
        contacts: doTheAppThing.body,
      },
      statusCode: 200,
    });
  } catch (error) {}
};

function getUtk(cookie) {
  cookie = cookie || "";
  const utk = cookie.split("; ").find((row) => row.startsWith("hubspotutk="));
  return utk && utk.split("=")[1];
}
