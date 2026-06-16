async function compress(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const stream = new Response(encoder.encode(input))
    .body!
    .pipeThrough(new CompressionStream("gzip"));
  const compressed = await new Response(stream).arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(compressed)));
}

async function decompress(encoded: string): Promise<string> {
  const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const stream = new Response(bytes)
    .body!
    .pipeThrough(new DecompressionStream("gzip"));
  const decompressed = await new Response(stream).arrayBuffer();
  return new TextDecoder().decode(decompressed);
}

export async function encodeForUrl(json: string): Promise<string> {
  return encodeURIComponent(await compress(json));
}

export async function decodeFromUrl(param: string): Promise<string> {
  return decompress(decodeURIComponent(param));
}
