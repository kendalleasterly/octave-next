import "./globals.css"
import { ReactNode } from "react"
import Provider from "./provider"
import ComingSoon from "./ComingSoon"

export const dynamic = "force-dynamic"

const isComingSoon = true

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html>
			<body>
				{isComingSoon ? <ComingSoon /> : <Provider>{children}</Provider>}
			</body>
		</html>
	)
}
