import { ACTIONS_CORS_HEADERS, ActionsJson } from "@solana/actions";

export const GET = async () => {
  const payload: ActionsJson = {
    rules: [
      {
        pathPattern: "/",
        apiPath: "/api/game/",
      },
      // fallback route
      {
        pathPattern: "/api/game/",
        apiPath: "/api/game/",
      }
    ],
  };

  return Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
};
// ensures cors
export const OPTIONS = GET;