import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, symbol, description, imageUrl, website, telegram, twitter } = await req.json();

    if (!name || !symbol) {
      return Response.json({ error: 'Missing required fields: name and symbol' }, { status: 400 });
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
            type: imageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg'
          }
        ] : [],
        category: 'fungible'
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

    // Upload to IPFS via Pinata (free tier)
    const pinataApiKey = Deno.env.get('PINATA_API_KEY');
    const pinataSecretKey = Deno.env.get('PINATA_SECRET_KEY');

    if (!pinataApiKey || !pinataSecretKey) {
      // Fallback: Use a public IPFS gateway (NFT.Storage or similar)
      // For now, return the metadata and let frontend handle it
      return Response.json({
        success: true,
        metadata,
        metadataUri: null,
        message: 'IPFS upload not configured. Please set PINATA_API_KEY and PINATA_SECRET_KEY environment variables.',
        needsUpload: true
      });
    }

    // Upload to Pinata IPFS
    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `${symbol}-metadata`
        }
      })
    });

    if (!pinataResponse.ok) {
      throw new Error('Failed to upload to IPFS');
    }

    const pinataData = await pinataResponse.json();
    const metadataUri = `https://gateway.pinata.cloud/ipfs/${pinataData.IpfsHash}`;

    return Response.json({
      success: true,
      metadata,
      metadataUri,
      ipfsHash: pinataData.IpfsHash
    });

  } catch (error) {
    console.error('Metadata upload error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});