import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tokenAddress, name, symbol, description, imageUrl, website, telegram, twitter } = await req.json();

    if (!tokenAddress || !name || !symbol) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create metadata JSON following Metaplex Token Metadata Standard
    const metadata = {
      name: name,
      symbol: symbol,
      description: description || '',
      image: imageUrl || '',
      external_url: website || '',
      attributes: [],
      properties: {
        files: imageUrl ? [
          {
            uri: imageUrl,
            type: 'image/png'
          }
        ] : [],
        category: 'token',
        creators: []
      }
    };

    // Add social links as attributes
    if (telegram) {
      metadata.attributes.push({
        trait_type: 'telegram',
        value: telegram
      });
    }

    if (twitter) {
      metadata.attributes.push({
        trait_type: 'twitter',
        value: twitter
      });
    }

    // In a real implementation, you would:
    // 1. Upload metadata JSON to IPFS or Arweave
    // 2. Call Metaplex Token Metadata program to create metadata account
    // 3. Associate metadata with token mint address
    
    // For now, return the metadata structure and instructions
    return Response.json({
      success: true,
      metadata,
      tokenAddress,
      message: 'Metadata created successfully',
      instructions: {
        step1: 'Upload metadata JSON to IPFS/Arweave',
        step2: 'Call Metaplex create_metadata_accounts_v3 instruction',
        step3: 'Pass token mint, metadata URI, and update authority'
      }
    });

  } catch (error) {
    console.error('Metadata creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});