import { ApiProperty} from '@nestjs/swagger';
import { User as IUser, AuthAccount, Asset, Setting } from '@prisma/client';

export class User {
    @ApiProperty()
    user: IUser;
    @ApiProperty()
    authAccount: AuthAccount;
    @ApiProperty()
    asset: Asset;
    @ApiProperty()
    setting: Setting;
}
