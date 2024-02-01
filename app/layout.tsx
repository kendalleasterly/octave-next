import "./globals.css"
import { ReactNode } from "react"
import Provider from "./provider"

export const dynamic = "force-dynamic"

export default function RootLayout({ children }: { children: ReactNode }) {


	return (
		<html>
			<body >
				<Provider>
					{children}
				</Provider>
			</body>
		</html>
	)
}
