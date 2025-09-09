import {
	Body,
	Controller,
	Get,
	HttpException,
	HttpStatus,
	Post,
} from "@nestjs/common"
import { UtilsService } from "./utils.service"

@Controller()
export class UtilsController {
	constructor(private readonly utils: UtilsService) {}

	@Get("health")
	health() {
		return { status: "OK", message: "PDF Generator API работает" }
	}

	@Post("validate-date")
	validateDate(@Body("date") date?: string) {
		if (!date) return { valid: false, error: "Дата не указана" }
		return { valid: this.utils.validateDate(date) }
	}

	@Post("transliterate")
	transliterate(@Body() body: any) {
		try {
			return this.utils.transliteratePayload(body)
		} catch (e: any) {
			throw new HttpException(
				{ error: e?.message || "Ошибка при транслитерации" },
				HttpStatus.INTERNAL_SERVER_ERROR
			)
		}
	}

	@Post("convert-uppercase")
	convertUppercase(@Body() body: any) {
		try {
			return this.utils.convertUppercase(body)
		} catch (e: any) {
			throw new HttpException(
				{ error: e?.message || "Ошибка при преобразовании" },
				HttpStatus.INTERNAL_SERVER_ERROR
			)
		}
	}

	@Post("validate-license-plate")
	validatePlate(@Body("license_plate") plate: any) {
		const result = this.utils.validatePlate(plate)
		return { valid: result.isValid, error: result.errors?.join("; ") }
	}
}
