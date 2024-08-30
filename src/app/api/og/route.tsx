import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const cardsParam = searchParams.get("cards") || "AH"; // Default to Ace of Hearts if not provided

  // Split the cards parameter into an array
  const cardFaces = cardsParam.split(",").map((card) => card.trim());

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
          fontSize: 128,
          background: "#c1c1c1",
          position: "relative",
        }}
      >
        {cardFaces.map((card, index) => (
          <img
            key={index}
            src={`http://localhost:3000/cards/${card}.png`}
            alt={`Card: ${card}`}
            style={{
              width: 300,
              height: 500,
              marginLeft: index === 0 ? 0 : -150, // Overlapping effect
              zIndex: index,
            }}
          />
        ))}
      </div>
    ),
    {
      width: 1200,
      height: 627,
    }
  );
};
