import React, { useState, useCallback } from "react"
import {
	Container,
	Paper,
	Typography,
	TextField,
	Button,
	Grid,
	Alert,
	CircularProgress,
	Box,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Autocomplete,
} from "@mui/material"

import {
	Download as DownloadIcon,
	Description as PdfIcon,
} from "@mui/icons-material"
import {
	PolicyData,
	FormState,
	LicensePlateData,
	VehicleCategory,
} from "../types"
import { PdfGeneratorApi, downloadFile } from "../services/api"
import LicensePlateInput from "./LicensePlateInput"
import {
	LicensePlateValidator,
	licensePlateUtils,
} from "../utils/licensePlateValidation"

// Начальные данные формы
const initialData: PolicyData = {
	fio: "",
	address: "",
	date_start: "",
	date_end: "",
	reg_number: "",
	license_plate: { category: "standard" },
	vehicle_type: "",
	vehicle_category: "standard",
	brand_model: "",
}

// Периоды страхования
const insurancePeriods = [
	{ value: "15_days", label: "15 дней", days: 15 },
	{ value: "1_month", label: "1 месяц", months: 1 },
	{ value: "2_months", label: "2 месяца", months: 2 },
	{ value: "3_months", label: "3 месяца", months: 3 },
	{ value: "4_months", label: "4 месяца", months: 4 },
	{ value: "5_months", label: "5 месяцев", months: 5 },
	{ value: "6_months", label: "6 месяцев", months: 6 },
	{ value: "7_months", label: "7 месяцев", months: 7 },
	{ value: "8_months", label: "8 месяцев", months: 8 },
	{ value: "9_months", label: "9 месяцев", months: 9 },
	{ value: "10_months", label: "10 месяцев", months: 10 },
	{ value: "11_months", label: "11 месяцев", months: 11 },
	{ value: "12_months", label: "12 месяцев", months: 12 },
]

// Варианты типов транспортных средств согласно ГОСТ Р 50577-2018
const vehicleTypes = [
	{
		value: "A",
		label: "A. CAR / ЛЕГКОВОЙ АВТОМОБИЛЬ",
		category: "standard" as VehicleCategory,
	},
	{
		value: "B",
		label: "B. MOTORCYCLE / МОТОЦИКЛ",
		category: "motorcycle" as VehicleCategory,
	},
	{
		value: "C",
		label: "C. LORRY OR TRACTOR / ГРУЗОВОЙ АВТОМОБИЛЬ ИЛИ ТЯГАЧ",
		category: "standard" as VehicleCategory,
	},
	{
		value: "D",
		label:
			"D. CYCLE FITTED WITH AUXILIARY ENGINE / МОПЕД ИЛИ ВЕЛОСИПЕД С ПОДВЕСНЫМ ДВИГАТЕЛЕМ",
		category: "motorcycle" as VehicleCategory,
	},
	{
		value: "E",
		label: "E. BUS / АВТОБУС",
		category: "standard" as VehicleCategory,
	},
	{
		value: "F1",
		label: "F1. TRAILER TO CAR / ПРИЦЕП К ЛЕГКОВОМУ АВТОМОБИЛЮ",
		category: "trailer" as VehicleCategory,
	},
	{
		value: "F2",
		label: "F2. TRAILER TO LORRY / ПРИЦЕП К ГРУЗОВОМУ АВТОМОБИЛЮ",
		category: "trailer" as VehicleCategory,
	},
	{
		value: "G",
		label: "G. OTHERS / ПРОЧИЕ",
		category: "standard" as VehicleCategory,
	},
]

