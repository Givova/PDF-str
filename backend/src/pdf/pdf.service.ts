import { Injectable } from "@nestjs/common"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import * as fs from "fs"
import * as path from "path"
import { GeneratePdfDto } from "./pdf.dto"

@Injectable()
export class PdfService {
	private readonly templatePath = path.resolve(
		process.cwd(),
		"..",
		"data",
		"Shablon.pdf"
	)

	private toUpper(text: string): string {
		return (text || "").toUpperCase()
	}

	private transliterate(text: string): string {
		if (!text) return text
		const map: Record<string, string> = {
			А: "A",
			Б: "B",
			В: "V",
			Г: "G",
			Д: "D",
			Е: "E",
			Ё: "E",
			Ж: "ZH",
			З: "Z",
			И: "I",
			Й: "Y",
			К: "K",
			Л: "L",
			М: "M",
			Н: "N",
			О: "O",
			П: "P",
			Р: "R",
			С: "S",
			Т: "T",
			У: "U",
			Ф: "F",
			Х: "KH",
			Ц: "TS",
			Ч: "CH",
			Ш: "SH",
			Щ: "SHCH",
			Ы: "Y",
			Ъ: "IE",
			Ь: "",
			Э: "E",
			Ю: "IU",
			Я: "IA",
			а: "A",
			б: "B",
			в: "V",
			г: "G",
			д: "D",
			е: "E",
			ё: "E",
			ж: "ZH",
			з: "Z",
			и: "I",
			й: "Y",
			к: "K",
			л: "L",
			м: "M",
			н: "N",
			о: "O",
			п: "P",
			р: "R",
			с: "S",
			т: "T",
			у: "U",
			ф: "F",
			х: "KH",
			ц: "TS",
			ч: "CH",
			ш: "SH",
			щ: "SHCH",
			ы: "Y",
			ъ: "IE",
			ь: "",
			э: "E",
			ю: "IU",
			я: "IA",
			"№": "No",
		}
		return text
			.split("")
			.map((c) => map[c] ?? c)
			.join("")
	}

	private transliteratePlate(text: string): string {
		if (!text) return text
		const map: Record<string, string> = {
			А: "A",
			В: "B",
			Е: "E",
			К: "K",
			М: "M",
			Н: "H",
			О: "O",
			Р: "P",
			С: "C",
			Т: "T",
			У: "Y",
			Х: "X",
			а: "A",
			в: "B",
			е: "E",
			к: "K",
			м: "M",
			н: "H",
			о: "O",
			р: "P",
			с: "C",
			т: "T",
			у: "Y",
			х: "X",
		}
		return text
			.split("")
			.map((c) => map[c] ?? c)
			.join("")
	}

	private formatRegionNumber(reg: string): string {
		const main = reg.slice(0, -2)
		const region = reg.slice(-2)

		return main + region
	}

	async generate(
		data: GeneratePdfDto
	): Promise<{ buffer: Buffer; filename: string }> {
		// Загрузка шаблона
		if (!fs.existsSync(this.templatePath)) {
			throw new Error("Шаблон PDF не найден")
		}
		const templateBytes = fs.readFileSync(this.templatePath)
		const pdfDoc = await PDFDocument.load(templateBytes)
		const page = pdfDoc.getPages()[0]

		// Используем Times Roman шрифт (аналог Times New Roman)
		const font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
		const fontSize = data.font_size || 8

		// Транслитерации - ВСЕ кириллические символы должны быть заменены
		const fioUpper = this.toUpper(this.transliterate(data.fio))
		const addressUpper = this.toUpper(this.transliterate(data.address))
		const plate = this.formatRegionNumber(
			this.transliteratePlate(data.reg_number)
		)
		const brandModelUpper = this.toUpper(this.transliterate(data.brand_model))

		// Координаты как в Python-реализации
		const startX = 45
		const startYFio = 340
		const startYAddress = startYFio - 8

		const dayStart = data.date_start.slice(0, 2)
		const monthStart = data.date_start.slice(3, 5)
		const yearStart = data.date_start.slice(6, 10)
		const dayEnd = data.date_end.slice(0, 2)
		const monthEnd = data.date_end.slice(3, 5)
		const yearEnd = data.date_end.slice(6, 10)

		const drawText = (text: string, x: number, y: number) => {
			page.drawText(text, { x, y, size: fontSize, font, color: rgb(0, 0, 0) })
		}

		const drawCentered = (
			text: string,
			start: number,
			end: number,
			y: number
		) => {
			const width = font.widthOfTextAtSize(text, fontSize)
			const centerX = start + (end - start - width) / 2
			drawText(text, centerX, y)
		}

		// Вставка текстов - ВСЕ тексты транслитерированы
		drawText(fioUpper, startX, startYFio)
		drawText(addressUpper, startX, startYAddress)

		// Даты (как отдельные компоненты)
		drawText(dayStart, 56, 615)
		drawText(monthStart, 100, 615)
		drawText(yearStart, 141, 615)
		drawText(dayEnd, 189, 615)
		drawText(monthEnd, 234, 615)
		drawText(yearEnd, 273, 615)

		// Авто данные
		drawText(plate, 150, 535)
		drawText(data.vehicle_type, 355, 535)
		drawCentered(brandModelUpper, 430, 540, 535)

		const pdfBytes = await pdfDoc.save()
		const filename = `policy_${new Date()
			.toISOString()
			.replace(/[-:T]/g, "")
			.slice(0, 15)}.pdf`
		return { buffer: Buffer.from(pdfBytes), filename }
	}
}
