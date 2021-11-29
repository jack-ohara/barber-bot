import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { google } from "googleapis";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request.');
    
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL
    );

    const code = req.query.code;

    const { tokens } = await oauth2Client.getToken(code);

    context.log(JSON.stringify(tokens))

    // TODO
    // Make this endpoint store the refresh token in KeyVault

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: "Nothing happened, endpoint not yet implemented"
    };

};

export default httpTrigger;