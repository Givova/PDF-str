import { Injectable } from "@nestjs/common"

@Injectable()
export class UtilsService {
	validateDate(date: string): boolean {
		const match = /^\d{2}\.\d{2}\.\d{4}$/.test(date)
		if (!match) return false
		const [d, m, y] = date.split(".").map(Number)
		const dt = new Date(y, m - 1, d)
		return (
			dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
		)
	}

	transliterateCyrillic(text: string): string {
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
			э: "E",
			ю: "IU",
			я: "IA",
		}
		return text
			.split("")
			.map((c) => map[c] ?? c)
			.join("")
	}

	transliterateLicensePlate(text: string): string {
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

	toUpper(text: string): string {
		return (text || "").toUpperCase()
	}

	transliteratePayload(body: any) {
		if (!body) throw new Error("Данные не переданы")
		const result: any = {}
		if ("fio" in body) {
			const t = this.transliterateCyrillic(body.fio)
			result.fio = this.toUpper(t)
			result.fio_transliterated = t
		}
		if ("address" in body) {
			const t = this.transliterateCyrillic(body.address)
			result.address = this.toUpper(t)
			result.address_transliterated = t
		}
		if ("reg_number" in body) {
			const t = this.transliterateLicensePlate(body.reg_number)
			result.reg_number = t
			result.reg_number_transliterated = t
		}
		if ("text" in body) {
			const t = this.transliterateCyrillic(body.text)
			result.text = this.toUpper(t)
			result.text_transliterated = t
		}
		return result
	}

	convertUppercase(body: any) {
		if (!body) throw new Error("Данные не переданы")
		const result: any = {}
		if ("fio" in body) result.fio = this.toUpper(body.fio)
		if ("address" in body) result.address = this.toUpper(body.address)
		if ("text" in body) result.text = this.toUpper(body.text)
		return result
	}

	validatePlate(plate: any) {
		// Упрощенная серверная валидация для согласованности с фронтом
		const errors: string[] = []
		if (!plate || !plate.category) errors.push("Не указана категория")
		const regionValid = (r?: string) =>
			!!r && /^\d{2,3}$/.test(r) && !/^0+$/.test(r)
		switch (plate?.category) {
			case "standard":
				if (!plate.letter1 || !/^[АВЕКМНОРСТУХ]$/.test(plate.letter1))
					errors.push("Некорректная первая буква")
				if (!plate.digits || !/^\d{3}$/.test(plate.digits))
					errors.push("Некорректные цифры")
				if (!plate.letters || !/^[АВЕКМНОРСТУХ]{2}$/.test(plate.letters))
					errors.push("Некорректные буквы")
				if (!regionValid(plate.region)) errors.push("Некорректный регион")
				break
			case "trailer":
				if (
					!plate.trailerLetters ||
					!/^[АВЕКМНОРСТУХ]{2}$/.test(plate.trailerLetters)
				)
					errors.push("Некорректные буквы прицепа")
				if (!plate.trailerDigits || !/^\d{4}$/.test(plate.trailerDigits))
					errors.push("Некорректные цифры прицепа")
				if (!regionValid(plate.region)) errors.push("Некорректный регион")
				break
			case "tractor":
			case "motorcycle":
				if (!plate.topDigits || !/^\d{4}$/.test(plate.topDigits))
					errors.push("Некорректные верхние цифры")
				if (
					!plate.bottomLetters ||
					!/^[АВЕКМНОРСТУХ]{2}$/.test(plate.bottomLetters)
				)
					errors.push("Некорректные нижние буквы")
				if (!regionValid(plate.bottomRegion)) errors.push("Некорректный регион")
				break
		}
		return { isValid: errors.length === 0, errors }
	}
}
