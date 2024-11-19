import { ApiProperty} from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateSettingDto {
    @ApiProperty()
    @IsEnum(['zh', 'en'])
    language?: 'zh' | 'en';
    @ApiProperty()
    @IsOptional()
    sound?: boolean;
    @ApiProperty()
    @IsOptional()
    notify?: boolean;
}