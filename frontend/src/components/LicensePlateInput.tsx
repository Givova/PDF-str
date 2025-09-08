import React, { useState, useEffect, useCallback, useRef } from "react"
import { Box, TextField, Typography, Paper } from "@mui/material"
import { VehicleCategory, LicensePlateData } from "../types"

interface LicensePlateInputProps {
	value?: LicensePlateData
	onChange: (data: LicensePlateData) => void
	category: VehicleCategory // Категория передается извне
	vehicleTypeLabel?: string // Название типа ТС для отображения
	error?: string
	required?: boolean
}

// Разрешенные кириллические буквы для номеров согласно ГОСТ
const ALLOWED_LETTERS = "АВЕКМНОРСТУХ"

// Описания форматов номеров
const FORMAT_DESCRIPTIONS = {
	standard: "L NNN LL RR(R) - буква, 3 цифры, 2 буквы, код региона",
	trailer: "LL NNNN RR(R) - 2 буквы, 4 цифры, код региона",
	tractor: "Верх: NNNN, Низ: LL RR(R) - 4 цифры, 2 буквы, код региона",
	motorcycle: "Верх: NNNN, Низ: LL RR(R) - 4 цифры, 2 буквы, код региона",
} as const

const LicensePlateInput: React.FC<LicensePlateInputProps> = ({
	value,
	onChange,
	category,
	vehicleTypeLabel,
	error,
	required = false,
}) => {
	const [plateData, setPlateData] = useState<LicensePlateData>(
		value || { category }
	)

	// Refs для автофокуса полей
	const letter1Ref = useRef<HTMLInputElement>(null)
	const digitsRef = useRef<HTMLInputElement>(null)
	const lettersRef = useRef<HTMLInputElement>(null)
	const regionRef = useRef<HTMLInputElement>(null)

	// Refs для прицепов
	const trailerLettersRef = useRef<HTMLInputElement>(null)
	const trailerDigitsRef = useRef<HTMLInputElement>(null)
	const trailerRegionRef = useRef<HTMLInputElement>(null)

	// Refs для квадратных номеров
	const topDigitsRef = useRef<HTMLInputElement>(null)
	const bottomLettersRef = useRef<HTMLInputElement>(null)
	const bottomRegionRef = useRef<HTMLInputElement>(null)

	// Обновляем локальное состояние при изменении внешнего значения или категории
	useEffect(() => {
		if (value) {
			setPlateData(value)
		} else if (category !== plateData.category) {
			// Очищаем данные при смене категории
			const newData = { category }
			setPlateData(newData)
			onChange(newData)
		}
	}, [value, category, plateData.category, onChange])

	// Функция для фильтрации ввода букв
	const filterLetters = useCallback((input: string): string => {
		return input
			.toUpperCase()
			.split("")
			.filter((char) => ALLOWED_LETTERS.includes(char))
			.join("")
	}, [])

	// Функция для фильтрации ввода цифр
	const filterDigits = useCallback((input: string): string => {
		return input.replace(/\D/g, "")
	}, [])

	// Функции для автофокуса
	const focusNextField = useCallback(
		(currentField: string, value: string) => {
			switch (category) {
				case "standard":
					if (currentField === "letter1" && value.length === 1) {
						digitsRef.current?.focus()
					} else if (currentField === "digits" && value.length === 3) {
						lettersRef.current?.focus()
					} else if (currentField === "letters" && value.length === 2) {
						regionRef.current?.focus()
					}
					break
				case "trailer":
					if (currentField === "trailerLetters" && value.length === 2) {
						trailerDigitsRef.current?.focus()
					} else if (currentField === "trailerDigits" && value.length === 4) {
						trailerRegionRef.current?.focus()
					}
					break
				case "tractor":
				case "motorcycle":
					if (currentField === "topDigits" && value.length === 4) {
						bottomLettersRef.current?.focus()
					} else if (currentField === "bottomLetters" && value.length === 2) {
						bottomRegionRef.current?.focus()
					}
					break
			}
		},
		[category]
	)

	const focusPrevField = useCallback(
		(currentField: string, value: string) => {
			if (value.length === 0) {
				switch (category) {
					case "standard":
						if (currentField === "region") {
							lettersRef.current?.focus()
						} else if (currentField === "letters") {
							digitsRef.current?.focus()
						} else if (currentField === "digits") {
							letter1Ref.current?.focus()
						}
						break
					case "trailer":
						if (currentField === "trailerRegion") {
							trailerDigitsRef.current?.focus()
						} else if (currentField === "trailerDigits") {
							trailerLettersRef.current?.focus()
						}
						break
					case "tractor":
					case "motorcycle":
						if (currentField === "bottomRegion") {
							bottomLettersRef.current?.focus()
						} else if (currentField === "bottomLetters") {
							topDigitsRef.current?.focus()
						}
						break
				}
			}
		},
		[category]
	)

	// Обновление данных с валидацией и автофокусом
	const updatePlateData = useCallback(
		(updates: Partial<LicensePlateData>) => {
			const newData = { ...plateData, ...updates }
			setPlateData(newData)
			onChange(newData)
		},
		[plateData, onChange]
	)

	// Функция для генерации итогового номера в текстовом формате
	const generatePlateNumber = useCallback((data: LicensePlateData): string => {
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
	}, [])

	// Рендеринг формы для стандартных автомобилей (L NNN LL | RR(R))
	const renderStandardForm = () => (
		<Box
			sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}
		>
			<Box
				sx={{
					display: "flex",
					border: error ? "3px solid #d32f2f" : "3px solid #000",
					borderRadius: "4px",
					overflow: "hidden",
					backgroundColor: "#fff",
					width: "260px",
					height: "56px",
					fontFamily: "monospace",
					boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
				}}
			>
				{/* Основная часть номера */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						flex: 1,
						backgroundColor: "#fff",
						borderRight: "2px solid #000",
						px: 1,
					}}
				>
					{/* Первая буква */}
					<TextField
						inputRef={letter1Ref}
						value={plateData.letter1 || ""}
						onChange={(e) => {
							const filtered = filterLetters(e.target.value).slice(0, 1)
							updatePlateData({ letter1: filtered })
							focusNextField("letter1", filtered)
						}}
						onKeyDown={(e) => {
							if (e.key === "Backspace") {
								setTimeout(() => {
									focusPrevField(
										"letter1",
										(e.target as HTMLInputElement).value
									)
								}, 0)
							}
						}}
						variant="standard"
						inputProps={{
							style: {
								fontSize: "38px",
								fontWeight: "bold",
								textAlign: "center",
								width: "35px",
								border: "none",
								outline: "none",
								fontFamily: "monospace",
								color: "#000",
							},
							placeholder: "А",
							maxLength: 1,
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

					{/* Три цифры */}
					<TextField
						inputRef={digitsRef}
						value={plateData.digits || ""}
						onChange={(e) => {
							const filtered = filterDigits(e.target.value).slice(0, 3)
							updatePlateData({ digits: filtered })
							focusNextField("digits", filtered)
						}}
						onKeyDown={(e) => {
							if (e.key === "Backspace") {
								setTimeout(() => {
									focusPrevField("digits", (e.target as HTMLInputElement).value)
								}, 0)
							}
						}}
						variant="standard"
						inputProps={{
							style: {
								fontSize: "38px",
								fontWeight: "bold",
								textAlign: "center",
								width: "75px",
								border: "none",
								outline: "none",
								fontFamily: "monospace",
								color: "#000",
							},
							placeholder: "123",
							maxLength: 3,
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

					{/* Две буквы */}
					<TextField
						inputRef={lettersRef}
						value={plateData.letters || ""}
						onChange={(e) => {
							const filtered = filterLetters(e.target.value).slice(0, 2)
							updatePlateData({ letters: filtered })
							focusNextField("letters", filtered)
						}}
						onKeyDown={(e) => {
							if (e.key === "Backspace") {
								setTimeout(() => {
									focusPrevField(
										"letters",
										(e.target as HTMLInputElement).value
									)
								}, 0)
							}
						}}
						variant="standard"
						inputProps={{
							style: {
								fontSize: "38px",
								fontWeight: "bold",
								textAlign: "center",
								width: "70px",
								border: "none",
								outline: "none",
								fontFamily: "monospace",
								color: "#000",
							},
							placeholder: "ВС",
							maxLength: 2,
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

				{/* Регион */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						px: 0.5,
						py: 0,
						backgroundColor: "#fff",
						width: "70px",
						height: "80%",
						gap: 0,
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							mb: -0.5,
							mt: 0.9,
						}}
					>
						<TextField
							inputRef={regionRef}
							value={plateData.region || ""}
							onChange={(e) => {
								const filtered = filterDigits(e.target.value)
								if (
									filtered.length > 0 &&
									filtered.replace(/0/g, "").length === 0
								) {
									return // Не позволяем вводить только нули
								}
								const region = filtered.slice(0, 3)
								updatePlateData({ region })
								focusNextField("region", region)
							}}
							onKeyDown={(e) => {
								if (e.key === "Backspace") {
									setTimeout(() => {
										focusPrevField(
											"region",
											(e.target as HTMLInputElement).value
										)
									}, 0)
								}
							}}
							variant="standard"
							inputProps={{
								style: {
									fontSize: "24px",
									fontWeight: "bold",
									textAlign: "center",
									width: "50px",
									border: "none",
									outline: "none",
									fontFamily: "monospace",
									color: "#000",
								},
								placeholder: "77",
								maxLength: 3,
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
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "10px",
							fontWeight: "bold",
							color: "#000",
							// mt: -0.5,
						}}
					>
						RUS
						<Box
							sx={{
								ml: 0.1,
								width: "10px",
								height: "6px",
								background:
									"linear-gradient(to bottom, #fff 0%, #fff 33%, #0052cc 33%, #0052cc 66%, #d32f2f 66%, #d32f2f 100%)",
								border: "0.2px solid #000",
							}}
						/>
					</Box>
				</Box>
			</Box>
			<Typography
				variant="body2"
				color="text.secondary"
			>
				Пример: А123ВС77
			</Typography>
		</Box>
	)

	// Рендеринг формы для прицепов (LL NNNN | RR(R))
	const renderTrailerForm = () => (
		<Box
			sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}
		>
			<Box
				sx={{
					display: "flex",
					border: error ? "3px solid #d32f2f" : "3px solid #000",
					borderRadius: "4px",
					overflow: "hidden",
					backgroundColor: "#fff",
					width: "280px",
					height: "56px",
					fontFamily: "monospace",
					boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
				}}
			>
				{/* Основная часть номера */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						flex: 1,
						backgroundColor: "#fff",
						borderRight: "2px solid #000",
						px: 1,
					}}
				>
					{/* Две буквы */}
					<TextField
						inputRef={trailerLettersRef}
						value={plateData.trailerLetters || ""}
						onChange={(e) => {
							const filtered = filterLetters(e.target.value).slice(0, 2)
							updatePlateData({ trailerLetters: filtered })
							focusNextField("trailerLetters", filtered)
						}}
						onKeyDown={(e) => {
							if (e.key === "Backspace") {
								setTimeout(() => {
									focusPrevField(
										"trailerLetters",
										(e.target as HTMLInputElement).value
									)
								}, 0)
							}
						}}
						variant="standard"
						inputProps={{
							style: {
								fontSize: "38px",
								fontWeight: "bold",
								textAlign: "center",
								width: "70px",
								border: "none",
								outline: "none",
								fontFamily: "monospace",
								color: "#000",
							},
							placeholder: "ММ",
							maxLength: 2,
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

					{/* Четыре цифры */}
					<TextField
						inputRef={trailerDigitsRef}
						value={plateData.trailerDigits || ""}
						onChange={(e) => {
							const filtered = filterDigits(e.target.value).slice(0, 4)
							updatePlateData({ trailerDigits: filtered })
							focusNextField("trailerDigits", filtered)
						}}
						onKeyDown={(e) => {
							if (e.key === "Backspace") {
								setTimeout(() => {
									focusPrevField(
										"trailerDigits",
										(e.target as HTMLInputElement).value
									)
								}, 0)
							}
						}}
						variant="standard"
						inputProps={{
							style: {
								fontSize: "38px",
								fontWeight: "bold",
								textAlign: "center",
								width: "100px",
								border: "none",
								outline: "none",
								fontFamily: "monospace",
								color: "#000",
							},
							placeholder: "9768",
							maxLength: 4,
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

				{/* Регион */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						px: 0.5,
						py: 0,
						backgroundColor: "#fff",
						width: "70px",
						height: "80%",
						gap: 0,
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							mb: -0.5,
						}}
					>
						<TextField
							inputRef={trailerRegionRef}
							value={plateData.region || ""}
							onChange={(e) => {
								const filtered = filterDigits(e.target.value)
								if (
									filtered.length > 0 &&
									filtered.replace(/0/g, "").length === 0
								) {
									return
								}
								const region = filtered.slice(0, 3)
								updatePlateData({ region })
								focusNextField("trailerRegion", region)
							}}
							onKeyDown={(e) => {
								if (e.key === "Backspace") {
									setTimeout(() => {
										focusPrevField(
											"trailerRegion",
											(e.target as HTMLInputElement).value
										)
									}, 0)
								}
							}}
							variant="standard"
							inputProps={{
								style: {
									fontSize: "29px",
									fontWeight: "bold",
									textAlign: "center",
									width: "50px",
									border: "none",
									outline: "none",
									fontFamily: "monospace",
									color: "#000",
								},
								placeholder: "77",
								maxLength: 3,
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
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "10px",
							fontWeight: "bold",
							color: "#000",
							mt: -0.5,
						}}
					>
						RUS
						<Box
							sx={{
								ml: 0.1,
								width: "10px",
								height: "6px",
								background:
									"linear-gradient(to bottom, #fff 0%, #fff 33%, #0052cc 33%, #0052cc 66%, #d32f2f 66%, #d32f2f 100%)",
								border: "0.2px solid #000",
							}}
						/>
					</Box>
				</Box>
			</Box>
			<Typography
				variant="body2"
				color="text.secondary"
			>
				Пример: ММ976877
			</Typography>
		</Box>
	)

	// Рендеринг формы для тракторов и мотоциклов (двухстрочный формат)
	const renderTwoLineForm = () => (
		<Box
			sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}
		>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					border: error ? "3px solid #d32f2f" : "3px solid #000",
					borderRadius: "4px",
					overflow: "hidden",
					backgroundColor: "#fff",
					width: "120px",
					height: "120px",
					fontFamily: "monospace",
					boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
				}}
			>
				{/* Верхняя строка - четыре цифры */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						borderBottom: "1px solid #000",
						py: 0.2,
						height: "60px",
					}}
				>
					<TextField
						inputRef={topDigitsRef}
						value={plateData.topDigits || ""}
						onChange={(e) => {
							const filtered = filterDigits(e.target.value).slice(0, 4)
							updatePlateData({ topDigits: filtered })
							focusNextField("topDigits", filtered)
						}}
						onKeyDown={(e) => {
							if (e.key === "Backspace") {
								setTimeout(() => {
									focusPrevField(
										"topDigits",
										(e.target as HTMLInputElement).value
									)
								}, 0)
							}
						}}
						variant="standard"
						inputProps={{
							style: {
								fontSize: "29px",
								fontWeight: "bold",
								textAlign: "center",
								width: "100px",
								border: "none",
								outline: "none",
								fontFamily: "monospace",
								color: "#000",
							},
							placeholder: "1234",
							maxLength: 4,
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

				{/* Нижняя строка - две буквы и регион */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						px: 1,
						py: 0.2,
						height: "60px",
					}}
				>
					<TextField
						inputRef={bottomLettersRef}
						value={plateData.bottomLetters || ""}
						onChange={(e) => {
							const filtered = filterLetters(e.target.value).slice(0, 2)
							updatePlateData({ bottomLetters: filtered })
							focusNextField("bottomLetters", filtered)
						}}
						onKeyDown={(e) => {
							if (e.key === "Backspace") {
								setTimeout(() => {
									focusPrevField(
										"bottomLetters",
										(e.target as HTMLInputElement).value
									)
								}, 0)
							}
						}}
						variant="standard"
						inputProps={{
							style: {
								fontSize: "29px",
								fontWeight: "bold",
								textAlign: "center",
								width: "70px",
								border: "none",
								outline: "none",
								fontFamily: "monospace",
								color: "#000",
							},
							placeholder: "АБ",
							maxLength: 2,
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
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							width: "55px",
							height: "100%",
						}}
					>
						<TextField
							inputRef={bottomRegionRef}
							value={plateData.bottomRegion || ""}
							onChange={(e) => {
								const filtered = filterDigits(e.target.value)
								if (
									filtered.length > 0 &&
									filtered.replace(/0/g, "").length === 0
								) {
									return
								}
								const region = filtered.slice(0, 3)
								updatePlateData({ bottomRegion: region })
								focusNextField("bottomRegion", region)
							}}
							onKeyDown={(e) => {
								if (e.key === "Backspace") {
									setTimeout(() => {
										focusPrevField(
											"bottomRegion",
											(e.target as HTMLInputElement).value
										)
									}, 0)
								}
							}}
							variant="standard"
							inputProps={{
								style: {
									fontSize: "22px",
									fontWeight: "bold",
									textAlign: "center",
									width: "45px",
									border: "none",
									outline: "none",
									fontFamily: "monospace",
									color: "#000",
								},
								placeholder: "77",
								maxLength: 3,
							}}
							sx={{
								mb: -0.2,
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
								fontSize: "8px",
								fontWeight: "bold",
								color: "#000",
								mt: -0.3,
							}}
						>
							RUS
							<Box
								sx={{
									ml: 0.2,
									width: "8px",
									height: "5px",
									background:
										"linear-gradient(to bottom, #fff 0%, #fff 33%, #0052cc 33%, #0052cc 66%, #d32f2f 66%, #d32f2f 100%)",
									border: "0.2px solid #000",
								}}
							/>
						</Box>
					</Box>
				</Box>
			</Box>
			<Typography
				variant="body2"
				color="text.secondary"
			>
				{category === "tractor" ? "Пример: 1234АБ77" : "Пример: 5678ВГ77"}
			</Typography>
		</Box>
	)

	// Получение текущего номера для отображения
	const currentPlateNumber = generatePlateNumber(plateData)

	return (
		<Box>
			<Typography
				variant="body2"
				color="text.secondary"
				gutterBottom
				sx={{ mb: 1 }}
			>
				Регистрационный знак {required && "*"}
			</Typography>

			{/* Отображение типа ТС и формата */}
			{vehicleTypeLabel && (
				<Typography
					variant="body2"
					color="primary"
					sx={{ mb: 1, fontWeight: "medium" }}
				>
					Тип ТС: {vehicleTypeLabel}
				</Typography>
			)}
			<Typography
				variant="caption"
				color="text.secondary"
				sx={{ mb: 2, display: "block" }}
			>
				Формат: {FORMAT_DESCRIPTIONS[category]}
			</Typography>

			{/* Форма ввода в зависимости от категории */}
			<Box sx={{ mb: 2 }}>
				{category === "standard" && renderStandardForm()}
				{category === "trailer" && renderTrailerForm()}
				{(category === "tractor" || category === "motorcycle") &&
					renderTwoLineForm()}
			</Box>

			{/* Отображение ошибки */}
			{error && (
				<Typography
					variant="caption"
					color="error"
					sx={{ display: "block", mb: 1 }}
				>
					{error}
				</Typography>
			)}

			{/* Подсказка */}
			<Typography
				variant="caption"
				color="text.secondary"
				sx={{ display: "block" }}
			>
				Разрешенные буквы: {ALLOWED_LETTERS}
				{currentPlateNumber && (
					<>
						<br />
						Итоговый номер: <strong>{currentPlateNumber}</strong>
					</>
				)}
			</Typography>
		</Box>
	)
}

export default LicensePlateInput
