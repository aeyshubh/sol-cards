import { ImageResponse } from "@vercel/og";

export const GET = async () => {
  // Fetch the SVG images for the three cards
  const cardImages = ["5C", "2D", "7H"];

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
        {cardImages.map((card, index) => (
          <img
            key={index}
            src={`http://localhost:3000/cards/${card}.png`}
            alt={`card${index + 1}`}
            style={{
              width: 300,
              height: 500,
              marginLeft: index === 0 ? 0 : -150, // Overlapping effect
              zIndex: index,
              //   position: index === 0 ? "relative" : "absolute", // Make sure first card is relative
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
