import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { DentistsModule } from './modules/dentists/dentists.module';
import { CasesModule } from './modules/cases/cases.module';
import { FilesModule } from './modules/files/files.module';
import { ChatModule } from './modules/chat/chat.module';
import { PriceListsModule } from './modules/price-lists/price-lists.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { VisionImportModule } from './modules/vision-import/vision-import.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    DentistsModule,
    CasesModule,
    FilesModule,
    ChatModule,
    PriceListsModule,
    NotificationsModule,
    VisionImportModule,
  ],
})
export class AppModule {}
