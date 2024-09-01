
import {
  ActionPostResponse,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
  ACTIONS_CORS_HEADERS,
} from "@solana/actions";
import {
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import "dotenv/config";
//@ts-ignore
import * as multisig from "@sqds/multisig";
import {ActionError} from "@solana/actions";
import {
  startGame,
  endGame,
  raise,
  startGame2,
  endSecondGame,
} from "@/app/helper";
import { playDealerGame, playUserGame } from "@/app/cards";
import { determineWinner, getDealerCard } from "@/app/game1";
import {
  base58ToKeypair,
  transferSplFromSquadsTx,
  transferSplToSquadsTx,
} from "@/app/utils";
import { BlinksightsClient } from "blinksights-sdk";
import { NextResponse } from "next/server";
const client = new BlinksightsClient(process.env.METKEY as string);

export async function GET(request: Request) {
  let connection = new Connection(
    process.env.NEXT_PUBLIC_RPC || clusterApiUrl("mainnet-beta")
  );

  const url = new URL(request.url);
  const localIconPath = "/images/poker-table2.png";
  //@todo:fetch squads send balance
  //also compare the bet*2 money is there in squads
  
    const payload: ActionGetResponse = {
      description: `2X your bet upon winning!\n\n Enter Game No. below👇 \n1. High-Low Card\n2. Near to 21`,
      icon: new URL(localIconPath, url.origin).toString(), // Local icon path

      label: `Select a Game to play and 2X your bet upon winning!`,
      title: `SOL-CARDS`,
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

    client.trackRenderV1(request.url, payload);
    const res = Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
    return res;
  }


export const OPTIONS = GET; // OPTIONS request handler

export async function POST(request: Request) {
  const body: ActionPostRequest = await request.json();
  client.trackActionV1(request.headers, body.account, request.url);
  let connection = new Connection(
    process.env.NEXT_PUBLIC_RPC || clusterApiUrl("mainnet-beta")
  );

  const requestUrl = new URL(request.url);

  const url = new URL(request.url);
  const localIconPath = "/images/poker-table2.png";
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
  let gameAmt = requestUrl.searchParams.get("amount");
  const multisigPda = new PublicKey(
    process.env.NEXT_PUBLIC_SQUAD_KEY as string
  );
  const [vaultPda] = multisig.getVaultPda({
    multisigPda,
    index: 0,
  });

  const senderTokenAccount2 = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    new PublicKey("SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa"),
    vaultPda,
    true
  );
  let balance = Number(senderTokenAccount2.amount)/10**6;
  console.log("Token Account"+(balance)); 
  if (balance < Number(gameAmt) *2) {

    return Response.json({ message: `Liquidity not found(req :${Number(gameAmt) *2},have : ${balance}) `} as ActionError, {
      status: 403,
      headers: ACTIONS_CORS_HEADERS,
    });

  }
  if (
    request.url.includes("gameNo") &&
    !request.url.includes("bet") &&
    !request.url.includes("typeRaise")
  ) {
    let gameNo = requestUrl.searchParams.get("gameNo");
    let amount = requestUrl.searchParams.get("amount");
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
            next: startGame(request, Number(amount)),
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
    //game2
    else {
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
  }
  //game2
  else if (
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
    let raiseAmount = requestUrl.searchParams.get("amtRaise");
    // Take send from user and send to squads
    if (balance < Number(raiseAmount) *2) {

      
    return Response.json({ message: `Liquidity not found(req :${Number(raiseAmount) *2},have : ${balance}) `} as ActionError, {
      status: 403,
      headers: ACTIONS_CORS_HEADERS,
    });
    }else{
      if (bet == "raise") {
        console.log("yyy", raiseAmount);
        const transaction = await transferSplToSquadsTx({
          connection,
          payer,
          sender,
          squadsPubKey,
          amount: Number(raiseAmount),
        });
        const payload: ActionPostResponse = await createPostResponse({
          fields: {
            links: {
              next: endGame(
                getcard,
                type,
                getValue,
                request,
                sender,
                Number(amount) + Number(raiseAmount)
              ),
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
        //from squads to wallet
        let type = requestUrl.searchParams.get("type");
        let getcard = requestUrl.searchParams.get("card");
        let getValue = requestUrl.searchParams.get("value");
        let amount = requestUrl.searchParams.get("amount");
  
        const payload: ActionPostResponse = await createPostResponse({
          fields: {
            links: {
              next: endGame(getcard, type, getValue, request, sender, amount),
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
  }
  //game 2
  else if (request.url.includes("raiseAmt")) {
    let bet = requestUrl.searchParams.get("bet");
    let value = requestUrl.searchParams.get("value");
    let card = requestUrl.searchParams.get("card");
    let amount = requestUrl.searchParams.get("amount");
    let raiseAmount = requestUrl.searchParams.get("raiseAmt");
    let usersCard = requestUrl.searchParams.get("userCard");

    //Send raiseAmount to squads

    if (bet == "raise" && Number(raiseAmount) > 0) {
      if (balance < Number(raiseAmount) *2) {

       
    return Response.json({ message: `Liquidity not found(req :${Number(raiseAmount) *2},have : ${balance}) `} as ActionError, {
      status: 403,
      headers: ACTIONS_CORS_HEADERS,
    });
      }
      else{
        const transaction = await transferSplToSquadsTx({
          connection,
          payer,
          sender,
          squadsPubKey,
          amount: Number(raiseAmount),
        });
        const payload: ActionPostResponse = await createPostResponse({
          fields: {
            links: {
              next: endSecondGame(
                request,
                sender,
                value,
                card,
                Number(amount) + Number(raiseAmount)
              ),
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
      }

    }
    //end second game with no raise
    else {
      console.log("hereee");
      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          links: {
            next: endSecondGame(request, sender, value, card, amount),
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
}
