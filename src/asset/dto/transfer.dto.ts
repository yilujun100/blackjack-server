import { IsEnum, IsUUID } from 'class-validator';

export enum Type {
  Checkin = 'checkin',
  Task = 'task',
  Win = 'win',
}

export class TransferDto {
  fromVersion: number;
  toVersion: number;
  @IsUUID()
  from_user_id: string;
  @IsUUID()
  to_user_id: string;
  @IsEnum(['jack'])
  token: string;
  amount: number;
  @IsEnum(Type)
  type: Type;
  remark: string;
}
