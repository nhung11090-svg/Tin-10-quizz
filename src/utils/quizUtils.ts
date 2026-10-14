import { Question, AIExplanation } from '../types/quiz.js';

export interface ShuffledQuestion extends Question {
  originalQuestionId: string;
  originalCorrectAnswer?: 'A' | 'B' | 'C' | 'D' | '';
  optionMapping: Record<'A' | 'B' | 'C' | 'D', 'A' | 'B' | 'C' | 'D'>; // newKey -> oldKey
}

/**
 * Shuffles questions order and/or options while accurately preserving correct answer mapping
 */
export function prepareQuizQuestions(
  questions: Question[],
  shuffleQuestions: boolean,
  shuffleOptions: boolean
): ShuffledQuestion[] {
  let list = questions.map(q => ({ ...q }));

  if (shuffleQuestions) {
    list.sort(() => Math.random() - 0.5);
  }

  return list.map(q => {
    if (!shuffleOptions) {
      return {
        ...q,
        originalQuestionId: q.id,
        originalCorrectAnswer: q.correctAnswer,
        optionMapping: { A: 'A', B: 'B', C: 'C', D: 'D' }
      };
    }

    // Shuffle options A, B, C, D
    const availableKeys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'].filter(
      k => !!q.options[k as 'A' | 'B' | 'C' | 'D']
    ) as any;

    const shuffledKeys = [...availableKeys].sort(() => Math.random() - 0.5);
    const newOptions: Record<'A' | 'B' | 'C' | 'D', string> = { A: '', B: '', C: '', D: '' };
    const optionMapping: Record<'A' | 'B' | 'C' | 'D', 'A' | 'B' | 'C' | 'D'> = { A: 'A', B: 'B', C: 'C', D: 'D' };

    let newCorrectAnswer: 'A' | 'B' | 'C' | 'D' | '' = '';

    availableKeys.forEach((newKey, idx) => {
      const oldKey = shuffledKeys[idx];
      newOptions[newKey] = q.options[oldKey];
      optionMapping[newKey] = oldKey;

      if (q.correctAnswer === oldKey) {
        newCorrectAnswer = newKey;
      }
    });

    // Remap explanation whyOthersWrong to match new keys
    let newExplanation: AIExplanation | undefined = undefined;
    if (q.explanation) {
      const newWhyOthers: Record<string, string> = {};
      Object.entries(optionMapping).forEach(([newKey, oldKey]) => {
        if (q.explanation?.whyOthersWrong?.[oldKey as 'A' | 'B' | 'C' | 'D']) {
          newWhyOthers[newKey] = q.explanation.whyOthersWrong[oldKey as 'A' | 'B' | 'C' | 'D']!;
        }
      });

      newExplanation = {
        ...q.explanation,
        correctAnswer: (newCorrectAnswer || 'A') as 'A' | 'B' | 'C' | 'D',
        whyOthersWrong: newWhyOthers
      };
    }

    return {
      ...q,
      originalQuestionId: q.id,
      originalCorrectAnswer: q.correctAnswer,
      options: newOptions,
      correctAnswer: newCorrectAnswer,
      optionMapping,
      explanation: newExplanation || q.explanation
    };
  });
}

/**
 * Download sample test file template (.txt or .docx format)
 */
export function downloadSampleTemplate(type: 'txt' | 'json') {
  if (type === 'txt') {
    const sample = `NGÂN HÀNG CÂU HỎI TRẮC NGHIỆM TIN HỌC 10
Chủ đề: Lập trình cơ bản với Python & Mạng máy tính

Câu 1: Trong Python, để in một dòng chữ ra màn hình ta sử dụng hàm nào?
A. echo()
B. write()
C. print()
D. output()
Đáp án: C
Giải thích: Hàm print() trong Python là hàm tích hợp sẵn dùng để xuất dữ liệu ra màn hình chuẩn.

Câu 2: Đoạn mã sau in ra giá trị gì?
x = 10
y = 3
print(x % y)
A. 1
B. 3
C. 3.33
D. 0
Đáp án: A
Giải thích: Toán tử % chia lấy phần dư. 10 chia cho 3 được 3 dư 1.

Câu 3: Đâu là thiết bị có chức năng kết nối các máy tính trong cùng mạng cục bộ (LAN) và chuyển tiếp khung dữ liệu theo địa chỉ MAC?
A. Switch
B. Modem
C. Chuột máy tính
D. Bàn phím
Đáp án: A

Câu 4: Tên biến nào sau đây là KHÔNG hợp lệ trong Python?
A. _diem_so
B. 2ban_hoc
C. diem_toan
D. tong123
Đáp án: B
`;
    const blob = new Blob([sample], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mau_De_Tranh_Nghiem_Tin10.txt';
    a.click();
    URL.revokeObjectURL(url);
  }
}
