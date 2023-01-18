import http from "http";
import { supabase } from "./_utils/supabaseClient";
import fetch from "node-fetch";

// This is the main entry point of your API, i.e http://localhost:900/api
const main = async (req: http.IncomingMessage, res: http.ServerResponse) => {
  if (!checkOrigin(req.headers.host || req.headers.origin || "")) {
    res.statusCode = 403;
    res.write("Forbidden");
    res.end();
  }

  if (req.method === "POST") {
    const body = await getBodyFromRequest(req);

    if (!checkUrl(body.url)) {
      res.end("Invalid request body");
      return;
    }

    const testUrl: Response = await fetch(body.url);
    notifyListeners(testUrl);
    const { error } = await supabase
      .from("websites")
      .upsert([{ url: body.url, status: testUrl.status }], { onConflict: "url" });

    if (error != null) {
      res.statusCode = 500;
      res.end(error.message);
    }

    res.statusCode = 200;
    res.end("ok");
  } else {
    res.end("Invalid request method");
  }
};

const notifyListeners = (res: Response) => {
  if (res.status !== 200) {
    supabase
      .from("settings")
      .select("value")
      .eq("key", "notifications")
      .then(({ data }) => {
        const config = data[0].value;
        fetch(config.discordWebhook, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "Website Monitor",
            content: `The website ${res.url} is returning ${res.status}!`,
          }),
        });
      });
  }
};

const checkUrl = (string: string | URL): boolean => {
  try {
    new URL(string);
  } catch (error) {
    console.log("error is", error);
    return false;
  }
  return true;
};

const getBodyFromRequest = (req: http.IncomingMessage):Promise<Object> => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
  });
};

// you could configure this with env variables
function checkOrigin(origin: string): boolean {
  return origin.includes("localhost") || origin.includes("stormkit");
}

export default main;
