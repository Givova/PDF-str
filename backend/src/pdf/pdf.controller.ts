import {
	Body,
	Controller,
	HttpException,
	HttpStatus,
	Post,
	Res,
} from "@nestjs/common"
import { Response } from "express"
import { PdfService } from "./pdf.service"
import { GeneratePdfDto } from "./pdf.dto"

@Controller("generate-pdf")
export class PdfController {
	constructor(private readonly pdfService: PdfService) {}

	@Post()
	async generate(@Body() body: GeneratePdfDto, @Res() res: Response) {
		try {
			const { buffer, filename } = await this.pdfService.generate(body)
			res.setHeader("Content-Type", "application/pdf")
			res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
			return res.send(buffer)
		} catch (e: any) {
			throw new HttpException(
				{ error: e?.message || "Ошибка при генерации PDF" },
				HttpStatus.INTERNAL_SERVER_ERROR
			)
		}
	}
}
