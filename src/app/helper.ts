import { NextActionLink } from "@solana/actions-spec";
import * as splToken from '@solana/spl-token';
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { playDealerGame, playUserGame } from "@/app/cards";
const SEND_PUBKEY = 'SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa';
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
  }

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
                  name: "sendNum", // field name
                  label: "Enter SEND Amount", // text input placeholder
                },
              ],
            },
          ],
        },
      },
    };
  }

  export const raiseSend = (userPower): NextActionLink => {
    console.log("IN get Game");
    return {
      type: "inline",
      action: {
        description: `You'll always miss 100% of the shots you don't take.`,
        icon: "https://ucarecdn.com/47e639fa-cb3a-4894-91be-087aa770df57/Pinpageimage.jpeg", // Local icon path
        label: `Enter Send to Raise Bet with`,
        title: `Only a CHAD can raise the bet`,
        type: "action",
        links: {
          actions: [
            {
              label: `Bet`, // button text
              href: `/api/game?send={sendNum}&type=raise&user=${userPower}`, // api endpoint
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
  }

  export const raiseSendForSecondGame = (): NextActionLink => {
    let userPower = playUserGame();
    let userPowerValue = userPower.value;
    console.log("IN get Game");
    return {
      type: "inline",
      action: {
        description: `You'll always miss 100% of the shots you don't take.`,
        icon: "https://ucarecdn.com/47e639fa-cb3a-4894-91be-087aa770df57/Pinpageimage.jpeg", // Local icon path
        label: `Enter Send to Raise Bet with`,
        title: `Only a CHAD can raise the bet`,
        type: "action",
        links: {
          actions: [
            {
              label: `Bet`, // button text
              href: `/api/game?send={sendNum}&type=raise&user=${userPowerValue}&game=2`, // api endpoint
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
  }

  export async function  TransactionBuilder(userAccount,amount){

    let account= new PublicKey(userAccount);
  
    console.log("In Tx builder,"+account,amount)
  const connection = new Connection(process.env.RPC || clusterApiUrl('mainnet-beta'));
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

    export const startGame = (): NextActionLink => {
        return {
        type: "inline",
        action: {
            description: `You can select whether you want to bet on High card/Low card. If you bet on High card and you have a higher card then deler then you win.`,
            icon: "https://ucarecdn.com/47e639fa-cb3a-4894-91be-087aa770df57/Pinpageimage.jpeg", // Local icon path
            label: `Following are your cards`,
            title: `Have a look on your cards`,
            type: "action",
            links: {
            actions: [
                {
                label: `High`, // button text
                href: `/api/game?card=high`, // api endpoint
                },
                {
                    label: `Low`, // button text
                    href: `/api/game?card=low`, // api endpoint
                    },
            ],
            },
        },
        };
    }

    export const startGame2 = (value): NextActionLink => {
      return {
      type: "inline",
      action: {
          description: `You get 3 cards and dealer gets 3 cards,whosover's card is nearest to 21 wins,above 21 busts.`,
          icon: "https://ucarecdn.com/47e639fa-cb3a-4894-91be-087aa770df57/Pinpageimage.jpeg", // Local icon path
          label: `Following are your cards`,
          title: `Have a look on your cards`,
          type: "action",
          links: {
            actions: [
              {
              label: `Raise`, // button text
              href: `/api/game?bet=raise&userPower=${value}&gameNo=2`, // api endpoint
              },
              {
                  label: `No raise`, // button text
                  href: `/api/game?bet=noraise&userPower=${value}&gameNo=2`, // api endpoint
                  },
          ],
          },
      },
      };
  }

export const  raise = (num:Number): NextActionLink => {
    return {
    type: "inline",
    action: {
        description: `You can raise your bet or continue with older bet`,
        icon: "https://ucarecdn.com/47e639fa-cb3a-4894-91be-087aa770df57/Pinpageimage.jpeg", // Local icon path
        label: `Raise/continue`,
        title: `Raise your bet or continue`,
        type: "action",
        links: {
        actions: [
            {
            label: `Raise`, // button text
            href: `/api/game?bet=raise&user=${num}`, // api endpoint
            },
            {
                label: `No raise`, // button text
                href: `/api/game?bet=noraise&user=${num}`, // api endpoint
                },
        ],
        },
    },
    };
}

export const endGame = (userPower): NextActionLink => {
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K','A'];

    let dealerCard = generateRandomCard();
    let dealerPower= values.indexOf(dealerCard)+1;
    let userWinStatus = false;
    if(userPower > dealerPower){
        userWinStatus = true;
    }else{
        userWinStatus = false;
    }
    if(userWinStatus){
        return {
            type: "inline",
            action: {
              description: `Gambling is not about how well you play the games; it’s really about how well you handle your money`,
              icon: `https://ucarecdn.com/493c71d1-8164-48de-9a91-c4b321c9bd5d/7cr.jpeg`,
              label: `Congratulations,You Won,Dealer had ${dealerCard}♦`,
              title: `Your payout will automatically be sent to your account in 5 minutes`,
              type: "completed",
            },
          };
  }else{
    return {
        type: "inline",
        action: {
          description: `The only sure thing about luck is that it will change.`,
          icon: `https://ucarecdn.com/952a1016-da53-4c68-adce-d54fe90b2bd1/simpson.jpg`,
          label: `Sorry,You Lost,Dealer card is ${dealerCard}♦`,
          title: `Wanna play again?`,
          type: "completed",
        },
      };
  }
}

export const endSecondGame = (userPower): NextActionLink => {
  
  let dealer = playDealerGame();
  let playerValue = userPower;
  let dealerValue = dealer.value;
  let userWinStatus = false;
  let cardStatus;
  let status =0;
      if (playerValue > 21 && dealerValue > 21) {
        cardStatus = "Both bust! It's a tie.";
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
        cardStatus = "It's a tie!";
        //Return Payment
        status = 1;
      }
      if(status == 1){
        return {
          type: "inline",
          action: {
            description: `It's a TIE...,we will send your bet back to your account`,
            icon: `https://ucarecdn.com/493c71d1-8164-48de-9a91-c4b321c9bd5d/7cr.jpeg`,
            label: `It's a Tie,${cardStatus}`,
            title: `Your payout will automatically be sent to your account in 5 minutes`,
            type: "completed",
          },
        };
      }else if (status == 2){
          return {
              type: "inline",
              action: {
                description: `Gambling is not about how well you play the games; it’s really about how well you handle your money`,
                icon: `https://ucarecdn.com/493c71d1-8164-48de-9a91-c4b321c9bd5d/7cr.jpeg`,
                label: `Congratulations,${cardStatus},Dealer had value : ${dealerValue}♦`,
                title: `Your payout will automatically be sent to your account in 5 minutes`,
                type: "completed",
              },
            };
    }else{
      return {
          type: "inline",
          action: {
            description: `The only sure thing about luck is that it will change.`,
            icon: `https://ucarecdn.com/952a1016-da53-4c68-adce-d54fe90b2bd1/simpson.jpg`,
            label: `Sorry,You Lost,${cardStatus},Dealer's Value is ${dealerValue}♦`,
            title: `Wanna play again?`,
            type: "completed",
          },
        };
    }
  }
    // Function to generate a random card
export function generateRandomCard(): string {
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
    const randomValue = values[Math.floor(Math.random() * values.length)];
    return `${randomValue}`;
  }

  
  
