import { HttpException, Injectable } from '@nestjs/common';
import { Task, TaskRecord } from '@prisma/client';
import * as dayjs from 'dayjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'src/types/user.types';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  // 获取用户所有任务，并包括任务状态
  async findAll(user: User): Promise<(Task & { status: string })[]> {
    // 首先获取所有任务
    const tasks = await this.prisma.task.findMany();

    // 为每个任务查询对应的任务记录
    const tasksWithStatus = await Promise.all(
      tasks.map(async (task) => {
        const record = await this.prisma.taskRecord.findFirst({
          where: {
            userId: user.user.id,
            taskId: task.id,
          },
        });

        return {
          ...task,
          status:
            record && task.type === 'daily'
              ? dayjs(record.createdAt).isSame(dayjs(), 'day')
                ? 'checked'
                : 'unchecked'
              : record
                ? record.status
                : 'unchecked',
        };
      }),
    );

    return tasksWithStatus;
  }

  // 检查任务
  async check(user: User, id: string): Promise<TaskRecord> {
    const [record, task] = await Promise.all([
      this.prisma.taskRecord.findFirst({
        where: {
          userId: user.user.id,
          taskId: id,
        },
      }),
      this.prisma.task.findUnique({
        where: {
          id,
        },
      }),
    ]);

    // 获取当前日期，仅年月日
    const today = dayjs().startOf('day');

    if (!record) {
      // 如果没有记录，创建一条新的记录
      return await this.prisma.taskRecord.create({
        data: {
          userId: user.user.id,
          taskId: id,
          status: 'checked', // 设置任务状态为已检查
        },
      });
    } else {
      if (record.status === 'completed' || record.status === 'checked') {
        throw new HttpException('Task has already been checked.', 400);
      }
      // 如果已存在，检查任务是否可以重新完成
      if (task.type === 'daily') {
        // 对于每日任务，检查上次完成时间是否是今天之前
        const lastChecked = dayjs(record.createdAt).startOf('day').toDate();

        if (dayjs(lastChecked).isBefore(today, 'day')) {
          // 如果上次检查是在今天之前，允许重新签到
          return await this.prisma.taskRecord.create({
            data: {
              userId: user.user.id,
              taskId: id,
              status: 'checked',
            },
          });
        } else {
          throw new Error('Daily task has already been checked today.');
        }
      } else if (task.type === 'collab') {
        // 对于一次性任务，检查是否已完成
        if (record.status === 'completed') {
          throw new Error('Collab task has already been completed.');
        }

        // 如果尚未完成，则更新为已检查
        return await this.prisma.taskRecord.update({
          where: {
            id: record.id,
          },
          data: {
            status: 'checked',
          },
        });
      }
    }
  }

  // 完成任务
  async complete(user: User, id: string): Promise<TaskRecord> {
    const task = await this.prisma.task.findUnique({
      where: {
        id,
      },
    });

    if (!task) {
      throw new HttpException('Task not found.', 404);
    }
    let record: TaskRecord | null = null;
    if (task.type === 'daily') {
      record = await this.prisma.taskRecord.findFirst({
        where: {
          userId: user.user.id,
          taskId: id,
          createdAt: {
            gte: dayjs().startOf('day').toDate(),
          },
        },
      });
      if (!record) {
        throw new HttpException('Task not checked.', 400);
      }
    } else {
      record = await this.prisma.taskRecord.findFirst({
        where: {
          userId: user.user.id,
          taskId: id,
          status: 'checked',
        },
      });
      if (!record) {
        throw new HttpException('Task not checked.', 400);
      }
    }
    const [taskRecord] = await this.prisma.$transaction(async (prisma) => {
      return await Promise.all([
        prisma.taskRecord.update({
          where: {
            id: record.id,
          },
          data: {
            status: 'completed',
          },
        }),
        // TODO: 增加用户资产
      ]);
    });

    return taskRecord;
  }

  create(createTaskDto: CreateTaskDto) {
    return 'This action adds a new task';
  }

  findOne(id: number) {
    return `This action returns a #${id} task`;
  }

  update(id: number, updateTaskDto: UpdateTaskDto) {
    return `This action updates a #${id} task`;
  }

  remove(id: number) {
    return `This action removes a #${id} task`;
  }
}
