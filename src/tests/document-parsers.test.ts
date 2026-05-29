import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  parseDocument,
  parseExcelToMarkdown,
  parseMarkdownByHeaders,
} from "../lib/document-parsers";

describe("document-parsers", () => {
  describe("parseMarkdownByHeaders", () => {
    it("should parse markdown and group text by headings", () => {
      const markdown = `
# Introdução
Este é o texto de introdução.
Com múltiplas linhas.

## Recursos
Aqui estão os recursos principais:
- Recurso A
- Recurso B

# Conclusão
Fim do documento.
      `.trim();

      const chunks = parseMarkdownByHeaders(markdown, "teste.md");

      expect(chunks).toHaveLength(3);

      expect(chunks[0].title).toBe("teste.md > Introdução");
      expect(chunks[0].content).toContain("Este é o texto de introdução.");

      expect(chunks[1].title).toBe("teste.md > Introdução > Recursos");
      expect(chunks[1].content).toContain("- Recurso A");

      expect(chunks[2].title).toBe("teste.md > Conclusão");
      expect(chunks[2].content).toBe("Fim do documento.");
    });

    it("should split large sections while maintaining heading context", () => {
      // Create a very large section with paragraphs
      const longText = "Parágrafo longo.\n\n".repeat(300);
      const markdown = `# Seção Longa\n${longText}`;

      const chunks = parseMarkdownByHeaders(markdown, "longo.md");

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].title).toBe("longo.md > Seção Longa");
      expect(chunks[1].title).toBe("longo.md > Seção Longa (Continuação)");
    });
  });

  describe("parseExcelToMarkdown", () => {
    it("should convert an Excel spreadsheet to a Markdown table chunk", () => {
      const data = [
        ["Nome", "Telefone", "Cidade"],
        ["João Silva", "11999999999", "São Paulo"],
        ["Maria Santos", "21988888888", "Rio de Janeiro"],
      ];

      // Create Excel workbook in memory
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Leads");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const chunks = parseExcelToMarkdown(buffer, "leads.xlsx");

      expect(chunks).toHaveLength(1);
      expect(chunks[0].title).toBe("leads.xlsx > Aba: Leads");
      expect(chunks[0].content).toContain("| Nome | Telefone | Cidade |");
      expect(chunks[0].content).toContain("| --- | --- | --- |");
      expect(chunks[0].content).toContain("| João Silva | 11999999999 | São Paulo |");
      expect(chunks[0].content).toContain("| Maria Santos | 21988888888 | Rio de Janeiro |");
    });

    it("should split large Excel sheets and replicate headers in each chunk", () => {
      const header = ["ID", "Produto", "Preço"];
      const rows = [header];

      // Generate 45 rows of mock data (total 46 rows including header)
      for (let i = 1; i <= 45; i++) {
        rows.push([String(i), `Produto ${i}`, `R$ ${10 * i}`]);
      }

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Estoque");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const chunks = parseExcelToMarkdown(buffer, "estoque.xlsx");

      // 45 data rows / 20 rows per chunk = 3 chunks (20, 20, 5)
      expect(chunks).toHaveLength(3);

      expect(chunks[0].title).toBe("estoque.xlsx > Aba: Estoque (Parte 1 de 3)");
      expect(chunks[1].title).toBe("estoque.xlsx > Aba: Estoque (Parte 2 de 3)");
      expect(chunks[2].title).toBe("estoque.xlsx > Aba: Estoque (Parte 3 de 3)");

      // Every chunk must contain the Markdown header
      for (const chunk of chunks) {
        expect(chunk.content).toContain("| ID | Produto | Preço |");
        expect(chunk.content).toContain("| --- | --- | --- |");
      }

      // Check specific rows are in their correct chunks
      expect(chunks[0].content).toContain("| 1 | Produto 1 | R$ 10 |");
      expect(chunks[0].content).toContain("| 20 | Produto 20 | R$ 200 |");
      expect(chunks[0].content).not.toContain("| 21 | Produto 21 | R$ 210 |");

      expect(chunks[1].content).toContain("| 21 | Produto 21 | R$ 210 |");
      expect(chunks[1].content).toContain("| 40 | Produto 40 | R$ 400 |");
      expect(chunks[1].content).not.toContain("| 1 | Produto 1 | R$ 10 |");

      expect(chunks[2].content).toContain("| 41 | Produto 41 | R$ 410 |");
      expect(chunks[2].content).toContain("| 45 | Produto 45 | R$ 450 |");
    });
  });

  describe("parseDocument router", () => {
    it("should successfully route parsing based on file extension", async () => {
      const markdown = "# Teste\nOlá Mundo";
      const buffer = Buffer.from(markdown, "utf-8");

      const chunks = await parseDocument(buffer, "documento.md", "text/markdown");
      expect(chunks).toHaveLength(1);
      expect(chunks[0].title).toBe("documento.md > Teste");
      expect(chunks[0].content).toBe("Olá Mundo");
    });

    it("should throw error for unsupported extension", async () => {
      const buffer = Buffer.from("conteudo", "utf-8");
      await expect(parseDocument(buffer, "imagem.png", "image/png")).rejects.toThrow(
        "Unsupported file type",
      );
    });
  });
});
