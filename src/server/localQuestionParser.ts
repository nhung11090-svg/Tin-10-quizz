import { Question } from '../types/quiz.js';

interface LocalParseResult {
  questions: (Question & { isDuplicate?: boolean; matchedText?: string })[];
  summary: {
    totalExtracted: number;
    hasAnswerCount: number;
    needsReviewCount: number;
    duplicateCount: number;
    sourceFile: string;
  };
}

// Map keywords to standard Tin 10 topics and lessons
export function detectTopicAndLesson(text: string): { topic: string; lessonName: string } {
  const lower = text.toLowerCase();
  
  if (lower.includes('python') || lower.includes('hàm') || lower.includes('biến') || lower.includes('vòng lặp') || lower.includes('print') || lower.includes('input') || lower.includes('if') || lower.includes('else') || lower.includes('while') || lower.includes('def') || lower.includes('range') || lower.includes('list') || lower.includes('chuỗi') || lower.includes('xâu')) {
    if (lower.includes('xâu') || lower.includes('chuỗi') || lower.includes('string')) {
      return { topic: 'Lập trình Python', lessonName: 'Bài 24: Xâu ký tự trong Python' };
    }
    if (lower.includes('vòng lặp') || lower.includes('for') || lower.includes('while')) {
      return { topic: 'Lập trình Python', lessonName: 'Bài 21: Câu lệnh lặp for và while' };
    }
    if (lower.includes('hàm') || lower.includes('def') || lower.includes('return')) {
      return { topic: 'Lập trình Python', lessonName: 'Bài 26: Hàm trong Python' };
    }
    if (lower.includes('danh sách') || lower.includes('list') || lower.includes('append')) {
      return { topic: 'Lập trình Python', lessonName: 'Bài 22: Kiểu dữ liệu danh sách' };
    }
    return { topic: 'Lập trình Python', lessonName: 'Bài 16: Ngôn ngữ lập trình bậc cao và Python' };
  }

  if (lower.includes('mạng') || lower.includes('internet') || lower.includes('lan') || lower.includes('wan') || lower.includes('ip') || lower.includes('router') || lower.includes('switch') || lower.includes('modem') || lower.includes('wifi')) {
    return { topic: 'Mạng máy tính & Internet', lessonName: 'Bài 6: Mạng máy tính và Internet' };
  }

  if (lower.includes('đạo đức') || lower.includes('pháp luật') || lower.includes('bản quyền') || lower.includes('an toàn số') || lower.includes('virus') || lower.includes('mã độc') || lower.includes('lừa đảo')) {
    return { topic: 'Đạo đức & Pháp luật số', lessonName: 'Bài 8: Đạo đức, pháp luật và văn hóa ứng xử qua mạng' };
  }

  if (lower.includes('phần cứng') || lower.includes('cpu') || lower.includes('ram') || lower.includes('ổ cứng') || lower.includes('rom') || lower.includes('thiết bị vào') || lower.includes('thiết bị ra') || lower.includes('hệ điều hành')) {
    return { topic: 'Máy tính và xã hội tri thức', lessonName: 'Bài 2: Thiết bị phần cứng và hệ điều hành' };
  }

  if (lower.includes('word') || lower.includes('excel') || lower.includes('powerpoint') || lower.includes('soạn thảo') || lower.includes('trình chiếu')) {
    return { topic: 'Ứng dụng tin học', lessonName: 'Bài 12: Phần mềm soạn thảo và trình chiếu nâng cao' };
  }

  return { topic: 'Lập trình Python', lessonName: 'Bài 18: Các lệnh vào ra đơn giản' };
}

// Extract standalone answer key tables (e.g. "BẢNG ĐÁP ÁN: 1.A 2.B 3.C...")
export function parseAnswerKeyFromText(fullText: string): Record<string, 'A' | 'B' | 'C' | 'D'> {
  const result: Record<string, 'A' | 'B' | 'C' | 'D'> = {};

  // Pattern 1: "1-A, 2-B, 3-C" or "1. A  2. B  3. C" or "1:A 2:B"
  const regex1 = /(?:câu\s*)?(\d+)[\s.:\-\)]+\s*([A-Da-d])(?!\w)/gi;
  let match;
  while ((match = regex1.exec(fullText)) !== null) {
    const qNum = match[1];
    const ans = match[2].toUpperCase() as 'A' | 'B' | 'C' | 'D';
    if (!result[qNum]) {
      result[qNum] = ans;
    }
  }

  return result;
}

