import fs from 'fs';

const data = JSON.parse(fs.readFileSync('demography.json', 'utf8'));

let out = `import type { QuestionSeed } from "@/data/seed/questions";\n\n`;
out += `export const DEMOGRAPHY_SEEDS: QuestionSeed[] = [\n`;

let errorCount = 0;

for (const item of data) {
  const key = item.id || '';
  
  const numMatch = key.match(/\d+/);
  const num = numMatch ? numMatch[0] : '';
  
  const questionText = `${num}. ${item.question}`;
  
  const options = item.options;
  if (!options || options.length !== 4) {
    console.warn(`Question ${key} does not have exactly 4 options.`);
    errorCount++;
    continue;
  }
  
  const correctAnswer = item.correct_answer;
  let correctOption = '';
  if (correctAnswer === options[0]) correctOption = 'A';
  else if (correctAnswer === options[1]) correctOption = 'B';
  else if (correctAnswer === options[2]) correctOption = 'C';
  else if (correctAnswer === options[3]) correctOption = 'D';
  else {
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
    subjectSlug: "demography",
    difficulty: "medium",
    cognitiveLevel: "application",
    questionText: ${JSON.stringify(questionText)},
    a: ${JSON.stringify(options[0])},
    b: ${JSON.stringify(options[1])},
    c: ${JSON.stringify(options[2])},
    d: ${JSON.stringify(options[3])},
    correct: "${correctOption}",
    explanation: "No explanation provided.",
    sourceId: "demography-json",
    verificationStatus: "verified",
    hintSeed: "Review demography materials.",
  },\n`;
}

out += `];\n`;

fs.writeFileSync('src/data/seed/demography-seeds.ts', out);
console.log(`Done. Errors: ${errorCount}`);
