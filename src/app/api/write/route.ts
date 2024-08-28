//@ts-nocheck
import {
  ActionPostResponse,
  createPostResponse,
  MEMO_PROGRAM_ID,
  ActionGetResponse,
  ActionPostRequest,
  createActionHeaders,
  ACTIONS_CORS_HEADERS,
} from "@solana/actions";
import { BlinksightsClient } from 'blinksights-sdk';
import * as splToken from '@solana/spl-token';
import {
  clusterApiUrl,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import { NextActionLink } from "@solana/actions-spec";
import "dotenv/config";
import { getNumber,chooseToken, sendUsdc,sendSend,checkResult } from "@/app/helper";
// GET request handler
const client = new BlinksightsClient(process.env.METKEY);
const SOLANA_MAINNET_USDC_PUBKEY ='EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const SEND_PUBKEY = 'SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa';
let toPubkey = new PublicKey("3GD3Ks19SCeor3n4qrJ3VjGRooeMii7FYvb24EaMRae5");

export async function GET(request: Request) {
  const url = new URL(request.url);
  console.log("URL", url);
let balance = 10;
  if(balance == 0){
    const payload: ActionGetResponse = {
      icon: "https://ucarecdn.com/d7f1119a-05dd-495e-bd88-6bb0cf4226a7/Screenshot20240826at23545AM.png", // Local icon path
      label: "Liquidity Issue",
      title: `Less liquidity in the Pool`,
      description:
        `Available Liquidity is ${balance} USDC which is less than the required to payout if you win!`,
    };
    const res = Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
    return res;
  }else{

   const payload: ActionGetResponse = {
        description: `You'll always miss 100% of the shots you don't take.`,
        icon: "https://ucarecdn.com/47e639fa-cb3a-4894-91be-087aa770df57/Pinpageimage.jpeg", // Local icon path
        label: `Place your bet`,
        title: `Pick a number bw 1 to 36`,
        links: {
          actions: [
            {
              label: `Bet`, // button text
              href: `/api/write?number={num}`, // api endpoint
              parameters: [
                {
                  name: "num", // field name
                  label: "Enter a number", // text input placeholder
                },
              ],
            },
          ],
        }
      }
  
  client.trackRenderV1(request.url, payload);
  const res = Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
  return res;
}
}

export const OPTIONS = GET; // OPTIONS request handler


// POST request handler
export async function POST(request: Request) {
  const body: ActionPostRequest = await request.json();
  client.trackActionV1(request.headers, body.account, request.url);

  const requestUrl = new URL(request.url);
  let sender: PublicKey = new PublicKey(body.account);;
  let userAmount;
  let winningNumber=Math.floor(Math.random() * 37);;
  let connection = new Connection(clusterApiUrl("mainnet-beta"));

  let decimals = 6;
  userAmount = (requestUrl.searchParams.get("amount"));
 let usersNumber = Number(requestUrl.searchParams.get("number"));
  let transferAmount: any = parseFloat(userAmount);
  transferAmount = transferAmount.toFixed(decimals);
  transferAmount = transferAmount * Math.pow(10, decimals);
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender,
      toPubkey: toPubkey,
      lamports: LAMPORTS_PER_SOL * 0,
    })
  );
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = sender;
try{
if(requestUrl.searchParams.get("number")&& requestUrl.searchParams.get("token")==null){
  if(usersNumber>36){
    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        links: {
          next: getNumber(),
        },
  
        transaction: tx,
        message: `Getting Token`,
  
      },
      // note: no additional signers are needed
      // signers: [],
    });
    const res = Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
    return res;
  }else{
  const payload: ActionPostResponse = await createPostResponse({
    fields: {
      links: {
        next: chooseToken(usersNumber),
      },

      transaction: tx,
      message: `Getting Token`,

    },
    // note: no additional signers are needed
    // signers: [],
  });
  const res = Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
  return res;
}
}else if(requestUrl.searchParams.get("number")!=null && requestUrl.searchParams.get("token")!=null && requestUrl.searchParams.get("stage")==1){
 //requestUrl.searchParams.get("number")!=0) 
 console.log("In Second");
 let token = requestUrl.searchParams.get("token");
 console.log("Token",token);
 if(token=="usdc"){
    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        links: {
          next: sendUsdc(usersNumber),
        },
        transaction: tx,
        message: `Getting USDC`,
      },
      // note: no additional signers are needed
      // signers: [],
    });
    const res = Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
    return res;
 }else{
 const payload: ActionPostResponse = await createPostResponse({
    fields: {
      links: {
        next: sendSend(usersNumber),
      },
      transaction: tx,
      message: `Getting SEND`,
    },
    // note: no additional signers are needed
    // signers: [],
  });
  const res = Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
  return res;
 }

}else if(requestUrl.searchParams.get("number") && requestUrl.searchParams.get("amount")){
 let status;
 let key;
  if(winningNumber == usersNumber){
    status=true;
  }else{
    status=false;
  }
  let token = requestUrl.searchParams.get("token");
  if(token=="usdc"){
    key = SOLANA_MAINNET_USDC_PUBKEY;
  }else{
    key = SEND_PUBKEY;
  }
  console.log("Key = ",key);
  if(Number(requestUrl.searchParams.get("number"))>36){
    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        links: {
          next: getNumber(),
        },
        transaction: tx,
        message: `Enter a number less than 37`,
      },
      // note: no additional signers are needed
      // signers: [],
    });
    const res = Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
    return res;
  }else{
    let txr = await TransactionBuilder(sender,userAmount,key);
    console.log("Transaction",txr)
    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        links: {
          next: checkResult(status,winningNumber),
        },
  
        transaction: txr,
        message: `Getting USDC`,
  
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

}catch(err){
  console.log("Error in POST /api/action", err);
  let message = "An unknown error occurred";
  if (typeof err == "string") message = err;
  return new Response(message, {
    status: 400,
    headers: ACTIONS_CORS_HEADERS,
  });
}

}

 async function  TransactionBuilder(userAccount,amount,token){

  let account= new PublicKey(userAccount);


const connection = new Connection(process.env.RPC || clusterApiUrl('mainnet-beta'));
    const decimals = 6; // In the example, we use 6 decimals for USDC, but you can use any SPL token
    const mintAddress = new PublicKey(token); // replace this with any SPL token mint address

    // converting value to fractional units

    let transferAmount: any = parseFloat(amount);
    transferAmount = transferAmount.toFixed(decimals);
    transferAmount = transferAmount * Math.pow(10, decimals);

    const fromTokenAccount = await splToken.getAssociatedTokenAddress(
      mintAddress,
      account,
      false,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    let toTokenAccount = await splToken.getAssociatedTokenAddress(
      mintAddress,
      toPubkey,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
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
        splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      );
      instructions.push(createATAiX);
    }

    let transferInstruction = splToken.createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      account,
      transferAmount,
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




