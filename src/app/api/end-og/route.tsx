import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // Get dealer and user cards from query parameters
  const dealerCards = searchParams.get("dealer_card") || "AH,KH,QH"; // Default cards
  const userCards = searchParams.get("user_card") || "KD,QD,JD"; // Default cards

  // Split the cards into arrays
  const dealerCardFaces = dealerCards.split(",").map((card) => card.trim());
  const userCardFaces = userCards.split(",").map((card) => card.trim());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex", // Ensure flexbox layout
          flexDirection: "column",
          justifyContent: "space-between",
          fontSize: 128,
          background: "#c1c1c1",
          position: "relative",
        }}
      >
        {/* Dealer Cards - Top Left */}
        <div
          style={{ position: "absolute", top: 10, left: 10, display: "flex" }}
        >
          {dealerCardFaces.map((card, index) => (
            <img
              key={`dealer-${index}`}
              src={`http://localhost:3000/cards/${card}.png`}
              alt={`Dealer Card: ${card}`}
              style={{
                width: 200,
                height: 300,
                marginLeft: index === 0 ? 0 : -150, // Overlapping effect
                zIndex: index,
                transform: `rotate(${index * -5}deg)`, // Slight rotation for effect
              }}
            />
          ))}
        </div>

        {/* User Cards - Bottom Right */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            display: "flex",
          }}
        >
          {userCardFaces.map((card, index) => (
            <img
              key={`user-${index}`}
              src={`http://localhost:3000/cards/${card}.png`}
              alt={`User Card: ${card}`}
              style={{
                width: 200,
                height: 300,
                marginLeft: index === 0 ? 0 : -150, // Overlapping effect
                zIndex: index,
                transform: `rotate(${index * 5}deg)`, // Slight rotation for effect
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
