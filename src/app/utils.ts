import {
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Keypair,
  Transaction,
  Connection,
  PublicKey,
  TransactionMessage,
  sendAndConfirmTransaction,
  SendTransactionError,
} from "@solana/web3.js";
import bs58 from "bs58";

import * as multisig from "@sqds/multisig";

export function base58ToKeypair(base58PrivateKey: string): Keypair {
  try {
    const privateKeyBuffer = bs58.decode(base58PrivateKey);
    return Keypair.fromSecretKey(privateKeyBuffer);
  } catch (error) {
    throw new Error("Invalid base58 private key.");
  }
}

export async function transferSplToSquadsTx({
  connection,
  payer,
  sender,
  squadsPubKey,
  amount,
}: {
  connection: Connection;
  payer: Keypair;
  sender: PublicKey;
  squadsPubKey: PublicKey;
  amount: Number;
}) {
  const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    new PublicKey("SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa"),
    sender
  );

  const receiverTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    new PublicKey("SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa"),
    squadsPubKey,
    true
  );

  const transferInstruction = createTransferInstruction(
    senderTokenAccount.address,
    receiverTokenAccount.address,
    sender,
    //@todo: handle bn and amount
    //check if this is correct
    BigInt(Number(amount) * 10 ** 6),
    [],
    TOKEN_PROGRAM_ID
  );

  // Create a transaction and add the transfer instruction
  const transaction = new Transaction().add(transferInstruction);
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;
  transaction.feePayer = sender;
  transaction.lastValidBlockHeight = (
    await connection.getLatestBlockhash()
  ).lastValidBlockHeight;
  return transaction;
}
export async function transferSplFromSquadsTx({
  connection,
  payer,
  sender,
  squadsPubKey,
  amount,
}: {
  connection: Connection;
  payer: Keypair;
  sender: PublicKey;
  squadsPubKey: PublicKey;
  amount: Number;
}) {
  const multisigPda = new PublicKey(
    process.env.NEXT_PUBLIC_SQUAD_KEY as string
  );

  console.log("Multisig PDA:", multisigPda.toBase58());

  const [vaultPda] = multisig.getVaultPda({
    multisigPda,
    index: 0,
  });

  console.log("Vault PDA:", vaultPda.toBase58());

  const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    new PublicKey("SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa"),
    new PublicKey(squadsPubKey),
    true
  );

  if (!squadsPubKey || !sender) {
    throw new Error("Invalid public key: squadsPubKey or sender is undefined");
  }

  const receiverTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    new PublicKey("SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa"),
    sender,
    true
  );

  const transferInstruction = createTransferInstruction(
    senderTokenAccount.address,
    receiverTokenAccount.address,
    new PublicKey(sender),
    //@todo: handle bn and amount
    //check if this is correct
    BigInt(Number(amount) * 10 ** 6),
    [],
    TOKEN_PROGRAM_ID
  );

  const transferMessage = new TransactionMessage({
    payerKey: vaultPda,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    instructions: [transferInstruction],
  });

  // Get the current multisig transaction index
  const multisigInfo = await multisig.accounts.Multisig.fromAccountAddress(
    connection,
    multisigPda
  );

  const currentTransactionIndex = Number(multisigInfo.transactionIndex);
  const newTransactionIndex = multisig.utils.toBigInt(
    currentTransactionIndex + 1
  );

  console.log(
    "Current Transaction Index:",
    currentTransactionIndex,
    "New Transaction Index:",
    newTransactionIndex.toString()
  );

  try {
    const transactionInstruction = multisig.instructions.vaultTransactionCreate(
      {
        multisigPda,
        transactionIndex: newTransactionIndex,
        creator: new PublicKey(payer.publicKey),
        vaultIndex: 0,
        ephemeralSigners: 0,
        transactionMessage: transferMessage,
        programId: multisig.PROGRAM_ID,
      }
    );

    const transaction = new Transaction().add(transactionInstruction);

    transaction.feePayer = sender;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    transaction.lastValidBlockHeight = (
      await connection.getLatestBlockhash()
    ).lastValidBlockHeight;

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer],
      {
        skipPreflight: false,
        commitment: "confirmed",
      }
    );

    console.log("✅ VaultTransaction created:", signature);

    // Verify that the VaultTransaction was created
    const [vaultTransactionPda] = multisig.getTransactionPda({
      multisigPda,
      index: newTransactionIndex,
    });

    console.log("VaultTransaction PDA:", vaultTransactionPda.toBase58());

    try {
      const vaultTransactionInfo =
        await multisig.accounts.VaultTransaction.fromAccountAddress(
          connection,
          vaultTransactionPda
        );
      console.log("VaultTransaction info:", vaultTransactionInfo);
    } catch (error) {
      console.error("Failed to fetch VaultTransaction info:", error);
    }

    const proposalCreateResult = await multisig.instructions.proposalCreate({
      multisigPda,
      creator: new PublicKey(payer.publicKey),
      transactionIndex: newTransactionIndex,
      programId: multisig.PROGRAM_ID,
    });

    console.log("Proposal created");

    const approveProposalResult = await multisig.instructions.proposalApprove({
      multisigPda,
      transactionIndex: newTransactionIndex,
      member: new PublicKey(payer.publicKey),
      programId: multisig.PROGRAM_ID,
    });

    console.log("Proposal approved");

    try {
      console.log("Attempting to execute VaultTransaction...");
      const executeProposalResult =
        await multisig.instructions.vaultTransactionExecute({
          connection,
          multisigPda,
          transactionIndex: newTransactionIndex,
          member: new PublicKey(payer.publicKey),
          programId: multisig.PROGRAM_ID,
        });
      console.log("Execute proposal instruction created");

      const executeProposalIx = executeProposalResult.instruction;
      const proposalTx = new Transaction().add(proposalCreateResult);
      proposalTx.add(approveProposalResult);
      proposalTx.add(executeProposalIx);

      proposalTx.feePayer = sender;
      proposalTx.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;
      proposalTx.lastValidBlockHeight = (
        await connection.getLatestBlockhash()
      ).lastValidBlockHeight;

      console.log("Sending final transaction...");
      const transferSignature = await sendAndConfirmTransaction(
        connection,
        proposalTx,
        [payer],
        {
          skipPreflight: false,
          commitment: "confirmed",
        }
      );

      console.log("✅ Transaction executed:", transferSignature);
      return transferSignature;
    } catch (error) {
      console.error("Error during execution:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in transferSplFromSquadsTx:", error);
    throw error;
  }
}

