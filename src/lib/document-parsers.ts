import * as XLSX from "xlsx";

export interface DocumentChunk {
	title: string;
	content: string;
}

/**
 * Main router to parse documents based on extension or mimeType
 */
export async function parseDocument(
	buffer: Buffer,
	fileName: string,
	mimeType: string,
): Promise<DocumentChunk[]> {
	const extension = fileName.split(".").pop()?.toLowerCase();

	if (
		extension === "md" ||
		mimeType === "text/markdown" ||
		mimeType === "text/x-markdown"
	) {
		const text = buffer.toString("utf-8");
		return parseMarkdownByHeaders(text, fileName);
	}

	if (
		extension === "xls" ||
		extension === "xlsx" ||
		mimeType === "application/vnd.ms-excel" ||
		mimeType ===
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	) {
		return parseExcelToMarkdown(buffer, fileName);
	}

	throw new Error(`Unsupported file type: ${mimeType || extension}`);
}

/**
 * Parses markdown files by their headings (# H1, ## H2, etc.)
 */
export function parseMarkdownByHeaders(
	text: string,
	fileName: string,
): DocumentChunk[] {
	const lines = text.split(/\r?\n/);
	const chunks: DocumentChunk[] = [];

	let currentTitlePath: string[] = [];
	let currentContentLines: string[] = [];
	let isContinuation = false;

	const MAX_CHUNK_LENGTH = 3500; // Roughly 800-1000 tokens

	const saveCurrentChunk = () => {
		const content = currentContentLines.join("\n").trim();
		if (content) {
			const suffix = isContinuation ? " (Continuação)" : "";
			const sectionPath =
				currentTitlePath.length > 0
					? currentTitlePath.join(" > ") + suffix
					: "Geral" + suffix;
			const title = `${fileName} > ${sectionPath}`;
			chunks.push({ title, content });
		}
		currentContentLines = [];
	};

	for (const line of lines) {
		const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);

		if (headerMatch) {
			// Save what we have accumulated so far before starting the new heading
			saveCurrentChunk();
			isContinuation = false;

			const level = headerMatch[1].length; // number of #s
			const titleText = headerMatch[2].trim();

			// Update heading path based on depth level
			currentTitlePath = currentTitlePath.slice(0, level - 1);
			currentTitlePath[level - 1] = titleText;
		} else {
			// Check if current chunk is getting too big, if so, split it
			const currentLength = currentContentLines.join("\n").length;
			if (currentLength + line.length > MAX_CHUNK_LENGTH) {
				saveCurrentChunk();
				isContinuation = true;
			}
			currentContentLines.push(line);
		}
	}

	// Save any remaining content
	saveCurrentChunk();

	return chunks;
}

/**
 * Parses Excel spreadsheets and converts sheets to Markdown tables,
 * splitting large tables while replicating headers.
 */
export function parseExcelToMarkdown(
	buffer: Buffer,
	fileName: string,
): DocumentChunk[] {
	const workbook = XLSX.read(buffer, { type: "buffer" });
	const chunks: DocumentChunk[] = [];

	const ROWS_PER_CHUNK = 20;

	for (const sheetName of workbook.SheetNames) {
		const sheet = workbook.Sheets[sheetName];
		// Read raw 2D array of rows
		const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

		if (rows.length === 0) continue;

		// Header is the first row
		const headerRow = rows[0] as any[];
		if (!headerRow || headerRow.length === 0) continue;

		// Map header columns to clean strings
		const cleanHeaders = headerRow.map((cell) =>
			cell !== null && cell !== undefined ? String(cell).trim() : "",
		);

		// Build Markdown header separator row (e.g. "| --- | --- |")
		const separatorRow = cleanHeaders.map(() => "---");

		// Extract actual data rows
		const dataRows = rows.slice(1).filter((row: any[]) => {
			// Keep only non-empty rows
			return (
				row &&
				row.some(
					(cell) =>
						cell !== null && cell !== undefined && String(cell).trim() !== "",
				)
			);
		});

		if (dataRows.length === 0) {
			// If we only have the header, just save it as a simple chunk
			const mdTable = [
				`| ${cleanHeaders.join(" | ")} |`,
				`| ${separatorRow.join(" | ")} |`,
			].join("\n");

			chunks.push({
				title: `${fileName} > Aba: ${sheetName}`,
				content: mdTable,
			});
			continue;
		}

		// Split rows into chunks
		for (let i = 0; i < dataRows.length; i += ROWS_PER_CHUNK) {
			const chunkDataRows = dataRows.slice(i, i + ROWS_PER_CHUNK);
			const tableLines: string[] = [];

			// 1. Prepend header row and separator to every chunk
			tableLines.push(`| ${cleanHeaders.join(" | ")} |`);
			tableLines.push(`| ${separatorRow.join(" | ")} |`);

			// 2. Append the structured data rows
			for (const row of chunkDataRows) {
				const mdRow = cleanHeaders.map((_, colIndex) => {
					const val = row[colIndex];
					return val !== null && val !== undefined
						? String(val).replace(/\r?\n/g, " ").trim()
						: "";
				});
				tableLines.push(`| ${mdRow.join(" | ")} |`);
			}

			const partIndex = Math.floor(i / ROWS_PER_CHUNK) + 1;
			const totalParts = Math.ceil(dataRows.length / ROWS_PER_CHUNK);

			const partSuffix =
				totalParts > 1 ? ` (Parte ${partIndex} de ${totalParts})` : "";

			chunks.push({
				title: `${fileName} > Aba: ${sheetName}${partSuffix}`,
				content: tableLines.join("\n"),
			});
		}
	}

	return chunks;
}
