import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();

    await prisma.task.findFirst({
        where: {
            name: 'A test task',
        },
    });

    await prisma.$disconnect();
}

main().catch((e) => {
    throw e;
});