// export async function transferSplFromSquadsTx({
//   connection,
//   payer,
//   sender,
//   squadsPubKey,
//   amount,
// }: {
//   connection: Connection;
//   payer: Keypair;
//   sender: PublicKey;
//   squadsPubKey: PublicKey;
//   amount: Number;
// }) {
//   const multisigPda = new PublicKey(
//     process.env.NEXT_PUBLIC_SQUAD_KEY as string
//   );

//   const [vaultPda] = multisig.getVaultPda({
//     multisigPda,
//     index: 0,
//   });

//   const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
//     connection,
//     payer,
//     new PublicKey("SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa"),
//     new PublicKey(squadsPubKey),
//     true
//   );

//   if (!squadsPubKey || !sender) {
//     throw new Error("Invalid public key: squadsPubKey or sender is undefined");
//   }

//   const receiverTokenAccount = await getOrCreateAssociatedTokenAccount(
//     connection,
//     payer,
//     new PublicKey("SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa"),
//     sender,
//     true
//   );

//   const transferInstruction = createTransferInstruction(
//     senderTokenAccount.address,
//     receiverTokenAccount.address,
//     new PublicKey(sender),
//     //@todo: handle bn and amount
//     //check if this is correct
//     BigInt(Number(amount) * 10 ** 6),
//     [],
//     TOKEN_PROGRAM_ID
//   );

