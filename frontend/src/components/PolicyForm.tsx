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
import { PolicyData, FormState } from "../types"
import { PdfGeneratorApi, downloadFile } from "../services/api"

// Начальные данные формы
const initialData: PolicyData = {
	fio: "",
	address: "",
	date_start: "",
	date_end: "",
	reg_number: "",
	vehicle_type: "",
	brand_model: "",
}

// Варианты типов транспортных средств
const vehicleTypes = [
	{ value: "B", label: "B - Легковые автомобили" },
	{ value: "C", label: "C - Грузовые автомобили" },
	{ value: "D", label: "D - Автобусы" },
	{ value: "A", label: "A - Мотоциклы" },
	{ value: "BE", label: "BE - Легковые с прицепом" },
	{ value: "CE", label: "CE - Грузовые с прицепом" },
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
	const updateFormData = useCallback(
		(field: keyof PolicyData, value: string | number) => {
			setFormState((prev) => ({
				...prev,
				data: { ...prev.data, [field]: value },
				errors: { ...prev.errors, [field]: "" }, // Очищаем ошибку при изменении
			}))
			setSuccessMessage("") // Очищаем сообщение об успехе
		},
		[]
	)

	// Валидация формы
	const validateForm = useCallback((): boolean => {
		const { data } = formState
		const newErrors: Partial<Record<keyof PolicyData, string>> = {}

		// Проверяем обязательные поля
		if (!data.fio.trim()) newErrors.fio = "ФИО обязательно для заполнения"
		if (!data.address.trim())
			newErrors.address = "Адрес обязателен для заполнения"
		if (!data.reg_number.trim())
			newErrors.reg_number = "Регистрационный знак обязателен"
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
			data: initialData,
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
						Генератор PDF полисов
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
								helperText={errors.fio}
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
								helperText={errors.address}
								placeholder="г. Москва, ул. Ленина, д. 1, кв. 1"
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
							md={6}
						>
							<Box>
								<Typography
									variant="body2"
									color="text.secondary"
									gutterBottom
									sx={{ mb: 1 }}
								>
									Регистрационный знак *
								</Typography>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										border: errors.reg_number
											? "2px solid #d32f2f"
											: "2px solid #000",
										borderRadius: "8px",
										backgroundColor: "#fff",
										overflow: "hidden",
										width: "fit-content",
										"&:focus-within": {
											borderColor: errors.reg_number ? "#d32f2f" : "#1976d2",
											borderWidth: "3px",
										},
									}}
								>
									{/* Основная часть номера */}
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											px: 2,
											py: 1,
											backgroundColor: "#fff",
											borderRight: "2px solid #000",
										}}
									>
										<TextField
											value={data.reg_number.slice(0, 6)}
											onChange={(e) => {
												const value = e.target.value.toUpperCase()
												// Ограничиваем ввод только латинскими буквами и цифрами
												const filteredValue = value.replace(/[^A-Z0-9]/g, "")

												// Если введено больше 6 символов, лишние идут в регион
												let mainNumber = filteredValue.slice(0, 6)
												let region = data.reg_number.slice(6, 9)

												if (filteredValue.length > 6) {
													// Берем все лишние символы (буквы и цифры) и извлекаем только цифры для региона
													const extraChars = filteredValue.slice(6)
													const extraDigits = extraChars.replace(/\D/g, "")
													region = extraDigits.slice(0, 3)
												}

												updateFormData("reg_number", mainNumber + region)
											}}
											variant="standard"
											inputProps={{
												style: {
													fontSize: "24px",
													fontWeight: "bold",
													textAlign: "center",
													letterSpacing: "2px",
													width: "140px",
													border: "none",
													outline: "none",
													backgroundColor: "transparent",
												},
												placeholder: "A 777 AA",
											}}
											sx={{
												"& .MuiInput-root": {
													"&:before": { borderBottom: "none" },
													"&:after": { borderBottom: "none" },
													"&:hover:not(.Mui-disabled):before": {
														borderBottom: "none",
													},
												},
											}}
										/>
									</Box>

									{/* Правая часть с регионом и флагом */}
									<Box
										sx={{
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
											px: 1,
											py: 0.5,
											backgroundColor: "#fff",
											minWidth: "60px",
										}}
									>
										<TextField
											value={data.reg_number.slice(6, 9)}
											onChange={(e) => {
												const value = e.target.value
												// Ограничиваем ввод только цифрами
												const filteredValue = value.replace(/\D/g, "")
												const mainNumber = data.reg_number.slice(0, 6)
												const region = filteredValue.slice(0, 3)
												updateFormData("reg_number", mainNumber + region)
											}}
											variant="standard"
											inputProps={{
												style: {
													fontSize: "10px",
													fontWeight: "bold",
													textAlign: "center",
													width: "30px",
													border: "none",
													outline: "none",
													backgroundColor: "transparent",
													color: "#666",
												},
												placeholder: "777",
											}}
											sx={{
												"& .MuiInput-root": {
													"&:before": { borderBottom: "none" },
													"&:after": { borderBottom: "none" },
													"&:hover:not(.Mui-disabled):before": {
														borderBottom: "none",
													},
												},
											}}
										/>
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												fontSize: "10px",
												fontWeight: "bold",
												color: "#000",
											}}
										>
											RUS
											<Box
												sx={{
													ml: 0.5,
													width: "12px",
													height: "8px",
													background:
														"linear-gradient(to bottom, #fff 0%, #fff 33%, #0052cc 33%, #0052cc 66%, #d32f2f 66%, #d32f2f 100%)",
													border: "0.5px solid #000",
												}}
											/>
										</Box>
									</Box>
								</Box>
								{errors.reg_number && (
									<Typography
										variant="caption"
										color="error"
										sx={{ mt: 0.5, display: "block" }}
									>
										{errors.reg_number}
									</Typography>
								)}
								<Typography
									variant="caption"
									color="text.secondary"
									sx={{ mt: 0.5, display: "block" }}
								>
									Формат: А123БВ77 (1 буква, 3 цифры, 2 буквы, 2-3 цифры
									региона)
								</Typography>
							</Box>
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
									onChange={(e) =>
										updateFormData("vehicle_type", e.target.value)
									}
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
