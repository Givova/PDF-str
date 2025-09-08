import { LicensePlateData, VehicleCategory } from "../types"

// Разрешенные кириллические буквы согласно ГОСТ Р 50577-2018
export const ALLOWED_LETTERS = "АВЕКМНОРСТУХ"

// Интерфейс для результата валидации
export interface ValidationResult {
	isValid: boolean
	errors: string[]
	warnings?: string[]
}

/**
 * Валидация регистрационного знака согласно ГОСТ Р 50577-2018
 */
export class LicensePlateValidator {
	/**
	 * Основная функция валидации
	 */
	static validate(data: LicensePlateData): ValidationResult {
		const errors: string[] = []
		const warnings: string[] = []

		switch (data.category) {
			case "standard":
				return this.validateStandard(data)
			case "trailer":
				return this.validateTrailer(data)
			case "tractor":
				return this.validateTractor(data)
			case "motorcycle":
				return this.validateMotorcycle(data)
			default:
				errors.push("Неизвестная категория транспортного средства")
				return { isValid: false, errors, warnings }
		}
	}

	/**
	 * Валидация для стандартных автомобилей (L NNN LL | RR(R))
	 * Формат: А123ВС 77
	 */
	private static validateStandard(data: LicensePlateData): ValidationResult {
		const errors: string[] = []
		const warnings: string[] = []

		// Проверяем наличие всех обязательных полей
		if (!data.letter1) {
			errors.push("Не указана первая буква номера")
		} else if (data.letter1.length !== 1) {
			errors.push("Первая буква должна содержать ровно один символ")
		} else if (!ALLOWED_LETTERS.includes(data.letter1)) {
			errors.push(
				`Первая буква "${data.letter1}" не разрешена. Используйте: ${ALLOWED_LETTERS}`
			)
		}

		if (!data.digits) {
			errors.push("Не указаны цифры номера")
		} else if (data.digits.length !== 3) {
			errors.push("Цифровая часть должна содержать ровно 3 цифры")
		} else if (!/^\d{3}$/.test(data.digits)) {
			errors.push("Цифровая часть должна содержать только цифры")
		}

		if (!data.letters) {
			errors.push("Не указаны буквы номера")
		} else if (data.letters.length !== 2) {
			errors.push("Буквенная часть должна содержать ровно 2 буквы")
		} else {
			for (const letter of data.letters) {
				if (!ALLOWED_LETTERS.includes(letter)) {
					errors.push(
						`Буква "${letter}" не разрешена. Используйте: ${ALLOWED_LETTERS}`
					)
					break
				}
			}
		}

		if (!data.region) {
			errors.push("Не указан код региона")
		} else if (data.region.length < 2 || data.region.length > 3) {
			errors.push("Код региона должен содержать 2 или 3 цифры")
		} else if (!/^\d{2,3}$/.test(data.region)) {
			errors.push("Код региона должен содержать только цифры")
		} else if (data.region === "00" || data.region === "000") {
			errors.push("Код региона не может состоять только из нулей")
		} else {
			// Проверяем валидность кода региона (базовая проверка)
			const regionCode = parseInt(data.region)
			if (regionCode > 999) {
				errors.push("Код региона не может быть больше 999")
			}
			if (regionCode < 1) {
				errors.push("Код региона должен быть больше 0")
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		}
	}

	/**
	 * Валидация для прицепов (LL NNNN | RR(R))
	 * Формат: ММ9768 77
	 */
	private static validateTrailer(data: LicensePlateData): ValidationResult {
		const errors: string[] = []
		const warnings: string[] = []

		// Проверяем наличие всех обязательных полей
		if (!data.trailerLetters) {
			errors.push("Не указаны буквы номера прицепа")
		} else if (data.trailerLetters.length !== 2) {
			errors.push("Буквенная часть должна содержать ровно 2 буквы")
		} else {
			for (const letter of data.trailerLetters) {
				if (!ALLOWED_LETTERS.includes(letter)) {
					errors.push(
						`Буква "${letter}" не разрешена. Используйте: ${ALLOWED_LETTERS}`
					)
					break
				}
			}
		}

		if (!data.trailerDigits) {
			errors.push("Не указаны цифры номера прицепа")
		} else if (data.trailerDigits.length !== 4) {
			errors.push("Цифровая часть должна содержать ровно 4 цифры")
		} else if (!/^\d{4}$/.test(data.trailerDigits)) {
			errors.push("Цифровая часть должна содержать только цифры")
		}

		if (!data.region) {
			errors.push("Не указан код региона")
		} else if (data.region.length < 2 || data.region.length > 3) {
			errors.push("Код региона должен содержать 2 или 3 цифры")
		} else if (!/^\d{2,3}$/.test(data.region)) {
			errors.push("Код региона должен содержать только цифры")
		} else if (data.region === "00" || data.region === "000") {
			errors.push("Код региона не может состоять только из нулей")
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		}
	}

	/**
	 * Валидация для тракторов (верх NNNN, низ LL RR(R))
	 * Формат: 1234 АБ 77
	 */
	private static validateTractor(data: LicensePlateData): ValidationResult {
		const errors: string[] = []
		const warnings: string[] = []

		// Проверяем верхнюю строку (4 цифры)
		if (!data.topDigits) {
			errors.push("Не указаны цифры верхней строки")
		} else if (data.topDigits.length !== 4) {
			errors.push("Верхняя строка должна содержать ровно 4 цифры")
		} else if (!/^\d{4}$/.test(data.topDigits)) {
			errors.push("Верхняя строка должна содержать только цифры")
		}

		// Проверяем нижнюю строку (2 буквы)
		if (!data.bottomLetters) {
			errors.push("Не указаны буквы нижней строки")
		} else if (data.bottomLetters.length !== 2) {
			errors.push("Нижняя строка должна содержать ровно 2 буквы")
		} else {
			for (const letter of data.bottomLetters) {
				if (!ALLOWED_LETTERS.includes(letter)) {
					errors.push(
						`Буква "${letter}" не разрешена. Используйте: ${ALLOWED_LETTERS}`
					)
					break
				}
			}
		}

		// Проверяем код региона нижней строки
		if (!data.bottomRegion) {
			errors.push("Не указан код региона")
		} else if (data.bottomRegion.length < 2 || data.bottomRegion.length > 3) {
			errors.push("Код региона должен содержать 2 или 3 цифры")
		} else if (!/^\d{2,3}$/.test(data.bottomRegion)) {
			errors.push("Код региона должен содержать только цифры")
		} else if (data.bottomRegion === "00" || data.bottomRegion === "000") {
			errors.push("Код региона не может состоять только из нулей")
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		}
	}

	/**
	 * Валидация для мотоциклов (верх NNNN, низ LL RR(R))
	 * Формат: 5678 ВГ 77
	 */
	private static validateMotorcycle(data: LicensePlateData): ValidationResult {
		// Для мотоциклов используется та же валидация, что и для тракторов
		return this.validateTractor(data)
	}

	/**
	 * Генерация текстового представления номера
	 */
	static generatePlateText(data: LicensePlateData): string {
		switch (data.category) {
			case "standard":
				if (data.letter1 && data.digits && data.letters && data.region) {
					return `${data.letter1}${data.digits}${data.letters}${data.region}`
				}
				break
			case "trailer":
				if (data.trailerLetters && data.trailerDigits && data.region) {
					return `${data.trailerLetters}${data.trailerDigits}${data.region}`
				}
				break
			case "tractor":
			case "motorcycle":
				if (data.topDigits && data.bottomLetters && data.bottomRegion) {
					return `${data.topDigits}${data.bottomLetters}${data.bottomRegion}`
				}
				break
		}
		return ""
	}

	/**
	 * Парсинг номера из строки
	 */
	static parseFromString(
		plateText: string,
		category: VehicleCategory
	): LicensePlateData | null {
		const cleaned = plateText.replace(/\s+/g, "").trim().toUpperCase()

		try {
			switch (category) {
				case "standard": {
					// Формат: А123ВС77
					const match = cleaned.match(
						/^([АВЕКМНОРСТУХ])(\d{3})([АВЕКМНОРСТУХ]{2})(\d{2,3})$/
					)
					if (match) {
						return {
							category: "standard",
							letter1: match[1],
							digits: match[2],
							letters: match[3],
							region: match[4],
						}
					}
					break
				}
				case "trailer": {
					// Формат: ММ976877
					const match = cleaned.match(/^([АВЕКМНОРСТУХ]{2})(\d{4})(\d{2,3})$/)
					if (match) {
						return {
							category: "trailer",
							trailerLetters: match[1],
							trailerDigits: match[2],
							region: match[3],
						}
					}
					break
				}
				case "tractor":
				case "motorcycle": {
					// Формат: 1234АБ77
					const match = cleaned.match(/^(\d{4})([АВЕКМНОРСТУХ]{2})(\d{2,3})$/)
					if (match) {
						return {
							category,
							topDigits: match[1],
							bottomLetters: match[2],
							bottomRegion: match[3],
						}
					}
					break
				}
			}
		} catch (error) {
			console.error("Error parsing license plate:", error)
		}

		return null
	}
}

/**
 * Утилитарные функции для работы с номерами
 */
export const licensePlateUtils = {
	/**
	 * Фильтрация ввода для букв
	 */
	filterLetters: (input: string): string => {
		return input
			.toUpperCase()
			.split("")
			.filter((char) => ALLOWED_LETTERS.includes(char))
			.join("")
	},

	/**
	 * Фильтрация ввода для цифр
	 */
	filterDigits: (input: string): string => {
		return input.replace(/\D/g, "")
	},

	/**
	 * Проверка валидности кода региона
	 */
	isValidRegion: (region: string): boolean => {
		if (!/^\d{2,3}$/.test(region)) return false
		const code = parseInt(region)
		return code > 0 && code <= 999
	},

	/**
	 * Форматирование номера для отображения
	 */
	formatForDisplay: (data: LicensePlateData): string => {
		return LicensePlateValidator.generatePlateText(data)
	},

	/**
	 * Получение примера номера для категории
	 */
	getExample: (category: VehicleCategory): string => {
		switch (category) {
			case "standard":
				return "А123ВС77"
			case "trailer":
				return "ММ976877"
			case "tractor":
				return "1234АБ77"
			case "motorcycle":
				return "5678ВГ77"
			default:
				return ""
		}
	},

	/**
	 * Получение описания формата для категории
	 */
	getFormatDescription: (category: VehicleCategory): string => {
		switch (category) {
			case "standard":
				return "L NNN LL | RR(R) - буква, 3 цифры, 2 буквы, код региона"
			case "trailer":
				return "LL NNNN | RR(R) - 2 буквы, 4 цифры, код региона"
			case "tractor":
				return "Верх: NNNN, Низ: LL RR(R) - 4 цифры, 2 буквы, код региона"
			case "motorcycle":
				return "Верх: NNNN, Низ: LL RR(R) - 4 цифры, 2 буквы, код региона"
			default:
				return ""
		}
	},
}
