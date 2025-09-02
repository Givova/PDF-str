import axios, { AxiosResponse } from "axios"
import {
	PolicyData,
	ApiResponse,
	ValidationResult,
	DownloadResponse,
} from "../types"

// Базовый URL для API
const API_BASE_URL =
	process.env.REACT_APP_API_URL || "http://localhost:5000/api"

// Создаем экземпляр axios
const api = axios.create({
	baseURL: API_BASE_URL,
	timeout: 30000, // 30 секунд таймаут для генерации PDF
})

// Сервис для работы с API
export class PdfGeneratorApi {
	/**
	 * Генерация PDF с данными полиса
	 */
	static async generatePdf(data: PolicyData): Promise<DownloadResponse> {
		try {
			const response: AxiosResponse<Blob> = await api.post(
				"/generate-pdf",
				data,
				{
					responseType: "blob", // Важно для получения файла
				}
			)

			// Извлекаем имя файла из заголовков ответа
			const contentDisposition = response.headers["content-disposition"]
			let filename = "policy.pdf"

			if (contentDisposition) {
				const filenameMatch = contentDisposition.match(/filename="(.+)"/)
				if (filenameMatch) {
					filename = filenameMatch[1]
				}
			}

			return {
				blob: response.data,
				filename: filename,
			}
		} catch (error: any) {
			if (error.response?.data) {
				// Если ошибка содержит JSON, пытаемся ее прочитать
				const errorText = await error.response.data.text()
				try {
					const errorData = JSON.parse(errorText)
					throw new Error(errorData.error || "Ошибка при генерации PDF")
				} catch {
					throw new Error("Ошибка при генерации PDF")
				}
			}
			throw new Error(error.message || "Ошибка при генерации PDF")
		}
	}

	/**
	 * Валидация даты
	 */
	static async validateDate(date: string): Promise<ValidationResult> {
		try {
			const response: AxiosResponse<ValidationResult> = await api.post(
				"/validate-date",
				{
					date: date,
				}
			)
			return response.data
		} catch (error: any) {
			return {
				valid: false,
				error: error.response?.data?.error || "Ошибка валидации даты",
			}
		}
	}

	/**
	 * Проверка работоспособности API
	 */
	static async healthCheck(): Promise<ApiResponse> {
		try {
			const response: AxiosResponse<ApiResponse> = await api.get("/health")
			return response.data
		} catch (error: any) {
			return {
				error: error.message || "API недоступен",
			}
		}
	}
}

/**
 * Утилита для скачивания файла
 */
export const downloadFile = (blob: Blob, filename: string): void => {
	const url = window.URL.createObjectURL(blob)
	const link = document.createElement("a")
	link.href = url
	link.download = filename
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	window.URL.revokeObjectURL(url)
}

