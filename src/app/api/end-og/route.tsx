import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const dealerCard = searchParams.get("dealer_card") || "AH"; // Default to Ace of Hearts if not provided
  const userCard = searchParams.get("user_card") || "KD"; // Default to King of Diamonds if not provided

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          fontSize: 128,
          background: "#c1c1c1",
          position: "relative",
        }}
      >
        {/* Dealer Card - Top Left */}
        <img
          src={`http://localhost:3000/cards/${dealerCard}.png`}
          alt={`Dealer Card: ${dealerCard}`}
          style={{
            width: 200,
            height: 300,
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 1,
          }}
        />

        {/* User Card - Bottom Right */}
        <img
          src={`http://localhost:3000/cards/${userCard}.png`}
          alt={`User Card: ${userCard}`}
          style={{
            width: 200,
            height: 300,
            position: "absolute",
            bottom: 10,
            right: 10,
            zIndex: 1,
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 627,
    }
  );
};
