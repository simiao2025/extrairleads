import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import PDFParser from "pdf2json";
import { db } from "@/db";
import { documents, knowledgeBase } from "@/db/schema";
import { auth } from "@/lib/auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to chunk text
function chunkText(text: string, maxTokens = 1000) {
  // A simple chunking strategy by paragraphs and words
  // In production, use a proper tokenizer (like tiktoken)
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxTokens * 4) {
      // Rough approximation of tokens to chars
      chunks.push(currentChunk.trim());
      currentChunk = `${paragraph}\n\n`;
    } else {
      currentChunk += `${paragraph}\n\n`;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    // Lê o conteúdo do arquivo
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedText = "";

    // Adiciona o documento no banco com status 'processing'
    const [documentRecord] = await db
      .insert(documents)
      .values({
        userId,
        fileName: file.name,
        fileType: file.type,
        status: "processing",
      })
      .returning();

    if (file.type === "application/pdf") {
      try {
        const pdfParser = new (PDFParser as any)(null, 1);
        extractedText = await new Promise<string>((resolve, reject) => {
          pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
          pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
          pdfParser.parseBuffer(buffer);
        });
      } catch (_err) {
        console.error("PDF Parsing Error:", _err);
        await db
          .update(documents)
          .set({ status: "error" })
          .where(eq(documents.id, documentRecord.id));
        return new NextResponse("Error parsing PDF", { status: 500 });
      }
    } else if (file.type === "text/plain") {
      extractedText = buffer.toString("utf-8");
    } else {
      await db
        .update(documents)
        .set({ status: "error" })
        .where(eq(documents.id, documentRecord.id));
      return new NextResponse("Unsupported file type", { status: 400 });
    }

    if (!extractedText.trim()) {
      await db
        .update(documents)
        .set({ status: "error" })
        .where(eq(documents.id, documentRecord.id));
      return new NextResponse("No text could be extracted", { status: 400 });
    }

    // 3. Chunking
    const chunks = chunkText(extractedText);

    // 4. Gerar Embeddings e Salvar
    for (const chunk of chunks) {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
        encoding_format: "float",
      });

      const embedding = response.data[0].embedding;

      await db.insert(knowledgeBase).values({
        userId,
        documentId: documentRecord.id,
        title: file.name,
        content: chunk,
        embedding: embedding,
      });
    }

    // 5. Atualizar status para completado
    await db
      .update(documents)
      .set({ status: "completed" })
      .where(eq(documents.id, documentRecord.id));

    return NextResponse.json({ success: true, document: documentRecord });
  } catch (_error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
