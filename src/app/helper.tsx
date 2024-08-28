//@ts-nocheck
import { NextActionLink } from "@solana/actions-spec";
export const getNumber = (): NextActionLink => {
    console.log("getNextAction1");
    return {
      type: "inline",
      action: {
        description: `You'll always miss 100% of the shots you don't take.`,
        icon: "https://ucarecdn.com/47e639fa-cb3a-4894-91be-087aa770df57/Pinpageimage.jpeg", // Local icon path
        label: `Place your bet`,
        title: `Pick a number bw 1 to 36`,
        type: "action",
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
        },
      },
    };
  }

  export const sendSend = (usersNumber:Number): NextActionLink => {
    console.log("sending SEND");
    
    return {
        type: "inline",
        action: {
          icon: "https://ucarecdn.com/6ad36063-1db1-432d-ba33-6f7957c5728a/send.jpeg", // Local icon path
          label: "Place Bet",
          title: "More $$ == More Fun === More Payout",
          description:
            "Payout is 1 to 10,If you bet 50 $SEND and win,you get 500 $SEND only",
          type: "action",
          links: {
            actions: [
              {
                label: "SEND IT", // button text
                href: `/api/write?amount={userAmount}&number=${usersNumber}&token=send`, // button link
                parameters: [
                  {
                    name: "userAmount", // field name
                    label: "Place SEND Bet", // text input placeholder
                    required: true,
                  },
                ],
              },
            ],
          },
        },
      };
  }
  
  export const sendUsdc = (usersNumber:Number): NextActionLink => {
    console.log("sending USDC");
    return {
        type: "inline",
        action: {
          icon: "https://ucarecdn.com/ac76b6f9-2166-4b2d-abfc-1bf92bed3b67/usdc.jpg", // Local icon path
          label: "Place Bet",
          title: "More $$ == More Fun === More Payout",
          description:
            "Payout is 1 to 10,If you bet 10 $USDC and win,you get 100 $USDC ",
          type: "action",
          links: {
            actions: [
              {
                label: "USDC", // button text
                href: `/api/write?amount={userAmount}&number=${usersNumber}&token=usdc`, // button link
                parameters: [
                  {
                    name: "userAmount", // field name
                    label: "Place USDC Bet", // text input placeholder
                    required: true,
                  },
                ],
              },
            ],
          },
        },
      };
  }

  export const chooseToken = (usersNumber:Number): NextActionLink => {
    console.log("Checking Result");
    return {
        type: "inline",
        action: {
          icon: "https://ucarecdn.com/353f4acd-b49f-4803-9fee-180d1674c88b/alan.png", // Local icon path
          label: "Select Token",
          title: "Select the token you want to play with",
          description:
            "Payout is 1 to 10,If you bet 10 $SEND and win,you get 100 $SEND and same for USDC!",
          type: "action",
          links: {
            actions: [
              {
                label: "USDC", // button text
                href: `/api/write?token=usdc&number=${usersNumber}&stage=1`, // button link
              },
              {
                label: "SEND", // button text
                href: `/api/write?token=send&number=${usersNumber}&stage=1`, // button link
              },
            ],
          },
        },
      };
  }
  

  export const checkResult = (status: boolean,winningNumber:Number): NextActionLink => {
    console.log("getNextAction2");
    if(status){
        return {
            type: "inline",
            action: {
              description: `Gambling is not about how well you play the games; it’s really about how well you handle your money`,
              icon: `https://ucarecdn.com/493c71d1-8164-48de-9a91-c4b321c9bd5d/7cr.jpeg`,
              label: `Congratulations,You Won,Number is ${winningNumber}`,
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
          label: `Sorry,You Lost,Winner Number is ${winningNumber}`,
          title: `Wanna play again?`,
          type: "completed",
        },
      };
  }
  }
