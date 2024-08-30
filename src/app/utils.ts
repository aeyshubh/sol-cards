import {
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, Transaction, Connection, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

export function base58ToKeypair(base58PrivateKey: string): Keypair {
  try {
    const privateKeyBuffer = bs58.decode(base58PrivateKey);
    return Keypair.fromSecretKey(privateKeyBuffer);
  } catch (error) {
    throw new Error("Invalid base58 private key.");
  }
}

export async function transferSplTx({
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
    squadsPubKey
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
