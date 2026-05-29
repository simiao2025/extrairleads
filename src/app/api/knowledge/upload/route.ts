import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import PDFParser from "pdf2json";
import { db } from "@/db";
import { documents, knowledgeBase } from "@/db/schema";
import { auth } from "@/lib/auth";
import { parseDocument } from "@/lib/document-parsers";

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

    let chunks: { title: string; content: string }[] = [];
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (
      extension === "md" ||
      extension === "xls" ||
      extension === "xlsx" ||
      file.type === "text/markdown" ||
      file.type === "text/x-markdown" ||
      file.type === "application/vnd.ms-excel" ||
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      try {
        chunks = await parseDocument(buffer, file.name, file.type);
      } catch (err) {
        console.error("Document Parsing Error:", err);
        await db
          .update(documents)
          .set({ status: "error" })
          .where(eq(documents.id, documentRecord.id));
        return new NextResponse("Error parsing document", { status: 500 });
      }
    } else if (file.type === "application/pdf" || extension === "pdf") {
      try {
        const pdfParser = new (PDFParser as any)(null, 1);
        const extractedText = await new Promise<string>((resolve, reject) => {
          pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
          pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
          pdfParser.parseBuffer(buffer);
        });

        if (!extractedText.trim()) {
          throw new Error("No text extracted from PDF");
        }

        const textChunks = chunkText(extractedText);
        chunks = textChunks.map((c) => ({ title: file.name, content: c }));
      } catch (_err) {
        console.error("PDF Parsing Error:", _err);
        await db
          .update(documents)
          .set({ status: "error" })
          .where(eq(documents.id, documentRecord.id));
        return new NextResponse("Error parsing PDF", { status: 500 });
      }
    } else if (file.type === "text/plain" || extension === "txt") {
      const extractedText = buffer.toString("utf-8");
      if (!extractedText.trim()) {
        await db
          .update(documents)
          .set({ status: "error" })
          .where(eq(documents.id, documentRecord.id));
        return new NextResponse("No text could be extracted", { status: 400 });
      }
      const textChunks = chunkText(extractedText);
      chunks = textChunks.map((c) => ({ title: file.name, content: c }));
    } else {
      await db
        .update(documents)
        .set({ status: "error" })
        .where(eq(documents.id, documentRecord.id));
      return new NextResponse("Unsupported file type", { status: 400 });
    }

    if (chunks.length === 0) {
      await db
        .update(documents)
        .set({ status: "error" })
        .where(eq(documents.id, documentRecord.id));
      return new NextResponse("No text could be extracted", { status: 400 });
    }

    // 4. Gerar Embeddings e Salvar (com rollback em caso de falha)
    try {
      for (const chunk of chunks) {
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: chunk.content,
          encoding_format: "float",
        });

        const embedding = response.data[0].embedding;

        await db.insert(knowledgeBase).values({
          userId,
          documentId: documentRecord.id,
          title: chunk.title,
          content: chunk.content,
          embedding: embedding,
        });
      }
    } catch (embeddingError) {
      console.error("Embedding Generation Error:", embeddingError);

      // Rollback: Deleta chunks inseridos parcialmente
      await db.delete(knowledgeBase).where(eq(knowledgeBase.documentId, documentRecord.id));

      await db
        .update(documents)
        .set({ status: "error" })
        .where(eq(documents.id, documentRecord.id));

      return new NextResponse("Error generating embeddings", { status: 500 });
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
