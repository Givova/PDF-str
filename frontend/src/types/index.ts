// Типы категорий транспортных средств для регистрационных знаков
export type VehicleCategory = "standard" | "trailer" | "tractor" | "motorcycle"

// Типы для структуры регистрационного знака
export interface LicensePlateData {
	category: VehicleCategory
	// Для стандартных автомобилей (L NNN LL | RR(R))
	letter1?: string // Первая буква
	digits?: string // Три цифры
	letters?: string // Две буквы
	region?: string // Код региона (2-3 цифры)

	// Для прицепов (LL NNNN | RR(R))
	trailerLetters?: string // Две буквы
	trailerDigits?: string // Четыре цифры

	// Для тракторов и мотоциклов (верх NNNN, низ LL RR(R))
	topDigits?: string // Четыре цифры (верхняя строка)
	bottomLetters?: string // Две буквы (нижняя строка)
	bottomRegion?: string // Код региона (нижняя строка)
}

// Типы для данных полиса
export interface PolicyData {
	fio: string
	address: string
	date_start: string
	date_end: string
	reg_number: string
	license_plate?: LicensePlateData // Новая структурированная информация о номере
	vehicle_type: string
	vehicle_category?: VehicleCategory // Категория для определения формата номера
	brand_model: string
}

// Типы для API ответов
export interface ApiResponse<T = any> {
	data?: T
	error?: string
	message?: string
}

// Типы для валидации
export interface ValidationResult {
	valid: boolean
	error?: string
}

// Типы для состояния формы
export interface FormState {
	data: PolicyData
	loading: boolean
	errors: Partial<Record<keyof PolicyData, string>>
}

// Типы для обработки файлов
export interface DownloadResponse {
	blob: Blob
	filename: string
}
