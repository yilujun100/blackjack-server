import { Injectable, HttpException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { v4 } from 'uuid';
import { parse, validate } from '@telegram-apps/init-data-node';
import { User } from 'src/types/user.types';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  validateInitData(initData: any) {
    return true;
    /* try {
      validate(
        parse(initData),
        'bot token',
        {
          expiresIn: 60 * 60 * 24,
        },
      );
    } catch (e) {
      throw new HttpException('Invalid parameters', 400);
    } */
  }

  async create(createUserDto: CreateUserDto) {
    if (createUserDto.type === 'telegram') {
      return await this.createWithTelegram(createUserDto);
    }
    throw new HttpException('Invalid parameters', 400);
  }

  async createWithTelegram(createUserDto: CreateUserDto) {
    /* try {
      validate(
        parse(createUserDto.data),
        'bot token',
        {
          expiresIn: 60 * 60 * 24,
        },
      )
    } catch (e) {
      throw new HttpException('Invalid parameters', 400);
    } */
    const userId = v4();
    const [user, authAccount, asset, setting] = await this.prismaService.$transaction(async (prisma) => {
      return await Promise.all([
        prisma.user.create({
          data: {
            id: userId,
            exp: 0,
            level: 1,
            image: '',
          },
        }),
        prisma.authAccount.create({
          data: {
            userId,
            type: 'telegram',
            identifier: createUserDto.data.id.toString(),
            extraData: JSON.stringify(createUserDto),
          },
        }),
        this.prismaService.asset.create({
          data: {
            userId,
            type: 'jack',
            amount: 0,
          },
        }),
        this.prismaService.setting.create({
          data: {
            userId,
            language: 'en',
          },
        }),
      ]);
    });

    return {
      user,
      authAccount,
      asset,
      setting,
    };
  }

  findAll() {
    return this.prismaService.user.findMany();
  }

  async findOne(initData: string) {
    const parsedInitData = parse(initData);
    this.validateInitData(initData);
    
    const authAccount = await this.prismaService.authAccount.findUnique({
      where: {
        type_identifier: {
          type: 'telegram',
          identifier: parsedInitData.user.id.toString(),
        },
      },
    });

    if (!authAccount) {
      throw new HttpException('Unauthorized', 401);
    }

    const [user, asset, setting] = await Promise.all([
      this.prismaService.user.findUnique({
        where: {
          id: authAccount.userId,
        },
      }),
      this.prismaService.asset.findUnique({
        where: {
          userId_type: {
            userId: authAccount.userId,
            type: 'jack',
          },
        },
      }),
      this.prismaService.setting.findUnique({
        where: {
          userId: authAccount.userId,
        },
      }),
    ]);
    return {
      user,
      authAccount,
      asset,
      setting,
    };
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.prismaService.user.update({
      where: {
        id,
      },
      data: updateUserDto,
    });
  }

  remove(id: string) {
    return this.prismaService.user.delete({
      where: {
        id,
      },
    });
  }

  async updateSetting(user: User, updateSettingDto: UpdateSettingDto) {
    return await this.prismaService.setting.update({
      where: {
        id: user.setting.id,
      },
      data: updateSettingDto,
    });
  }
}
