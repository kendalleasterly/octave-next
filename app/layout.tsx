"use client"

import { ReactNode } from "react"
import { RecoilRoot } from "recoil"
import AppLayout from "./AppLayout"
import { useReferences } from "./Global/references"

export default function RootLayout({ children }: { children: ReactNode }) {

  const bodyRef = useReferences().bodyReference

	return (
		<html>
			<body ref = {bodyRef}>
				<RecoilRoot>
					<AppLayout>{children}</AppLayout>
				</RecoilRoot>
			</body>
		</html>
	)
}