//   const transferMessage = new TransactionMessage({
//     payerKey: vaultPda,
//     recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
//     instructions: [transferInstruction],
//   });

//   // Get the current multisig transaction index
//   const multisigInfo = await multisig.accounts.Multisig.fromAccountAddress(
//     connection,
//     multisigPda
//   );

//   const currentTransactionIndex = Number(multisigInfo.transactionIndex);
//   const newTransactionIndex = multisig.utils.toBigInt(
//     currentTransactionIndex + 1
//   );

//   console.log(
//     "currentTransactionIndex",
//     currentTransactionIndex,
//     newTransactionIndex
//   );

//   try {
//     const transactionInstruction = multisig.instructions.vaultTransactionCreate(
//       {
//         multisigPda,
//         transactionIndex: newTransactionIndex,
//         creator: new PublicKey(payer.publicKey),
//         vaultIndex: 0,
//         ephemeralSigners: 0,
//         transactionMessage: transferMessage,
//         programId: multisig.PROGRAM_ID,
//       }
//     );

//     const transaction = new Transaction().add(transactionInstruction);

//     transaction.feePayer = sender;
//     transaction.recentBlockhash = (
//       await connection.getLatestBlockhash()
//     ).blockhash;

//     transaction.lastValidBlockHeight = (
//       await connection.getLatestBlockhash()
//     ).lastValidBlockHeight;

//     const signature = await sendAndConfirmTransaction(
//       connection,
//       transaction,
//       [payer],
//       {
//         skipPreflight: false,
//         commitment: "confirmed",
//       }
//     );

//     console.log("✅ Transaction executed:", signature);

//     const proposalCreateResult = await multisig.instructions.proposalCreate({
//       multisigPda,
//       creator: new PublicKey(payer.publicKey),
//       transactionIndex: newTransactionIndex,
//       programId: multisig.PROGRAM_ID,
//     });

//     console.log("proposalCreateResult", proposalCreateResult);

//     const approveProposalResult = await multisig.instructions.proposalApprove({
//       multisigPda,
//       transactionIndex: newTransactionIndex,
//       member: new PublicKey(payer.publicKey),
//       programId: multisig.PROGRAM_ID,
//     });
//     console.log("approveProposalResult", approveProposalResult);

//     try {
//       const executeProposalResult =
//         await multisig.instructions.vaultTransactionExecute({
//           connection,
//           multisigPda,
//           transactionIndex: newTransactionIndex,
//           member: new PublicKey(payer.publicKey),
//           programId: multisig.PROGRAM_ID,
//         });
//       console.log("executeProposalResult", executeProposalResult);

//       const executeProposalIx = executeProposalResult.instruction;
//       const proposalTx = new Transaction().add(proposalCreateResult);
//       // Add the instructions individually
//       proposalTx.add(approveProposalResult);
//       proposalTx.add(executeProposalIx);

//       console.log("proposalTx", proposalTx);

//       proposalTx.feePayer = sender;
//       proposalTx.recentBlockhash = (
//         await connection.getLatestBlockhash()
//       ).blockhash;

//       proposalTx.lastValidBlockHeight = (
//         await connection.getLatestBlockhash()
//       ).lastValidBlockHeight;

//       const transferSignature = await sendAndConfirmTransaction(
//         connection,
//         proposalTx,
//         [payer],
//         {
//           skipPreflight: false,
//           commitment: "confirmed",
//         }
//       );

//       console.log("✅ Transaction executed:", transferSignature);
//     } catch (error) {
//       console.log(error);
//     }

//     // return transferSignature;
//   } catch (error) {
//     return Response.json({
//       error: {
//         message: "Transaction creation failed",
//         details: error,
//       },
//     });
//   }
// }
