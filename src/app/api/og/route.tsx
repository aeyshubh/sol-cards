import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const cardsParam = searchParams.get("cards") || "AH"; // Default to Ace of Hearts if not provided

  // Split the cards parameter into an array
  const cardFaces = cardsParam.split(",").map((card) => card.trim());

  const baseUrl = new URL(request.url).origin;

  // Create the OG image with the specified card images
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: `url(${baseUrl}/images/poker-mat3.png)`,
          backgroundSize: "100% 100%",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          {cardFaces.map((card, index) => (
            <img
              key={index}
              src={`${baseUrl}/cards/${card}.png`}
              alt={`Card: ${card}`}
              style={{
                width: "300px",
                height: "500px",
                marginLeft: index === 0 ? 0 : "-150px", // Overlapping effect
                zIndex: index,
              }}
            />
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 627,
    }
  );
};
