import { PrismaClient } from '@prisma/client';

async function createCasion() {
  const prisma = new PrismaClient();
  await prisma.casino.createMany({
    data: [
      { name: '拉斯维加斯新手场', level: 1, minBet: 1, maxBet: 500 },
      { name: '蒙特卡洛初级场', level: 2, minBet: 100, maxBet: 1500 },
      { name: '英伦俱乐部', level: 3, minBet: 500, maxBet: 2500 },
      { name: '威尼斯高级场', level: 4, minBet: 1000, maxBet: 5000 },
      { name: '澳门特快', level: 5, minBet: 2000, maxBet: 7500 },
      { name: '巴黎皇家场', level: 6, minBet: 3000, maxBet: 10000 },
      { name: '太阳城贵宾场', level: 7, minBet: 5000, maxBet: 15000 },
      { name: '纽约夜未眠', level: 8, minBet: 7500, maxBet: 20000 },
      { name: '东京极速场', level: 9, minBet: 10000, maxBet: 30000 },
      { name: '蒙特卡洛皇家场', level: 10, minBet: 15000, maxBet: 500000 },
    ],
  });
}

createCasion();
