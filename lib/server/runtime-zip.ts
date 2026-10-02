type ZipEntry = {
  path: string;
  bytes: Uint8Array;
};

const MAX_FILES = 500;
const MAX_TOTAL_UNCOMPRESSED = 80 * 1024 * 1024;

function u16(view: DataView, offset: number) {
  return view.getUint16(offset, true);
}
function u32(view: DataView, offset: number) {
  return view.getUint32(offset, true);
}

function safePath(name: string) {
  const normalized = name.replace(/\\/g, "/").replace(/^\/+/, "");
  if (
    !normalized ||
    normalized.includes("\0") ||
    normalized.split("/").some((part) => part === ".." || part === ".")
  ) {
    throw new Error("unsafe_zip_path");
  }
  return normalized;
}

async function inflateRaw(bytes: Uint8Array) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function unzipStaticBundle(input: ArrayBuffer): Promise<ZipEntry[]> {
  const bytes = new Uint8Array(input);
  const view = new DataView(input);
  if (bytes.byteLength < 22) throw new Error("invalid_zip");

  let eocd = -1;
  const min = Math.max(0, bytes.byteLength - 22 - 65535);
  for (let i = bytes.byteLength - 22; i >= min; i -= 1) {
    if (u32(view, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("zip_eocd_missing");

  const count = u16(view, eocd + 10);
  const centralOffset = u32(view, eocd + 16);
  if (count <= 0 || count > MAX_FILES) throw new Error("zip_file_count_invalid");

  const decoder = new TextDecoder();
  const out: ZipEntry[] = [];
  let cursor = centralOffset;
  let total = 0;

  for (let index = 0; index < count; index += 1) {
    if (u32(view, cursor) !== 0x02014b50) throw new Error("zip_central_invalid");

    const method = u16(view, cursor + 10);
    const compressedSize = u32(view, cursor + 20);
    const uncompressedSize = u32(view, cursor + 24);
    const nameLength = u16(view, cursor + 28);
    const extraLength = u16(view, cursor + 30);
    const commentLength = u16(view, cursor + 32);
    const localOffset = u32(view, cursor + 42);

    const rawName = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));
    cursor += 46 + nameLength + extraLength + commentLength;

    if (rawName.endsWith("/")) continue;
    const path = safePath(rawName);

    total += uncompressedSize;
    if (total > MAX_TOTAL_UNCOMPRESSED) throw new Error("zip_uncompressed_too_large");
    if (![0, 8].includes(method)) throw new Error("zip_compression_unsupported");
    if (u32(view, localOffset) !== 0x04034b50) throw new Error("zip_local_invalid");

    const localNameLength = u16(view, localOffset + 26);
    const localExtraLength = u16(view, localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataOffset, dataOffset + compressedSize);

    const data = method === 0 ? compressed : await inflateRaw(compressed);
    if (uncompressedSize && data.byteLength !== uncompressedSize) {
      throw new Error("zip_size_mismatch");
    }
    out.push({ path, bytes: data });
  }

  if (!out.some((entry) => entry.path === "index.html")) {
    throw new Error("index_html_required");
  }
  return out;
}

export function contentTypeForPath(path: string) {
  const ext = path.toLowerCase().split(".").pop() ?? "";
  const map: Record<string, string> = {
    html: "text/html; charset=utf-8",
    css: "text/css; charset=utf-8",
    js: "text/javascript; charset=utf-8",
    mjs: "text/javascript; charset=utf-8",
    json: "application/json; charset=utf-8",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    ico: "image/x-icon",
    wasm: "application/wasm",
    mp3: "audio/mpeg",
    ogg: "audio/ogg",
    wav: "audio/wav",
    mp4: "video/mp4",
    webm: "video/webm",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
  };
  return map[ext] ?? "application/octet-stream";
}
