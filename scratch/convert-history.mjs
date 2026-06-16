import fs from 'fs';

const data = JSON.parse(fs.readFileSync('history.json', 'utf8'));

let out = `import type { QuestionSeed } from "@/data/seed/questions";\n\n`;
out += `export const HISTORY_SEEDS: QuestionSeed[] = [\n`;

let errorCount = 0;

for (const item of data) {
  const key = Object.keys(item)[0];
  const qData = item[key];
  
  const numMatch = key.match(/\d+/);
  const num = numMatch ? numMatch[0] : '';
  
  const questionText = `${num}. ${qData.question}`;
  
  const options = qData.options;
  if (!options || options.length !== 4) {
    console.warn(`Question ${key} does not have exactly 4 options.`);
    errorCount++;
    continue;
  }
  
  const correctAnswer = qData.correct_answer;
  let correctOption = '';
  if (correctAnswer === options[0]) correctOption = 'A';
  else if (correctAnswer === options[1]) correctOption = 'B';
  else if (correctAnswer === options[2]) correctOption = 'C';
  else if (correctAnswer === options[3]) correctOption = 'D';
  else {
    // Sometimes there might be a trailing space or slight difference.
    // Try to find the closest match or warn.
    const foundIdx = options.findIndex((o) => o.trim() === correctAnswer.trim() || o.includes(correctAnswer) || correctAnswer.includes(o));
    if (foundIdx === 0) correctOption = 'A';
    else if (foundIdx === 1) correctOption = 'B';
    else if (foundIdx === 2) correctOption = 'C';
    else if (foundIdx === 3) correctOption = 'D';
    else {
        console.warn(`Question ${key} correct answer not found in options: ${correctAnswer}`);
        errorCount++;
        continue;
    }
  }
  
  out += `  {
    subjectSlug: "history",
    difficulty: "medium",
    cognitiveLevel: "application",
    questionText: ${JSON.stringify(questionText)},
    a: ${JSON.stringify(options[0])},
    b: ${JSON.stringify(options[1])},
    c: ${JSON.stringify(options[2])},
    d: ${JSON.stringify(options[3])},
    correct: "${correctOption}",
    explanation: "No explanation provided.",
    sourceId: "history-json",
    verificationStatus: "verified",
    hintSeed: "Review history materials.",
  },\n`;
}

out += `];\n`;

fs.writeFileSync('src/data/seed/history-seeds.ts', out);
console.log(`Done. Errors: ${errorCount}`);
