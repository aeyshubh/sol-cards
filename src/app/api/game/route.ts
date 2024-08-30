import {
  ActionPostResponse,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
  createActionHeaders,
  ACTIONS_CORS_HEADERS,
} from "@solana/actions";
import { BlinksightsClient } from "blinksights-sdk";
import * as splToken from "@solana/spl-token";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  Keypair,
  LAMPORTS_PER_SOL,
  Account,
  TransactionCtorFields,
  TransactionSignature,
} from "@solana/web3.js";
import { NextActionLink } from "@solana/actions-spec";
import "dotenv/config";
import {
  getGame,
  startGame,
  TransactionBuilder,
  endGame,
  raise,
  raiseSend,
  getGame2,
  startGame2,
  raiseSendForSecondGame,
  endSecondGame,
} from "@/app/helper";
import { playUserGame } from "@/app/cards";
import { getUserCard } from "@/app/game1";
import { send } from "process";
//const client = new BlinksightsClient(process.env.METKEY);

export async function GET(request: Request) {
  const url = new URL(request.url);
  console.log("URL", url);
  let balance = 10;
  if (balance == 0) {
    const payload: ActionGetResponse = {
      icon: "https://ucarecdn.com/d7f1119a-05dd-495e-bd88-6bb0cf4226a7/Screenshot20240826at23545AM.png", // Local icon path
      label: "Liquidity Issue",
      title: `Less liquidity in the Pool`,
      description: `Available Liquidity is ${balance} USDC which is less than the required to payout if you win!`,
      type: "action",
    };
    const res = Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
    return res;
  } else {
    const payload: ActionGetResponse = {
      description: `You'll always miss 100% of the shots you don't take.`,
      icon: "https://ucarecdn.com/47e639fa-cb3a-4894-91be-087aa770df57/Pinpageimage.jpeg", // Local icon path
      label: `Select a Game to play`,
      title: `Welcome to the Game`,
      type: "action",
      links: {
        actions: [
          {
            label: `Submit`, // button text
            href: `/api/game?gameNo={num}&amount={amt}`, // api endpoint
            parameters: [
              {
                name: "num", // field name
                label: "Enter Game Number", // text input placeholder
              },
              {
                name: "amt", // field name
                label: "SEND Amount", // text input placeholder
              },
            ],
          },
        ],
      },
    };

    // client.trackRenderV1(request.url, payload);
    const res = Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
    return res;
  }
}

export const OPTIONS = GET; // OPTIONS request handler

