import {
  ActionPostResponse,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
  createActionHeaders,
  ACTIONS_CORS_HEADERS,
} from "@solana/actions";
import { BlinksightsClient } from "blinksights-sdk";
import {
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
  transfer,
} from "@solana/spl-token";
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
import { base58ToKeypair, transferSplToSquadsTx } from "@/app/utils";
//const client = new BlinksightsClient(process.env.METKEY);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const localIconPath = "/images/poker-table2.png";
  let balance = 10;
  //@todo:fetch squads send balance
  //also compare the bet*2 money is there in squads
  if (balance == 0) {
    const payload: ActionGetResponse = {
      icon: new URL(localIconPath, url.origin).toString(), // Local icon path
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
      icon: new URL(localIconPath, url.origin).toString(), // Local icon path

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

  let connection = new Connection(clusterApiUrl("mainnet-beta"));

  const requestUrl = new URL(request.url);
  let sender: PublicKey = new PublicKey(body.account);
  //  client.trackActionV1(request.headers, body.account, request.url);
  const squadsPubKey = new PublicKey(
    "3PW9AzBAwQkWqGzHF55ZJcHAgGusF9xZfQ58SuqsrRYW"
  );
  const privateKeyBase58 = process.env.NEXT_PUBLIC_PRIVATE_KEY as string;

  const payer = base58ToKeypair(privateKeyBase58);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender,
      toPubkey: squadsPubKey,
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
    // let txr = await TransactionBuilder(sender, amount);
    //@todo: arpita add liquidity check here
    if (gameNo == "1") {
      const transaction = await transferSplToSquadsTx({
        connection,
        payer,
        sender,
        squadsPubKey,
        amount: Number(amount),
      });

      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          links: {
            next: startGame(request, amount),
          },
          transaction: transaction,
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
      const transaction = await transferSplToSquadsTx({
        connection,
        payer,
        sender,
        squadsPubKey,
        amount: Number(amount),
      });
      let usersCard = playUserGame();
      console.log("Users Card", usersCard.cards, "User Power", usersCard.value);

      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          links: {
            next: startGame2(request, usersCard.cards, usersCard.value, amount),
          },
          transaction: transaction,
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
      const transaction = await transferSplToSquadsTx({
        connection,
        payer,
        sender,
        squadsPubKey,
        amount: Number(amount),
      });
      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          links: {
            next: raiseSend(type, getcard, getValue, amount),
          },
          transaction: transaction,
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
            next: endGame(request, type, getcard, getValue, amount, sender),
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
    let usersCard = requestUrl.searchParams.get("userCard");
    if (bet == "raise") {
      const transaction = await transferSplToSquadsTx({
        connection,
        payer,
        sender,
        squadsPubKey,
        amount: Number(amount),
      });
      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          links: {
            next: raiseSendForSecondGame(value, card, amount),
          },
          transaction: transaction,
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
            next: endSecondGame(request, value, card, amount),
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
          next: endSecondGame(request, value, card, amountToSend),
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
          next: endGame(request, type, getcard, getValue, amount, sender),
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
