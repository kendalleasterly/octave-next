"use client"

import "./globals.css"
import { ReactNode } from "react"
import { RecoilRoot } from "recoil"
import AppLayout from "./AppLayout"


export default function RootLayout({ children }: { children: ReactNode }) {


	return (
		<html>
			<body >
				<RecoilRoot>
					<AppLayout>{children}</AppLayout>
				</RecoilRoot>
			</body>
		</html>
	)
}