export async function POST(request: Request) {
  const body: ActionPostRequest = await request.json();
  //  client.trackActionV1(request.headers, body.account, request.url);
  let toPubkey = new PublicKey("3GD3Ks19SCeor3n4qrJ3VjGRooeMii7FYvb24EaMRae5");
  let connection = new Connection(clusterApiUrl("mainnet-beta"));

  const requestUrl = new URL(request.url);
  let sender: PublicKey = new PublicKey(body.account);
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender,
      toPubkey: toPubkey,
      lamports: LAMPORTS_PER_SOL * 0,
    })
  );
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = sender;
  if (
    request.url.includes("gameNo") &&
    !request.url.includes("bet") &&
    !request.url.includes("typeRaise")
  ) {
    let gameNo = requestUrl.searchParams.get("gameNo");
    let amount = requestUrl.searchParams.get("amount");
    let txr = await TransactionBuilder(sender, amount);

    if (gameNo == "1") {
      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          links: {
            next: startGame(request, amount),
          },
          transaction: tx,
          message: `Sending Send`,
        },
        // note: no additional signers are needed
        // signers: [],
      });
      const res = Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS,
      });
      return res;
    } else {
      let txr = await TransactionBuilder(sender, amount);
      let usersCard = playUserGame();
      console.log("Users Card", usersCard.cards, "User Power", usersCard.value);

      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          links: {
            next: startGame2(usersCard.cards, usersCard.value, amount),
          },
          transaction: tx,
          message: `Sending Send`,
        },
        // note: no additional signers are needed
        // signers: [],
      });
      const res = Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS,
      });
      return res;
    }
  } else if (
    request.url.includes("type") &&
    request.url.includes("card") &&
    request.url.includes("value") &&
    !request.url.includes("bet") &&
    !request.url.includes("typeRaise")
  ) {
    //Generate card
    let type = requestUrl.searchParams.get("type");
    let getcard = requestUrl.searchParams.get("card");
    let getValue = requestUrl.searchParams.get("value");
    let amount = requestUrl.searchParams.get("amount");
    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        links: {
          next: raise(type, getcard, getValue, amount),
        },
        transaction: tx,
        message: `Raise`,
      },
      // note: no additional signers are needed
      // signers: [],
    });
    const res = Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
    return res;
  }
  //Game 1
  else if (
    request.url.includes("bet") &&
    request.url.includes("card") &&
    request.url.includes("type") &&
    request.url.includes("value")
  ) {
    let bet = requestUrl.searchParams.get("bet");
    let type = requestUrl.searchParams.get("type");
    let getcard = requestUrl.searchParams.get("card");
    let getValue = requestUrl.searchParams.get("value");
    let amount = requestUrl.searchParams.get("amount");
    if (bet == "raise") {
      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          links: {
            next: raiseSend(type, getcard, getValue, amount),
          },
          transaction: tx,
          message: `Bet`,
        },
        // note: no additional signers are needed
        // signers: [],
      });
      const res = Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS,
      });
      return res;
    } else {
      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          links: {
            next: endGame(request, type, getcard, getValue, amount),
          },
          transaction: tx,
          message: `Bet`,
        },
        // note: no additional signers are needed
        // signers: [],
      });
      const res = Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS,
      });
      return res;
    }
  } else if (
    request.url.includes("bet") &&
    request.url.includes("value") &&
    request.url.includes("gameNo") &&
    request.url.includes("card")
  ) {
    let bet = requestUrl.searchParams.get("bet");
    let value = requestUrl.searchParams.get("value");
    let card = requestUrl.searchParams.get("card");
    let amount = requestUrl.searchParams.get("amount");
    if (bet == "raise") {
      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          links: {
            next: raiseSendForSecondGame(value, card, amount),
          },
          transaction: tx,
          message: `Bet`,
        },
        // note: no additional signers are needed
        // signers: [],
      });
      const res = Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS,
      });
      return res;
    } else {
      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          links: {
            next: endSecondGame(value, card, amount),
          },
          transaction: tx,
          message: `Bet`,
        },
        // note: no additional signers are needed
        // signers: [],
      });
      const res = Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS,
      });
      return res;
    }
  } else if (
    request.url.includes("send") &&
    request.url.includes("typeRaise") &&
    request.url.includes("gameNo") &&
    request.url.includes("card") &&
    request.url.includes("value")
  ) {
    //get send from user
    let amount = requestUrl.searchParams.get("send"); //Raise Amount
    let amountToSend = requestUrl.searchParams.get("amount"); // Old amount
    let card = requestUrl.searchParams.get("card");
    let value = requestUrl.searchParams.get("value");
    let txr = await TransactionBuilder(sender, amount);
    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        links: {
          next: endSecondGame(value, card, amountToSend),
        },
        transaction: tx,
        message: `Raising Send`,
      },
      // note: no additional signers are needed
      // signers: [],
    });
    const res = Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
    return res;
  } else if (request.url.includes("typeRaise")) {
    let type = requestUrl.searchParams.get("type");
    let getcard = requestUrl.searchParams.get("card");
    let getValue = requestUrl.searchParams.get("value");
    let amount = requestUrl.searchParams.get("amount");
    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        links: {
          next: endGame(type, getcard, getValue, amount),
        },
        transaction: tx,
        message: `Bet`,
      },
      // note: no additional signers are needed
      // signers: [],
    });
    const res = Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
    return res;
  }
}
