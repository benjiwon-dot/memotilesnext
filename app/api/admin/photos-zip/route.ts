import JSZip from "jszip";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ReqBody = {
  folderName: string;
  files: Array<{
    url: string;
    name: string;
  }>;
};

function sanitizePart(input: string) {
  return (input || "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

async function fetchAsArrayBuffer(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch: ${url} (${res.status})`);
  return await res.arrayBuffer();
}

function guessExtFromUrl(url: string) {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".png")) return "png";
  if (clean.endsWith(".webp")) return "webp";
  if (clean.endsWith(".jpeg")) return "jpg";
  if (clean.endsWith(".jpg")) return "jpg";
  return "jpg";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody;

    const folderName = sanitizePart(body?.folderName || "order_photos");
    const files = Array.isArray(body?.files) ? body.files : [];

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const zip = new JSZip();
    const folder = zip.folder(folderName);

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f?.url) continue;

      const ext = guessExtFromUrl(f.url);
      const baseName = sanitizePart(f.name || `${String(i + 1).padStart(2, "0")}.${ext}`);
      const fileName = baseName.includes(".") ? baseName : `${baseName}.${ext}`;

      const ab = await fetchAsArrayBuffer(f.url);
      folder?.file(fileName, ab);
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const zipFileName = `${folderName}.zip`;

    // ✅ 헤더: 한글 파일명 안전 처리
    const asciiFallback = zipFileName
      .replace(/[^\x20-\x7E]/g, "_")
      .replace(/"+/g, "_");

    const encoded = encodeURIComponent(zipFileName);

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "ZIP generation failed" },
      { status: 500 }
    );
  }
}
