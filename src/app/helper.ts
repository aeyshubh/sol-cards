//@ts-nocheck
import { NextActionLink } from "@solana/actions-spec";
import * as splToken from "@solana/spl-token";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  getDealerCard,
  getUserCard,
  determineWinner,
  Card,
  getCardAbbreviation,
} from "@/app/game1";
import { transferSplFromSquadsTx } from "./utils";
import { NextRequest } from "next/server";
import { playDealerGame } from "./cards";
const SEND_PUBKEY = "SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa";
let toPubkey = new PublicKey("3GD3Ks19SCeor3n4qrJ3VjGRooeMii7FYvb24EaMRae5");

export const getGame = (): NextActionLink => {
  console.log("IN get Game Yoo");
  return {
    type: "inline",
    action: {
      description: `You'll always miss 100% of the shots you don't take.`,
      icon: "https://ucarecdn.com/47e639fa-cb3a-4894-91be-087aa770df57/Pinpageimage.jpeg", // Local icon path
      label: `Enter Send to Bet with`,
      title: `Welcome to the Game`,
      type: "action",
      links: {
        actions: [
          {
            label: `Bet`, // button text
            href: `/api/game?sendAmt={sendNum}`, // api endpoint
            parameters: [
              {
                name: "sendNum", // field name
                label: "Enter SEND Amount", // text input placeholder
              },
            ],
          },
        ],
      },
    },
  };
};

//game 2
export const getGame2 = (): NextActionLink => {
  console.log("Getting game 2");
  return {
    type: "inline",
    action: {
      description: `You'll always miss 100% of the shots you don't take.`,
      icon: "https://ucarecdn.com/47e639fa-cb3a-4894-91be-087aa770df57/Pinpageimage.jpeg", // Local icon path
      label: `Enter Send to Bet with`,
      title: `Welcome to the Game`,
      type: "action",
      links: {
        actions: [
          {
            label: `Bet`, // button text
            href: `/api/game?sendAmt={sendNum}&game=2`, // api endpoint
            parameters: [
              {
                name: "sendNum", // field
                label: "Enter SEND Amount", // text input placeholder
              },
            ],
          },
        ],
      },
    },
  };
};

export const startGame = (req, amount: number): NextActionLink => {
  let userCard = getUserCard();
  console.log("userCard", userCard);

  // Ensure the host is defined (for example, in a serverless environment)
  const origin = req.headers.host
    ? `https://solcards.hishubh.com`
    : "https://solcards.hishubh.com";

  // Construct the full URL for the OG image
  const iconUrl = new URL(
    `/api/og?cards=${userCard.card_face}`,
    origin
  ).toString();

  return {
    type: "inline",
    action: {
      description: `Bet on High card/Low car, If you bet on High card and you have a higher card than the dealer, then you win. \n In case of same cards: ♠️>♦️>♣️>♥️`,
      icon: iconUrl, // Use the constructed full URL
      label: ``,
      title: `You got ${userCard?.card}`,
      type: "action",
      links: {
        actions: [
          {
            label: `High`, // button text
            href: `/api/game?type=high&card=${userCard.card}&value=${userCard.value}&amount=${amount}`, // api endpoint
          },
          {
            label: `Low`, // button text
            href: `/api/game?type=low&card=${userCard.card}&value=${userCard.value}&amount=${amount}`, // api endpoint
          },
        ],
      },
    },
  };
};

