import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Connection, PublicKey, Transaction } from 'npm:@solana/web3.js@1.95.0';
import { 
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as METADATA_PROGRAM_ID
} from 'npm:@metaplex-foundation/mpl-token-metadata@3.2.1';

const NETWORK_RPC = {
  'x1Mainnet': 'https://xolana.xen.network',
  'x1Testnet': 'https://xolana-testnet.xen.network'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      tokenMint, 
      metadataUri, 
      name, 
      symbol, 
      network = 'x1Mainnet',
      updateAuthority,
      isMutable = true
    } = await req.json();

    if (!tokenMint || !metadataUri || !name || !symbol || !updateAuthority) {
      return Response.json({ 
        error: 'Missing required fields: tokenMint, metadataUri, name, symbol, updateAuthority' 
      }, { status: 400 });
    }

    // This endpoint returns the transaction that needs to be signed by the wallet
    // The frontend will need to sign and send this transaction
    
    const connection = new Connection(NETWORK_RPC[network], 'confirmed');
    const mint = new PublicKey(tokenMint);
    const updateAuth = new PublicKey(updateAuthority);

    // Derive metadata PDA
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer()
      ],
      METADATA_PROGRAM_ID
    );

    // Create metadata instruction
    const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPDA,
        mint: mint,
        mintAuthority: updateAuth,
        payer: updateAuth,
        updateAuthority: updateAuth
      },
      {
        createMetadataAccountArgsV3: {
          data: {
            name: name,
            symbol: symbol,
            uri: metadataUri,
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null
          },
          isMutable: isMutable,
          collectionDetails: null
        }
      }
    );

    const transaction = new Transaction().add(createMetadataInstruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = updateAuth;

    // Serialize transaction for frontend to sign
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    }).toString('base64');

    return Response.json({
      success: true,
      metadataPDA: metadataPDA.toString(),
      serializedTransaction,
      message: 'Transaction prepared. Sign and send from wallet.'
    });

  } catch (error) {
    console.error('Metadata creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});