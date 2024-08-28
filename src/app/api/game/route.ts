
import {
    ActionPostResponse,
    createPostResponse,
    ActionGetResponse,
    ActionPostRequest,
    createActionHeaders,
    ACTIONS_CORS_HEADERS,
  } from "@solana/actions";
  import { BlinksightsClient } from 'blinksights-sdk';
  import * as splToken from '@solana/spl-token';
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
  import {getGame,startGame,TransactionBuilder,generateRandomCard, endGame,raise,raiseSend} from "@/app/helper";
import { send } from "process";
//const client = new BlinksightsClient(process.env.METKEY);

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
          label: `Select a Game to play`,
          title: `Welcome to the Game`,
          links: {
            actions: [
                {
                label: `Submit`, // button text
                href: `/api/game?gameNo={num}`, // api endpoint
                parameters: [
                  {
                    name: "num", // field name
                    label: "Enter the Game Number", // text input placeholder
                  },
                ],
              },
            ],
          }
        }
    
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
    let sender: PublicKey = new PublicKey(body.account);;
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sender,
        toPubkey: toPubkey,
        lamports: LAMPORTS_PER_SOL * 0,
      })
    );
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = sender;
    if(request.url.includes("gameNo")){
      
        const payload: ActionPostResponse = await createPostResponse({
            fields: {
              links: {
                next: getGame(),
              },
              transaction: tx,
              message: `Gettting Send`,
            },
            // note: no additional signers are needed
            // signers: [],
          });
          const res = Response.json(payload, {
            headers: ACTIONS_CORS_HEADERS,
          });
          return res;
    } else if(request.url.includes("sendAmt")){
        //get send from user
        console.log("URzl:",request.url.includes("sendAmt"))
        let amount = Number(requestUrl.searchParams.get("sendAmt"));
        console.log("Sender is "+sender+" and amount is "+amount);
        let txr = await TransactionBuilder(sender,amount);
        const payload: ActionPostResponse = await createPostResponse({
            fields: {
              links: {
                next: startGame(),
              },
              transaction: txr,
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
    else if (request.url.includes("card")) {
        //Generate card
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K','A'];
        let userCard = generateRandomCard();
        let userPower = values.indexOf(userCard)+1;
       
        
        const payload: ActionPostResponse = await createPostResponse({
            fields: {
              links: {
                next: raise(userPower),
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
    else if(request.url.includes("bet")){
        let bet = requestUrl.searchParams.get("bet");
        let userPower = requestUrl.searchParams.get("user");
        if(bet == "raise"){
            const payload: ActionPostResponse = await createPostResponse({
                fields: {
                  links: {
                    next: raiseSend(userPower),
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
              return res
        }else{
            const payload: ActionPostResponse = await createPostResponse({
                fields: {
                  links: {
                    next: endGame(userPower),
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
       

    }else if(request.url.includes("send") && request.url.includes("type")){
        //get send from user
        let amount = requestUrl.searchParams.get("send");
        let userPower = requestUrl.searchParams.get("user");
        let tx = await TransactionBuilder(sender,amount);
        const payload: ActionPostResponse = await createPostResponse({
            fields: {
              links: {
                next: endGame(userPower),
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
    }

  }