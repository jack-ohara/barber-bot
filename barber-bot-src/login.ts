import parse from "node-html-parser";
import fetch from "node-fetch";
import { AuthInfo } from "./types";

async function getAuth(): Promise<AuthInfo> {
  const response = await fetch("https://northwestbarberco.resurva.com/login", {
    method: "GET",
  });

  const authCookie: string = response.headers.get("set-cookie");

  const authCookieKeyValue = authCookie.split(";")[0];

  const html = await response.text();

  const root = parse(html);

  const csrf = root.querySelector("#csrf").attributes["value"];

  return { authCookie: authCookieKeyValue, csrf };
}

export default async function login(
  emailAddress: string,
  password: string
): Promise<AuthInfo> {
  const auth = await getAuth();

  const formBody = new URLSearchParams();
  formBody.append("csrf", auth.csrf);
  formBody.append("username", emailAddress);
  formBody.append("password", password);

  await fetch("https://northwestbarberco.resurva.com/login", {
    headers: {
      accept: "application/json",
      "cache-control": "max-age=0",
      "content-type": "application/x-www-form-urlencoded",
      "upgrade-insecure-requests": "1",
      cookie: auth.authCookie,
    },
    body: formBody,
    method: "POST",
  });

  return auth;
}
