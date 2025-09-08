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

			setFormState((prev) => ({
				...prev,
				data: { ...prev.data, [field]: validatedValue },
				errors: { ...prev.errors, [field]: "" }, // Очищаем ошибку при изменении
			}))
			setSuccessMessage("") // Очищаем сообщение об успехе
		},
		[validateInput]
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

		// Проверяем формат дат
		const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/
		if (!data.date_start.trim()) {
			newErrors.date_start = "Дата начала обязательна"
		} else if (!dateRegex.test(data.date_start)) {
			newErrors.date_start = "Формат даты: ДД.ММ.ГГГГ"
		}

		if (!data.date_end.trim()) {
			newErrors.date_end = "Дата окончания обязательна"
		} else if (!dateRegex.test(data.date_end)) {
			newErrors.date_end = "Формат даты: ДД.ММ.ГГГГ"
		}

		setFormState((prev) => ({ ...prev, errors: newErrors }))
		return Object.keys(newErrors).length === 0
	}, [formState])

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
				`/api/search-vehicles?q=${encodeURIComponent(query)}`
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

						{/* Даты */}
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
								error={!!errors.date_start}
								helperText={errors.date_start || "Выберите дату"}
								required
								InputLabelProps={{
									shrink: true,
								}}
							/>
						</Grid>

						<Grid
							item
							xs={12}
							md={6}
						>
							<TextField
								fullWidth
								type="date"
								label="Дата окончания полиса"
								value={
									data.date_end
										? data.date_end.split(".").reverse().join("-")
										: ""
								}
								onChange={(e) => {
									if (e.target.value) {
										const [year, month, day] = e.target.value.split("-")
										updateFormData("date_end", `${day}.${month}.${year}`)
									} else {
										updateFormData("date_end", "")
									}
								}}
								error={!!errors.date_end}
								helperText={errors.date_end || "Выберите дату"}
								required
								InputLabelProps={{
									shrink: true,
								}}
							/>
						</Grid>

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
								renderOption={(props, option) => (
									<li {...props}>
										{typeof option === "string" ? option : option.label}
									</li>
								)}
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
