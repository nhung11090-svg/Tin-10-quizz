import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  const originalName = file.originalname.toLowerCase();

  // 1. Plain text / Markdown
  if (originalName.endsWith('.txt') || originalName.endsWith('.md')) {
    return file.buffer.toString('utf-8');
  }

  // 2. Word documents (.docx)
  if (originalName.endsWith('.docx')) {
    try {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      if (result.value && result.value.trim().length > 0) {
        return result.value;
      }
    } catch (err: any) {
      console.warn('Lỗi mammoth docx, fallback text:', err?.message);
    }
    return file.buffer.toString('utf-8');
  }

  // 3. Excel (.xlsx, .xls, .csv)
  if (originalName.endsWith('.xlsx') || originalName.endsWith('.xls') || originalName.endsWith('.csv')) {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      let text = '';
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const sheetText = XLSX.utils.sheet_to_txt(worksheet);
        text += `--- Bảng: ${sheetName} ---\n${sheetText}\n\n`;
      }
      return text;
    } catch (err: any) {
      console.warn('Lỗi đọc Excel:', err?.message);
      return file.buffer.toString('utf-8');
    }
  }

  // 4. PDF documents (.pdf)
  if (originalName.endsWith('.pdf')) {
    try {
      const pdfModule = await import('pdf-parse');
      let extracted = '';

      // Check if PDFParse class is present (pdf-parse v2)
      if (typeof (pdfModule as any).PDFParse === 'function') {
        const ParserClass = (pdfModule as any).PDFParse;
        const parser = new ParserClass({ data: file.buffer, verbosity: 0 });
        const res = await parser.getText();
        extracted = typeof res === 'string' ? res : (res?.text || '');
        if (typeof parser.destroy === 'function') {
          try { await parser.destroy(); } catch (_) {}
        }
      } else if (typeof (pdfModule as any).default === 'function') {
        // pdf-parse v1 function format
        const data = await (pdfModule as any).default(file.buffer);
        extracted = data?.text || '';
      } else if (typeof pdfModule === 'function') {
        const data = await (pdfModule as any)(file.buffer);
        extracted = data?.text || '';
      }

      if (extracted && extracted.trim().length > 0) {
        return extracted;
      }
    } catch (err: any) {
      console.warn('PDF extraction with pdf-parse error, trying stream scan fallback:', err?.message);
    }

    // Direct text stream extraction fallback for text-based PDFs
    try {
      const latinText = file.buffer.toString('latin1');
      const matches = latinText.match(/\(([^()]{3,})\)Tj/g);
      if (matches && matches.length > 5) {
        return matches.map(m => m.replace(/^\(|\)Tj$/g, '')).join(' ');
      }
    } catch (_) {}

    return file.buffer.toString('utf-8');
  }

  // Fallback to utf-8
  return file.buffer.toString('utf-8');
}
