import React from "react"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import { CssBaseline, Box } from "@mui/material"
import PolicyForm from "./components/PolicyForm"

// Создаем тему Material-UI
const theme = createTheme({
	palette: {
		mode: "light",
		primary: {
			main: "#1976d2",
		},
		secondary: {
			main: "#dc004e",
		},
		background: {
			default: "#f5f5f5",
		},
	},
	typography: {
		fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
		h4: {
			fontWeight: 600,
		},
	},
	components: {
		MuiPaper: {
			styleOverrides: {
				root: {
					borderRadius: 12,
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 8,
					textTransform: "none",
					fontWeight: 600,
				},
			},
		},
		MuiTextField: {
			styleOverrides: {
				root: {
					"& .MuiOutlinedInput-root": {
						borderRadius: 8,
					},
				},
			},
		},
	},
})

const App: React.FC = () => {
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<Box
				sx={{
					minHeight: "100vh",
					background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
					py: 2,
				}}
			>
				<PolicyForm />
			</Box>
		</ThemeProvider>
	)
}

export default App