// Rule-based question parser that parses Vietnamese MCQ format
export function parseQuestionsLocally(
  rawText: string, 
  sourceFileName: string = 'Văn bản trực tiếp',
  existingQuestions: Question[] = []
): LocalParseResult {
  const questions: (Question & { isDuplicate?: boolean; matchedText?: string })[] = [];
  
  // Normalize line endings
  const cleanText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Try to find if there is an answer table at the bottom
  const answerKeyMap = parseAnswerKeyFromText(cleanText);

  // Split into question blocks using regex matching "Câu 1:", "Câu 1.", "Bài 1:", "Q1:", or numbered items
  const questionBlockRegex = /(?:^|\n)(?:(?:Câu|Bài|Q)\s*(\d+)[\s.:\)]+|(\d+)[\.:\)]\s*(?=[A-ZÀ-Ỹ]))/gi;
  
  const matches: { index: number; qNum: number; fullMatch: string }[] = [];
  let m;
  while ((m = questionBlockRegex.exec(cleanText)) !== null) {
    const qNum = parseInt(m[1] || m[2], 10);
    matches.push({
      index: m.index,
      qNum: isNaN(qNum) ? matches.length + 1 : qNum,
      fullMatch: m[0]
    });
  }

  let rawBlocks: { qNum: number; text: string }[] = [];

  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = i < matches.length - 1 ? matches[i + 1].index : cleanText.length;
      rawBlocks.push({
        qNum: matches[i].qNum,
        text: cleanText.substring(start, end).trim()
      });
    }
  } else {
    // If no "Câu X" was found, try splitting by double newline or numbered lines
    const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim().length > 20);
    paragraphs.forEach((p, idx) => {
      if (/[A-D][\.\)]/i.test(p)) {
        rawBlocks.push({ qNum: idx + 1, text: p.trim() });
      }
    });
  }

  let hasAnswerCount = 0;
  let needsReviewCount = 0;
  let duplicateCount = 0;

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i];
    const blockText = block.text;

    // 1. Detect correct answer inside block:
    // e.g. "Đáp án: A", "Đ/A: B", "Key: C", "Chọn đáp án D"
    let detectedAnswer: 'A' | 'B' | 'C' | 'D' | '' = '';
    const ansMatch = blockText.match(/(?:đáp\s*án|đ\/a|key|chọn|câu\s*trả\s*lời)[\s:=-]+([A-D])/i);
    if (ansMatch && ['A', 'B', 'C', 'D'].includes(ansMatch[1].toUpperCase())) {
      detectedAnswer = ansMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
    } else if (answerKeyMap[block.qNum.toString()]) {
      detectedAnswer = answerKeyMap[block.qNum.toString()];
    }

    // 2. Extract options A, B, C, D
    // Common formats:
    // A. ... B. ... C. ... D. ...
    // A) ... B) ... C) ... D) ...
    // [A] ... [B] ...
    // Look for A., B., C., D. markers
    let optA = '';
    let optB = '';
    let optC = '';
    let optD = '';
    let questionText = blockText;
    let codeSnippet: string | undefined = undefined;

    // Check if there is python code block ```python ... ```
    const codeMatch = blockText.match(/```(?:python)?\s*([\s\S]*?)```/i);
    if (codeMatch) {
      codeSnippet = codeMatch[1].trim();
      questionText = questionText.replace(codeMatch[0], '');
    }

    // Extract options with regex
    const optRegex = /(?:^|\n|\s+)(?:[\*\[\(]?([A-D])[\.\)\]]\s*)/g;
    const optPositions: { option: string; index: number; length: number }[] = [];
    let om;
    while ((om = optRegex.exec(blockText)) !== null) {
      optPositions.push({
        option: om[1].toUpperCase(),
        index: om.index,
        length: om[0].length
      });
    }

    // Filter to ensure A, B, C, D appear in roughly sequential order
    const validPositions = optPositions.filter(p => ['A', 'B', 'C', 'D'].includes(p.option));

    if (validPositions.length >= 2) {
      // Question text is before first option
      const firstOptIndex = validPositions[0].index;
      questionText = blockText.substring(0, firstOptIndex).trim();

      // Clean prefix "Câu X:" from question text
      questionText = questionText.replace(/^(?:(?:câu|bài|q)\s*\d+[\s.:\)]+|\d+[\.:\)]\s*)/i, '').trim();

      // Extract each option text
      for (let j = 0; j < validPositions.length; j++) {
        const cur = validPositions[j];
        const next = validPositions[j + 1];
        const start = cur.index + cur.length;
        const end = next ? next.index : blockText.length;
        let optVal = blockText.substring(start, end).trim();

        // Check if this option was marked with asterisk or bold for correct answer (e.g. *A. hoặc <b>A</b>)
        const precedingChunk = blockText.substring(Math.max(0, cur.index - 3), cur.index + cur.length);
        if (precedingChunk.includes('*') && !detectedAnswer) {
          detectedAnswer = cur.option as 'A' | 'B' | 'C' | 'D';
        }

        // Clean any trailing "Đáp án:" from option D
        optVal = optVal.replace(/(?:đáp\s*án|đ\/a|key)[\s:=-]+[A-D].*$/i, '').trim();

        if (cur.option === 'A') optA = optVal;
        else if (cur.option === 'B') optB = optVal;
        else if (cur.option === 'C') optC = optVal;
        else if (cur.option === 'D') optD = optVal;
      }
    } else {
      // Fallback if options couldn't be cleanly isolated
      questionText = blockText.replace(/^(?:(?:câu|bài|q)\s*\d+[\s.:\)]+|\d+[\.:\)]\s*)/i, '').trim();
      optA = 'Phương án A';
      optB = 'Phương án B';
      optC = 'Phương án C';
      optD = 'Phương án D';
    }

    // If options are missing, set defaults to allow teacher editing
    if (!optA) optA = 'Lựa chọn A';
    if (!optB) optB = 'Lựa chọn B';
    if (!optC) optC = 'Lựa chọn C';
    if (!optD) optD = 'Lựa chọn D';

    // Topic & lesson classification
    const { topic, lessonName } = detectTopicAndLesson(questionText + ' ' + (codeSnippet || ''));

    // Check duplicate
    const norm = questionText.toLowerCase().replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, '');
    let isDuplicate = false;
    let matchedText: string | undefined = undefined;

    for (const eq of existingQuestions) {
      const eqNorm = eq.text.toLowerCase().replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, '');
      if (norm && eqNorm && (norm === eqNorm || (norm.length > 30 && eqNorm.includes(norm)))) {
        isDuplicate = true;
        matchedText = eq.text;
        break;
      }
    }

    const hasAnswer = Boolean(detectedAnswer && ['A', 'B', 'C', 'D'].includes(detectedAnswer));
    if (hasAnswer) hasAnswerCount++;
    else needsReviewCount++;
    if (isDuplicate) duplicateCount++;

    const newQ: Question & { isDuplicate?: boolean; matchedText?: string } = {
      id: `q-loc-${Date.now()}-${i}`,
      questionNumber: block.qNum || (existingQuestions.length + i + 1),
      text: questionText || `Câu hỏi ${block.qNum}`,
      codeSnippet,
      options: {
        A: optA,
        B: optB,
        C: optC,
        D: optD,
      },
      correctAnswer: hasAnswer ? detectedAnswer as 'A' | 'B' | 'C' | 'D' : '',
      topic,
      lessonName,
      difficulty: 'Thông hiểu',
      status: hasAnswer && !isDuplicate ? 'approved' : 'needs_review',
      explanation: hasAnswer ? {
        correctAnswer: detectedAnswer as 'A' | 'B' | 'C' | 'D',
        whyCorrect: `Phương án ${detectedAnswer} đúng theo chuẩn kiến thức ${lessonName} - SGK Tin học 10.`,
        whyOthersWrong: {},
        keyTakeaway: 'Nắm vững khái niệm và quy tắc cốt lõi trong bài học.',
        isVerifiedSGK: true,
        textbookReference: `SGK Tin học 10 - ${lessonName}`
      } : undefined,
      createdAt: new Date().toISOString(),
      sourceFile: sourceFileName,
      isDuplicate,
      matchedText
    };

    questions.push(newQ);
  }

  return {
    questions,
    summary: {
      totalExtracted: questions.length,
      hasAnswerCount,
      needsReviewCount,
      duplicateCount,
      sourceFile: sourceFileName
    }
  };
}
