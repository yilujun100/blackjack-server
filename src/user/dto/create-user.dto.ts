import { ApiProperty } from '@nestjs/swagger';
import { 
    IsBoolean,
    IsEnum,
    IsNotEmptyObject,
    IsNumber,
    IsString,
} from 'class-validator';

class TelegramData {
    @ApiProperty({
        description: 'Telegram user id',
        example: 1234567890,
    })
    @IsNumber()
    'id': number;
    @ApiProperty()
    @IsString()
    'first_name': string;
    @ApiProperty()
    @IsString()
    'last_name': string;
    @ApiProperty()
    @IsString()
    'username': string;
    @ApiProperty()
    @IsString()
    'language_code': string;
    @ApiProperty()
    @IsBoolean()
    'is_premium': boolean;
    @ApiProperty()
    @IsBoolean()
    'allows_write_to_pm': boolean;
    @ApiProperty()
    @IsString()
    'hash': string;
    @ApiProperty()
    @IsNumber()
    auth_data: number;
    @ApiProperty()
    @IsString()
    'start_param': string;
    @ApiProperty()
    @IsString()
    'chat_type': string;
    @ApiProperty()
    @IsString()
    'chat_instance': string;
}

export class CreateUserDto {
    @ApiProperty({
        description: '第三方平台类型, 目前只支持 telegram',
        example: 'telegram',
        enum: ['telegram'],
    })
    @IsEnum(['telegram'])
    type: 'telegram';
    @ApiProperty({
        description: '第三方平台数据',
        type: () => TelegramData,
    })
    @IsNotEmptyObject()
    data: TelegramData;
}