export const startGame2 = (req, cards, value, amount): NextActionLink => {
  // Assuming cards is a comma-separated string like "5 of Diamonds, 9 of Diamonds, 8 of Diamonds"

  // Convert each card in the string to its abbreviation
  const cardsArray = cards.split(",").map((card: any) => card.trim()); // Convert the comma-separated string to an array
  const abbreviatedCards = cardsArray
    .map((card: any) => {
      const [value, , suit] = card.split(" "); // Split by space, ignoring "of"
      return getCardAbbreviation(new Card(value, suit)); // Get the abbreviation using the Card class and getCardAbbreviation function
    })
    .join(","); // Join the abbreviations into a comma-separated string without spaces

  const origin = req.headers.host
    ? `https://solcards.hishubh.com`
    : "https://solcards.hishubh.com";

  // Construct the full URL for the OG image
  const ogImageUrl = new URL(
    `/api/og?cards=${encodeURIComponent(abbreviatedCards)}`,
    origin
  ).toString();

  console.log(abbreviatedCards); // Outputs: "5D,9D,8D"
  console.log(ogImageUrl); // Outputs the constructed OG image URL

  return {
    type: "inline",
    action: {
      description: `You and the dealer gets 3 cards . Whosoever's cards are nearest to 21 wins. Above 21 busts.`,
      icon: ogImageUrl, // Use the OG image URL in the icon field
      label: `Following are your cards`,
      title: `You have ${cards} (value : ${value})`,
      type: "action",
      links: {
        actions: [
          {
            label: `Raise`, // button text
            href: `/api/game?bet=raise&value=${value}&gameNo=2&card=${abbreviatedCards}&amount=${amount}&raiseAmt={sendAmt}`, // api endpoint
            parameters: [
              {
                name: "sendAmt", // field name
                label: "Enter Send to raise", // text input placeholder
              },
            ],
          },
          {
            label: `No raise`, // button text
            href: `/api/game?bet=noraise&value=${value}&gameNo=2&card=${abbreviatedCards}&amount=${amount}&raiseAmt=0`, // api endpoint
          },
        ],
      },
    },
  };
};
//raise For game 1
export const raise = (type, card, value, amount): NextActionLink => {
  return {
    type: "inline",
    action: {
      description: `You can raise your bet or continue with older bet`,
      icon: "https://ucarecdn.com/47e639fa-cb3a-4894-91be-087aa770df57/Pinpageimage.jpeg", // Local icon path
      label: `Raise/continue`,
      title: `Raise your bet or continue,your current card is ${card}`,
      type: "action",
      links: {
        actions: [
          {
            label: `Raise`, // button text
            href: `/api/game?bet=raise&card=${card}&type=${type}&value=${value}&amount=${amount}&amtRaise={sendAmt}`, // api endpoint
            parameters: [
              {
                name: "sendAmt", // field name
                label: "Enter Send to raise", // text input placeholder
              },
            ],
          },
          {
            label: `No raise`, // button text
            href: `/api/game?bet=noraise&card=${card}&type=${type}&value=${value}&amount=${amount}`, // api endpoint
          },
        ],
      },
    },
  };
};

export const endGame = (
  card,
  type,
  value,
  request,
  sender,
  amount
): NextActionLink => {
  //Change wining status acc to high or low
  let dealerCard = getDealerCard();
  console.log("Dealer Card", dealerCard);
  let userWinStatus = determineWinner(card, dealerCard, type);
  console.log("User Win Status", userWinStatus);
  // console.log("Users card :", card, "dealer card :", dealerCard);
  // console.log(`Users Amount is ${amount}`);

  const [usercard_value, , suit] = card.split(" "); // Split by space, ignoring "of"

  // // Create a Card object
  const user_card = getCardAbbreviation(new Card(value, suit));

  const origin = request.headers.host
    ? `https://solcards.hishubh.com`
    : "https://solcards.hishubh.com";
  const ogImageUrl = new URL(
    `/api/end-og?dealer_card=${dealerCard.card_face}&user_card=${user_card}`,
    origin
  ).toString();

  if (userWinStatus == 1) {
    //@todo: arpita send send(param:amount) from squads to user
    // const signature = await transferSplFromSquadsTx({
    //   connection,
    //   payer,
    //   sender,
    //   squadsPubKey,
    //   amount: Number(amount * 2 - amount * 2 * 0.069),
    // });

    const signature = transferSplFromSquadsTx({
      sender,

      amount: Number(Number(amount) * 2 - Number(amount) * 2 * 0.069),
    });
    if (!signature) {
      throw Error("in signature");
    }
    return {
      type: "inline",
      action: {
        description: `Gambling is not about how well you play the games; it’s really about how well you handle your money`,
        icon: ogImageUrl,
        label: `Congratulations,You Won`,
        title: `Dealer had ${dealerCard.card},Your payout ${Number(
          Number(amount) * 2 - Number(amount) * 2 * 0.069
        )}SEND is sent to your wallet`,
        type: "completed",
      },
    };
  } else if (userWinStatus == 2) {
    return {
      type: "inline",
      action: {
        description: `The only sure thing about luck is that it will change.`,
        icon: ogImageUrl,
        label: `Sorry,You Lost`,
        title: `Dealer has ${dealerCard} , Wanna play again?`,
        type: "completed",
      },
    };
  }
};

