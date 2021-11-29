import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { stat } from "fs";
import { google } from "googleapis";
import { buffer } from "stream/consumers";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request.');

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL
    );

    const scopes = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'];

    const state = { code: process.env.OAUTHCALLBACK_CODE };

    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        state: Buffer.from(unescape(encodeURIComponent(JSON.stringify(state)))).toString('base64')
    });

    context.res = {
        headers: {
            'Content-type': 'text/html'
        },
        body: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset=utf-8>
            <title></title>
            
            <script>
                window.location.replace("${url}")
            </script>
            </head>
            <body>
            
            </body>
            </html>
        `
    };
};

export default httpTrigger;