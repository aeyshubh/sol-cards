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
  clusterApiUrl,
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
  // connection,
  // payer,
  sender,
}: // squadsPubKey,
// amount,
{
  // connection: Connection;
  // payer: Keypair;
  sender: PublicKey;
  // squadsPubKey: PublicKey;
  // amount: Number;
}) {
  try {
    const connection = new Connection(
      process.env.NEXT_PUBLIC_RPC || clusterApiUrl("mainnet-beta"),
      "confirmed"
    );

    const privateKeyBase58 = process.env.NEXT_PUBLIC_PRIVATE_KEY as string;

    const payer = base58ToKeypair(privateKeyBase58);

    const multisigPda = new PublicKey(
      process.env.NEXT_PUBLIC_SQUAD_KEY as string
    );

    const [vaultPda] = multisig.getVaultPda({
      multisigPda,
      index: 0,
    });

    const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      new PublicKey("SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa"),
      vaultPda,
      true
    );

    const receiverTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      new PublicKey("SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa"),
      sender
    );

    const instruction = createTransferInstruction(
      senderTokenAccount.address,
      receiverTokenAccount.address,
      vaultPda,
      1 * 1000000,
      [],
      TOKEN_PROGRAM_ID
    );

    const transferMessage = new TransactionMessage({
      payerKey: vaultPda,
      recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
      instructions: [instruction],
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

    const transactionInstruction = multisig.instructions.vaultTransactionCreate(
      {
        multisigPda,
        transactionIndex: newTransactionIndex,
        creator: new PublicKey(payer.publicKey),
        rentPayer: new PublicKey(payer.publicKey),
        vaultIndex: 0,
        ephemeralSigners: 0,
        transactionMessage: transferMessage,
        programId: multisig.PROGRAM_ID,
      }
    );

    const transaction = new Transaction().add(transactionInstruction);
    transaction.feePayer = payer.publicKey;
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

    console.log("✅ Transaction executed:", signature);

    const proposalCreateResult = await multisig.instructions.proposalCreate({
      multisigPda,
      creator: new PublicKey(payer.publicKey),
      transactionIndex: newTransactionIndex,
      programId: multisig.PROGRAM_ID,
    });

    const approveProposalResult = await multisig.instructions.proposalApprove({
      multisigPda,
      transactionIndex: newTransactionIndex,
      member: new PublicKey(payer.publicKey),
      programId: multisig.PROGRAM_ID,
    });

    const executeProposalResult =
      await multisig.instructions.vaultTransactionExecute({
        connection,
        multisigPda,
        transactionIndex: newTransactionIndex,
        member: new PublicKey(payer.publicKey),
        programId: multisig.PROGRAM_ID,
      });

    console.log("executeProposalResult", executeProposalResult);

    const executeProposalIx = executeProposalResult.instruction;
    const proposalTx = new Transaction().add(proposalCreateResult);
    // proposalTx.add(proposalCreateResult);
    // Add the instructions individually
    proposalTx.add(approveProposalResult);
    proposalTx.add(executeProposalIx);

    proposalTx.feePayer = sender;
    proposalTx.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    proposalTx.lastValidBlockHeight = (
      await connection.getLatestBlockhash()
    ).lastValidBlockHeight;

    return proposalTx;
  } catch (error) {
    console.log(error);
    return null;
  }
}