export const endSecondGame = (
  request,
  sender,
  value,
  card,
  amount
): NextActionLink => {
  let dealerCard = playDealerGame();

  const dealerCardsArray = dealerCard.cards
    .split(",")
    .map((card: any) => card.trim());
  const abbreviatedDealerCards = dealerCardsArray
    .map((card: any) => {
      const [value, , suit] = card.split(" ");
      return getCardAbbreviation(new Card(value, suit));
    })
    .join(",");

  let playerValue = Number(value);
  let dealerValue = dealerCard.value;
  let cardStatus;
  console.log(`Players Amount : ${amount}`);
  console.log(
    `Dealer cards : ${dealerCard.cards} (value: ${dealerValue}), ${abbreviatedDealerCards}`
  );

  let status = 0;
  if (playerValue > 21 && dealerValue > 21) {
    cardStatus = "Both bust";
    //return Payment
    status = 1;
  } else if (playerValue > 21) {
    cardStatus = "Player busts! Dealer wins.";
    //Exit
  } else if (dealerValue > 21) {
    cardStatus = "Dealer busts! Player wins.";
    //Send Payment
    status = 2;
  } else if (playerValue > dealerValue) {
    cardStatus = "Player wins!";
    //send Payment
    status = 2;
  } else if (dealerValue > playerValue) {
    cardStatus = "Dealer wins!";
    //Exit
  } else {
    cardStatus = "Both Busts";
    //Return Payment
    status = 1;
  }

  let txAmount: number;
  if (status == 1) {
    txAmount = amount - amount * 0.069;
  } else if (status == 2) {
    txAmount = amount * 2 - amount * 2 * 0.069;
  } else {
    txAmount = 0;
  }

  const transaction = transferSplFromSquadsTx({
    sender,
    amount: txAmount,
  });

  const origin = request.headers.host
    ? `https://solcards.hishubh.com`
    : "https://solcards.hishubh.com";
  const ogImageUrl = new URL(
    `/api/end-og?dealer_card=${abbreviatedDealerCards}&user_card=${card}`,
    origin
  ).toString();

  if (status == 1) {
    return {
      type: "inline",
      action: {
        description: `Both Bust`,
        icon: ogImageUrl,
        label: `It's a bust`,
        title: `Your payout ${Number(
          Number(amount) - Number(amount) * 0.069
        )}SEND is sent to your wallet`,
        type: "completed",
      },
    };
  } else if (status == 2) {
    return {
      type: "inline",
      action: {
        description: `Gambling is not about how well you play the games; it’s really about how well you handle your money`,
        icon: ogImageUrl,
        label: `Congratulations, ${cardStatus}`,
        title: `Dealer had ${
          dealerCard.cards
        } (value: ${dealerValue}), Your payout ${Number(
          Number(amount) * 2 - Number(amount) * 2 * 0.069
        )}SEND is sent to your wallet`,
        type: "completed",
      },
    };
  } else {
    return {
      type: "inline",
      action: {
        description: `The only sure thing about luck is that it will change.`,
        icon: ogImageUrl,
        label: `Sorry, You Lost`,
        title: `Dealer had: ${dealerCard.cards} (value: ${dealerValue}), Wanna play again?`,
        type: "completed",
      },
    };
  }
};
