import { NextActionLink } from "@solana/actions-spec";
import * as splToken from "@solana/spl-token";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { playDealerGame, playUserGame } from "@/app/cards";
import {
  getDealerCard,
  getUserCard,
  determineWinner,
  Card,
  getCardAbbreviation,
} from "@/app/game1";
import { base58ToKeypair, transferSplFromSquadsTx } from "./utils";
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

export const raiseSend = (type, card, value, amount): NextActionLink => {
  console.log("IN get Game");
  return {
    type: "inline",
    action: {
      description: `You'll always miss 100% of the shots you don't take.`,
      icon: "https://ucarecdn.com/47e639fa-cb3a-4894-91be-087aa770df57/Pinpageimage.jpeg", // Local icon path
      label: `Enter Send to Raise Bet with, your current card is ${card}`,
      title: `Only a CHAD can raise the bet`,
      type: "action",
      links: {
        actions: [
          {
            label: `Bet`, // button text
            href: `/api/game?send={sendNum}&typeRaise=raise&card=${card}&type=${type}&value=${value}&amount=${amount}`, // api endpoint
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

export const raiseSendForSecondGame = (value, card, amount): NextActionLink => {
  console.log("IN get Game");
  return {
    type: "inline",
    action: {
      description: `You'll always miss 100% of the shots you don't take.`,
      icon: "https://ucarecdn.com/47e639fa-cb3a-4894-91be-087aa770df57/Pinpageimage.jpeg", // Local icon path
      label: `Enter Send to Raise Bet with`,
      title: `Your current cards are ${card}`,
      type: "action",
      links: {
        actions: [
          {
            label: `Bet`, // button text
            href: `/api/game?send={sendNum}&typeRaise=raise&card=${card}&gameNo=2&value=${value}&amount=${amount}`, // api endpoint
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

export async function TransactionBuilder(userAccount, amount) {
  let account = new PublicKey(userAccount);

  console.log("In Tx builder," + account, amount);
  const connection = new Connection(
    process.env.RPC || clusterApiUrl("mainnet-beta")
  );
  const decimals = 6; // In the example, we use 6 decimals for USDC, but you can use any SPL token
  const mintAddress = new PublicKey(SEND_PUBKEY); // replace this with any SPL token mint address

  // converting value to fractional units

  let transferAmount: any = parseFloat(amount);
  transferAmount = transferAmount.toFixed(decimals);
  transferAmount = transferAmount * Math.pow(10, decimals);

  const fromTokenAccount = await splToken.getAssociatedTokenAddress(
    mintAddress,
    account,
    false,
    splToken.TOKEN_PROGRAM_ID,
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID
  );

  let toTokenAccount = await splToken.getAssociatedTokenAddress(
    mintAddress,
    toPubkey,
    true,
    splToken.TOKEN_PROGRAM_ID,
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const ifexists = await connection.getAccountInfo(toTokenAccount);

  let instructions = [];

  if (!ifexists || !ifexists.data) {
    let createATAiX = splToken.createAssociatedTokenAccountInstruction(
      account,
      toTokenAccount,
      toPubkey,
      mintAddress,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );
    instructions.push(createATAiX);
  }

  let transferInstruction = splToken.createTransferInstruction(
    fromTokenAccount,
    toTokenAccount,
    account,
    transferAmount
  );
  instructions.push(transferInstruction);

  const transaction = new Transaction();
  transaction.feePayer = account;

  transaction.add(...instructions);

  // set the end user as the fee payer
  transaction.feePayer = account;

  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;

  return transaction;
}

export const startGame = (req, amount: number): NextActionLink => {
  let userCard = getUserCard();
  console.log("userCard", userCard);

  // Ensure the host is defined (for example, in a serverless environment)
  const origin = req.headers.host
    ? `http://${req.headers.host}`
    : "http://localhost:3000";

  // Construct the full URL for the OG image
  const iconUrl = new URL(
    `/api/og?cards=${userCard.card_face}`,
    origin
  ).toString();

  return {
    type: "inline",
    action: {
      description: `You can select whether you want to bet on High card/Low card. If you bet on High card and you have a higher card than the dealer, then you win.`,
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
    ? `http://${req.headers.host}`
    : "http://localhost:3000";

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
      description: `You get 3 cards and the dealer gets 3 cards. Whosoever's cards are nearest to 21 wins. Above 21 busts.`,
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
            href: `/api/game?bet=noraise&value=${value}&gameNo=2&card=${abbreviatedCards}&amount=${amount}`, // api endpoint
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
    ? `http://${request.headers.host}`
    : "http://localhost:3000";
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
        title: `Dealer had ${dealerCard.card},Your payout will automatically be sent to your account in 5 minutes`,
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

export const endSecondGame = (value, card, request, amount): NextActionLink => {
  let dealerCard = getDealerCard();

  const dealerCardsArray = dealerCard.card
    .split(",")
    .map((card: any) => card.trim());
  const abbreviatedDealerCards = dealerCardsArray
    .map((card: any) => {
      const [value, , suit] = card.split(" ");
      return getCardAbbreviation(new Card(value, suit));
    })
    .join(",");

  const origin = request.headers.host
    ? `http://${req.headers.host}`
    : "http://localhost:3000";
  const ogImageUrl = new URL(
    `/api/end-og?dealer_card=${abbreviatedDealerCards}&user_card=${card}`,
    origin
  ).toString();

  let status = 1;
  if (status == 1) {
    //@todo: arpita send send(param:amount/2) from squads to user
    return {
      type: "inline",
      action: {
        description: `Both Bust`,
        icon: ogImageUrl,
        label: `It's a bust`,
        title: `Your payout will automatically be sent to your account in 5 minutes`,
        type: "completed",
      },
    };
  } else if (status == 2) {
    //@todo: arpita send send(param:amount*2-fees) from squads to user
    return {
      type: "inline",
      action: {
        description: `Gambling is not about how well you play the games; it’s really about how well you handle your money`,
        icon: ogImageUrl,
        label: `Congratulations, ${cardStatus}`,
        title: `Dealer had ${dealer.cards} (value: ${dealerValue}), Your payout will automatically be sent to your account`,
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
        title: `Dealer had: ${dealer.cards} (value: ${dealerValue}), Wanna play again?`,
        type: "completed",
      },
    };
  }
};
