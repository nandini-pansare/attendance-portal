import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AttendanceModule } from './attendance/attendance.module';
import { LeaveModule } from './leave/leave.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { OtpModule } from './otp/otp.module';
import { EmailModule } from './email/email.module';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './firebase/firebase.module';


@Module({
  imports: [  
    ConfigModule.forRoot({
      isGlobal: true,
    }),  
    SequelizeModule.forRoot({
      dialect: 'postgres', 
      host: 'localhost',
      port: 5432, 
      username: 'postgres',
      password: 'root',
      database: 'attendance_portal_db',
      autoLoadModels: true,
      synchronize: true,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET, 
      signOptions: { expiresIn: '1h' },
    }),  
    
    AuthModule, UsersModule, AttendanceModule, LeaveModule, OtpModule, EmailModule, FirebaseModule],
  controllers: [AppController],
  providers: [AppService],
  exports: [JwtModule],
})
export class AppModule {}