const PolicyForm: React.FC = () => {
	const [formState, setFormState] = useState<FormState>({
		data: initialData,
		loading: false,
		errors: {},
	})

	const [successMessage, setSuccessMessage] = useState<string>("")
	const [vehicleOptions, setVehicleOptions] = useState<
		Array<{ label: string; value: string }>
	>([])
	const [vehicleLoading, setVehicleLoading] = useState<boolean>(false)
	const [selectedPeriod, setSelectedPeriod] = useState<string>("")

	// Функции для работы с датами
	const getTodayDate = (): string => {
		const today = new Date()
		const day = String(today.getDate()).padStart(2, "0")
		const month = String(today.getMonth() + 1).padStart(2, "0")
		const year = today.getFullYear()
		return `${day}.${month}.${year}`
	}

	const getMaxStartDate = (): string => {
		const today = new Date()
		const maxDate = new Date(
			today.getFullYear(),
			today.getMonth() + 1,
			today.getDate()
		)
		const day = String(maxDate.getDate()).padStart(2, "0")
		const month = String(maxDate.getMonth() + 1).padStart(2, "0")
		const year = maxDate.getFullYear()
		return `${year}-${month}-${day}` // Формат для input[type="date"]
	}

	const getTodayForInput = (): string => {
		const today = new Date()
		const day = String(today.getDate()).padStart(2, "0")
		const month = String(today.getMonth() + 1).padStart(2, "0")
		const year = today.getFullYear()
		return `${year}-${month}-${day}` // Формат для input[type="date"]
	}

	const calculateEndDate = (startDate: string, period: string): string => {
		if (!startDate || !period) return ""

		const [day, month, year] = startDate.split(".")
		const start = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))

		const periodData = insurancePeriods.find((p) => p.value === period)
		if (!periodData) return ""

		let endDate: Date
		if (periodData.days) {
			endDate = new Date(
				start.getTime() + periodData.days * 24 * 60 * 60 * 1000
			)
		} else if (periodData.months) {
			endDate = new Date(
				start.getFullYear(),
				start.getMonth() + periodData.months,
				start.getDate()
			)
		} else {
			return ""
		}

		const endDay = String(endDate.getDate()).padStart(2, "0")
		const endMonth = String(endDate.getMonth() + 1).padStart(2, "0")
		const endYear = endDate.getFullYear()
		return `${endDay}.${endMonth}.${endYear}`
	}

	// Обработка изменения периода страхования
	const handlePeriodChange = useCallback(
		(period: string) => {
			setSelectedPeriod(period)
			setFormState((prev) => {
				if (prev.data.date_start && period) {
					const endDate = calculateEndDate(prev.data.date_start, period)
					return {
						...prev,
						data: { ...prev.data, date_end: endDate },
					}
				}
				return prev
			})
		},
		[calculateEndDate]
	)

	// Обновление данных формы
	// Валидация символов для разных полей
	const validateInput = useCallback(
		(field: keyof PolicyData, value: string): string => {
			switch (field) {
				case "fio":
				case "address":
					// Разрешены только кириллица, цифры, пробелы и знаки препинания
					const cyrillicPattern = /^[а-яёА-ЯЁ0-9\s.,\-\/№]*$/
					if (!cyrillicPattern.test(value)) {
						return value.replace(/[^а-яёА-ЯЁ0-9\s.,\-\/№]/g, "")
					}
					return value
				default:
					return value
			}
		},
		[]
	)

	const updateFormData = useCallback(
		(field: keyof PolicyData, value: string | number) => {
			const stringValue = String(value)
			const validatedValue = validateInput(field, stringValue)

			setFormState((prev) => {
				const newData = { ...prev.data, [field]: validatedValue }

				// Если изменилась дата начала и выбран период, пересчитываем дату окончания
				if (field === "date_start" && selectedPeriod) {
					const endDate = calculateEndDate(validatedValue, selectedPeriod)
					newData.date_end = endDate
				}

				return {
					...prev,
					data: newData,
					errors: { ...prev.errors, [field]: "" }, // Очищаем ошибку при изменении
				}
			})
			setSuccessMessage("") // Очищаем сообщение об успехе
		},
		[validateInput, selectedPeriod, calculateEndDate]
	)

	// Определяем категорию по типу ТС
	const getVehicleCategoryByType = useCallback(
		(vehicleType: string): VehicleCategory => {
			const vehicleInfo = vehicleTypes.find((v) => v.value === vehicleType)
			return vehicleInfo ? vehicleInfo.category : "standard"
		},
		[]
	)

	// Обработчик изменения данных регистрационного знака
	const handleLicensePlateChange = useCallback(
		(plateData: LicensePlateData) => {
			// Генерируем текстовое представление номера
			const plateText = licensePlateUtils.formatForDisplay(plateData)

			setFormState((prev) => ({
				...prev,
				data: {
					...prev.data,
					license_plate: plateData,
					vehicle_category: plateData.category,
					reg_number: plateText,
				},
				errors: { ...prev.errors, reg_number: "" }, // Очищаем ошибку при изменении
			}))
			setSuccessMessage("") // Очищаем сообщение об успехе
		},
		[]
	)

	// Обработчик изменения типа ТС - автоматически обновляем категорию номера
	const handleVehicleTypeChange = useCallback(
		(vehicleType: string) => {
			const newCategory = getVehicleCategoryByType(vehicleType)

			// Обновляем категорию в данных регистрационного знака
			const newLicensePlate: LicensePlateData = {
				category: newCategory,
			}

			setFormState((prev) => ({
				...prev,
				data: {
					...prev.data,
					vehicle_type: vehicleType,
					vehicle_category: newCategory,
					license_plate: newLicensePlate,
					reg_number: "", // Очищаем номер при смене типа
				},
				errors: { ...prev.errors, vehicle_type: "", reg_number: "" },
			}))
			setSuccessMessage("")
		},
		[getVehicleCategoryByType]
	)

	// Валидация формы
	const validateForm = useCallback((): boolean => {
		const { data } = formState
		const newErrors: Partial<Record<keyof PolicyData, string>> = {}

		// Проверяем обязательные поля
		if (!data.fio.trim()) newErrors.fio = "ФИО обязательно для заполнения"
		if (!data.address.trim())
			newErrors.address = "Адрес обязателен для заполнения"

		// Валидация регистрационного знака с помощью ГОСТ валидатора
		if (data.license_plate) {
			const plateValidation = LicensePlateValidator.validate(data.license_plate)
			if (!plateValidation.isValid) {
				newErrors.reg_number = plateValidation.errors.join("; ")
			}
		} else {
			newErrors.reg_number = "Регистрационный знак обязателен"
		}

		if (!data.vehicle_type.trim()) newErrors.vehicle_type = "Тип ТС обязателен"
		if (!data.brand_model.trim())
			newErrors.brand_model = "Марка и модель обязательны"

		// Проверяем дату начала и период страхования
		if (!data.date_start.trim()) {
			newErrors.date_start = "Дата начала обязательна"
		} else {
			const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/
			if (!dateRegex.test(data.date_start)) {
				newErrors.date_start = "Формат даты: ДД.ММ.ГГГГ"
			} else {
				// Проверяем, что дата начала в допустимом диапазоне
				const [day, month, year] = data.date_start.split(".")
				const startDate = new Date(
					parseInt(year),
					parseInt(month) - 1,
					parseInt(day)
				)
				const today = new Date()
				today.setHours(0, 0, 0, 0)
				const maxDate = new Date(
					today.getFullYear(),
					today.getMonth() + 1,
					today.getDate()
				)

				if (startDate < today) {
					newErrors.date_start = "Дата начала не может быть в прошлом"
				} else if (startDate > maxDate) {
					newErrors.date_start =
						"Дата начала не может быть более чем через месяц"
				}
			}
		}

		if (!selectedPeriod) {
			newErrors.date_end = "Период страхования обязателен"
		}

		setFormState((prev) => ({ ...prev, errors: newErrors }))
		return Object.keys(newErrors).length === 0
	}, [formState, selectedPeriod])

	// Отправка формы
	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()

			if (!validateForm()) {
				return
			}

			setFormState((prev) => ({ ...prev, loading: true }))
			setSuccessMessage("")

			try {
				const response = await PdfGeneratorApi.generatePdf(formState.data)
				downloadFile(response.blob, response.filename)
				setSuccessMessage(
					`PDF файл "${response.filename}" успешно сгенерирован и загружен!`
				)
			} catch (error: any) {
				setFormState((prev) => ({
					...prev,
					errors: { ...prev.errors, fio: error.message },
				}))
			} finally {
				setFormState((prev) => ({ ...prev, loading: false }))
			}
		},
		[formState.data, validateForm]
	)

	// Поиск автомобилей
	const searchVehicles = useCallback(async (query: string) => {
		if (!query || query.length < 2) {
			setVehicleOptions([])
			return
		}

		setVehicleLoading(true)
		try {
			const response = await fetch(
				`http://localhost:5000/api/search-vehicles?q=${encodeURIComponent(
					query
				)}`
			)
			const data = await response.json()

			if (data.results) {
				const options = data.results.map((item: any) => ({
					label: item.label,
					value: item.value,
				}))
				setVehicleOptions(options)
			}
		} catch (error) {
			console.error("Ошибка при поиске автомобилей:", error)
			setVehicleOptions([])
		} finally {
			setVehicleLoading(false)
		}
	}, [])

	const { data, loading, errors } = formState

	// Сброс формы
	const handleReset = useCallback(() => {
		setFormState({
			data: {
				...initialData,
				license_plate: { category: "standard" },
			},
			loading: false,
			errors: {},
		})
		setSuccessMessage("")
		setVehicleOptions([])
	}, [])

	return (
		<Container
			maxWidth="md"
			sx={{ py: 4 }}
		>
			<Paper
				elevation={3}
				sx={{ p: 4 }}
			>
				<Box
					display="flex"
					alignItems="center"
					mb={3}
				>
					<PdfIcon sx={{ mr: 2, fontSize: 40, color: "primary.main" }} />
					<Typography
						variant="h4"
						component="h1"
						color="primary"
					>
						Оформление Синей карты
					</Typography>
				</Box>

				{successMessage && (
					<Alert
						severity="success"
						sx={{ mb: 3 }}
					>
						{successMessage}
					</Alert>
				)}

				<form onSubmit={handleSubmit}>
					<Grid
						container
						spacing={3}
					>
						{/* ФИО */}
						<Grid
							item
							xs={12}
						>
							<TextField
								fullWidth
								label="ФИО страхователя"
								value={data.fio}
								onChange={(e) => updateFormData("fio", e.target.value)}
								error={!!errors.fio}
								helperText={
									errors.fio ||
									"Только русские буквы, цифры и знаки препинания (будет автоматически транслитерировано)"
								}
								placeholder="Иванов Иван Иванович"
								required
							/>
						</Grid>

						{/* Адрес */}
						<Grid
							item
							xs={12}
						>
							<TextField
								fullWidth
								label="Адрес страхователя"
								value={data.address}
								onChange={(e) => updateFormData("address", e.target.value)}
								error={!!errors.address}
								helperText={
									errors.address ||
									"Только русские буквы, цифры и знаки препинания (будет автоматически транслитерирован)"
								}
								placeholder="г. Москва, ул. Пушкина, д. 10, кв. 5"
								required
							/>
						</Grid>

						{/* Дата начала полиса */}
						<Grid
							item
							xs={12}
							md={6}
						>
							<TextField
								fullWidth
								type="date"
								label="Дата начала полиса"
								value={
									data.date_start
										? data.date_start.split(".").reverse().join("-")
										: ""
								}
								onChange={(e) => {
									if (e.target.value) {
										const [year, month, day] = e.target.value.split("-")
										updateFormData("date_start", `${day}.${month}.${year}`)
									} else {
										updateFormData("date_start", "")
									}
								}}
								inputProps={{
									min: getTodayForInput(),
									max: getMaxStartDate(),
								}}
								error={!!errors.date_start}
								helperText={errors.date_start || "От сегодня до месяца вперед"}
								required
								InputLabelProps={{
									shrink: true,
								}}
							/>
						</Grid>

						{/* Период страхования */}
						<Grid
							item
							xs={12}
							md={6}
						>
							<FormControl
								fullWidth
								error={!!errors.date_end}
								required
							>
								<InputLabel>Период страхования</InputLabel>
								<Select
									value={selectedPeriod}
									onChange={(e) => handlePeriodChange(e.target.value)}
									label="Период страхования"
								>
									{insurancePeriods.map((period) => (
										<MenuItem
											key={period.value}
											value={period.value}
										>
											{period.label}
										</MenuItem>
									))}
								</Select>
								{errors.date_end && (
									<Typography
										variant="caption"
										color="error"
										sx={{ mt: 0.5, mx: 1.75 }}
									>
										{errors.date_end}
									</Typography>
								)}
							</FormControl>
						</Grid>

						{/* Дата окончания (только для отображения) */}
						{data.date_end && (
							<Grid
								item
								xs={12}
								md={6}
							>
								<TextField
									fullWidth
									label="Дата окончания полиса"
									value={data.date_end}
									InputProps={{
										readOnly: true,
									}}
									helperText="Рассчитывается автоматически"
									InputLabelProps={{
										shrink: true,
									}}
								/>
							</Grid>
						)}

						{/* Регистрационный знак */}
						<Grid
							item
							xs={12}
						>
							<LicensePlateInput
								value={data.license_plate}
								onChange={handleLicensePlateChange}
								category={data.vehicle_category || "standard"}
								vehicleTypeLabel={
									vehicleTypes.find((v) => v.value === data.vehicle_type)?.label
								}
								error={errors.reg_number}
								required
							/>
						</Grid>

						{/* Тип ТС */}
						<Grid
							item
							xs={12}
							md={6}
						>
							<FormControl
								fullWidth
								error={!!errors.vehicle_type}
								required
							>
								<InputLabel>Тип транспортного средства</InputLabel>
								<Select
									value={data.vehicle_type}
									onChange={(e) => handleVehicleTypeChange(e.target.value)}
									label="Тип транспортного средства"
								>
									{vehicleTypes.map((type) => (
										<MenuItem
											key={type.value}
											value={type.value}
										>
											{type.label}
										</MenuItem>
									))}
								</Select>
								{errors.vehicle_type && (
									<Typography
										variant="caption"
										color="error"
										sx={{ mt: 0.5, mx: 1.75 }}
									>
										{errors.vehicle_type}
									</Typography>
								)}
							</FormControl>
						</Grid>

						{/* Марка и модель */}
						<Grid
							item
							xs={12}
						>
							<Autocomplete
								freeSolo
								options={vehicleOptions}
								getOptionLabel={(option) =>
									typeof option === "string" ? option : option.label
								}
								value={data.brand_model}
								onInputChange={(event, newInputValue) => {
									updateFormData("brand_model", newInputValue)
									searchVehicles(newInputValue)
								}}
								onChange={(event, newValue) => {
									const value =
										typeof newValue === "string"
											? newValue
											: newValue?.value || ""
									updateFormData("brand_model", value)
								}}
								loading={vehicleLoading}
								renderInput={(params) => (
									<TextField
										{...params}
										fullWidth
										label="Марка и модель"
										placeholder="Начните вводить марку или модель..."
										error={!!errors.brand_model}
										helperText={
											errors.brand_model ||
											"Выберите из списка или введите свой вариант"
										}
										required
										InputProps={{
											...params.InputProps,
											endAdornment: (
												<>
													{vehicleLoading ? (
														<CircularProgress
															color="inherit"
															size={20}
														/>
													) : null}
													{params.InputProps.endAdornment}
												</>
											),
										}}
									/>
								)}
								renderOption={(props, option) => {
									const { key, ...rest } = props as any
									return (
										<li
											key={key}
											{...rest}
										>
											{typeof option === "string" ? option : option.label}
										</li>
									)
								}}
								noOptionsText="Нет подходящих вариантов"
								loadingText="Поиск..."
							/>
						</Grid>

						{/* Кнопки */}
						<Grid
							item
							xs={12}
						>
							<Box
								display="flex"
								gap={2}
								justifyContent="flex-end"
							>
								<Button
									type="button"
									variant="outlined"
									onClick={handleReset}
									disabled={loading}
								>
									Очистить
								</Button>
								<Button
									type="submit"
									variant="contained"
									startIcon={
										loading ? <CircularProgress size={20} /> : <DownloadIcon />
									}
									disabled={loading}
									size="large"
								>
									{loading ? "Генерация PDF..." : "Скачать PDF"}
								</Button>
							</Box>
						</Grid>
					</Grid>
				</form>
			</Paper>
		</Container>
	)
}

export default PolicyForm
