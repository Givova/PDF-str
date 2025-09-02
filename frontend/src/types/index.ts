// Типы для данных полиса
export interface PolicyData {
	fio: string
	address: string
	date_start: string
	date_end: string
	reg_number: string
	vehicle_type: string
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
