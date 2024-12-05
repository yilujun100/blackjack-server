import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 开启全局管道，让所有接口都受到转换和验证管道的保护，不会收到错误的数据
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动剔除非装饰器定义
      forbidNonWhitelisted: true, // 当请求中存在非白名单属性时抛出错误
      transform: true, // 自动转换为 DTO 类的实例
      disableErrorMessages: process.env.ENV === 'production', // 可以根据生产环境需要关闭错误信息
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('Blackjack')
    .setDescription('Blackjack API')
    .setVersion('1.0')
    .addTag('blackjack')
    .addSecurity('tma', {
      type: 'apiKey',
      in: 'header',
      name: 'authorization',
      description: 'The TMA token',
    })
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
