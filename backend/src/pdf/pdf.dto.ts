import {
	IsIn,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Length,
	Matches,
	MaxLength,
	Min,
	Max,
} from "class-validator"

export class GeneratePdfDto {
	@IsString()
	@MaxLength(200)
	@Matches(/^[а-яёА-ЯЁ0-9\s.,\-\/№]*$/u)
	fio!: string

	@IsString()
	@MaxLength(300)
	@Matches(/^[а-яёА-ЯЁ0-9\s.,\-\/№]*$/u)
	address!: string

	@IsString()
	@Matches(/^\d{2}\.\d{2}\.\d{4}$/)
	date_start!: string

	@IsString()
	@Matches(/^\d{2}\.\d{2}\.\d{4}$/)
	date_end!: string

	@IsString()
	@MaxLength(20)
	reg_number!: string

	@IsString()
	@IsIn(["A", "B", "C", "D", "E", "F1", "F2", "G"])
	vehicle_type!: string

	@IsString()
	@MaxLength(120)
	brand_model!: string

	// Дополнительные поля из фронтенда, допустимы, но не используются напрямую
	@IsOptional()
	license_plate?: any

	@IsOptional()
	vehicle_category?: string

	@IsOptional()
	@IsNumber()
	@Min(6)
	@Max(16)
	font_size?: number
}
