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

export class PlayerActionDto {
  @ApiProperty({
    description: '玩家操作类型',
    example: 'bet',
    enum: ['bet', 'hit', 'stand', 'insurance', 'double', 'split', 'surrender'],
  })
  @IsEnum(['bet', 'hit', 'stand', 'insurance', 'double', 'split', 'surrender'])
  type: 'bet';
  @ApiProperty({
    description: '玩家相关信息',
  })
  @IsNotEmptyObject()
  data: PlayerData;
}
