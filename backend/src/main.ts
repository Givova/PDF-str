import "reflect-metadata"
import { NestFactory } from "@nestjs/core"
import { BadRequestException, ValidationPipe } from "@nestjs/common"
import type { ValidationError } from "class-validator"
import { AppModule } from "./app.module"
import { json, urlencoded } from "express"

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	// Лимиты размера тела запроса
	app.use(json({ limit: "256kb" }))
	app.use(urlencoded({ extended: true, limit: "256kb" }))

	// Упрощенная CORS конфигурация для разработки
	app.enableCors({
		origin: true, // Разрешаем все origins для разработки
		methods: ["GET", "POST", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: false,
	})

	app.setGlobalPrefix("api")
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: false,
			transform: true,
			exceptionFactory: (errors: ValidationError[]) => {
				const messages = errors
					.flatMap((e) => Object.values(e.constraints || {}))
					.filter(Boolean)
					.map(String)
				const message =
					messages.join("; ") || "Некорректные данные. Проверьте поля формы."
				return new BadRequestException({ error: message })
			},
		})
	)

	const port = parseInt(process.env.PORT || "5000", 10)
	await app.listen(port, "0.0.0.0")
}

bootstrap()
