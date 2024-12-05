import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmptyObject, IsNumber, IsString } from 'class-validator';

class PlayerData {
  @ApiProperty()
  @IsString()
  id: string;
  @ApiProperty()
  @IsNumber()
  amount: number;
}

enum PlayerActionType {
  BET = 'bet',
  HIT = 'hit',
  STAND = 'stand',
  INSURANCE = 'insurance',
  DOUBLE = 'double',
  SPLIT = 'split',
  SURRENDER = 'surrender',
}

export class PlayerActionDto {
  @ApiProperty({
    description: '玩家操作类型',
    example: PlayerActionType.BET,
    enum: PlayerActionType,
  })
  @IsEnum(PlayerActionType)
  type: PlayerActionType;
  @ApiProperty({
    description: '玩家相关信息',
  })
  @IsNotEmptyObject()
  data: PlayerData;
}
