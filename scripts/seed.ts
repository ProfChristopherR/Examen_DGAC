import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding questions...');
  
  const questionsPath = path.join(__dirname, '../data/questions.json');
  const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
  
  for (const q of questionsData) {
    await prisma.question.upsert({
      where: { number: q.number },
      update: {
        questionText: q.question,
        optionA: q.options?.a ?? '',
        optionB: q.options?.b ?? '',
        optionC: q.options?.c ?? '',
        optionD: q.options?.d ?? '',
        correctAnswer: q.correctAnswer ?? 'a',
      },
      create: {
        number: q.number,
        questionText: q.question,
        optionA: q.options?.a ?? '',
        optionB: q.options?.b ?? '',
        optionC: q.options?.c ?? '',
        optionD: q.options?.d ?? '',
        correctAnswer: q.correctAnswer ?? 'a',
      },
    });
  }
  
  console.log(`Seeded ${questionsData.length} questions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
