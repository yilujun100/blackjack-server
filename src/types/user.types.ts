import { User as IUser, AuthAccount, Asset, Setting } from '@prisma/client';

export interface User {
  user: IUser;
  authAccount: AuthAccount;
  asset: Asset;
  setting: Setting;
}
