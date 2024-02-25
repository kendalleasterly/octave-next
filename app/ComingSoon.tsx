import Link from "next/link"
import { Poppins } from "next/font/google"
import Image from "next/image"
import Logo from "@/public/Images/logo.svg"

const poppins = Poppins({
	subsets: ["latin"],
	weight: "500",
})

function ComingSoon() {
	return (
		<div className="bg-base-100">
			<div className="navbar pl-4">
				<div className="flex space-x-2">
					<Logo fill= "#FFFFFF" />
					<p className="text-2xl font-bold text-white ">Octave</p>
				</div>
			</div>

			<div className="divider"></div>

			<div className="hero min-h-screen">
				<div className="hero-content flex-col space-y-6">
					<h1 className="text-5xl font-bold">Live Demo Coming Soon!</h1>
					<div className="mockup-window border">
						<Image
							src={"/octave-render.png"}
							alt="octave desktop render"
							width={560}
							height={620}
						/>
					</div>
					<p>
						In the meantime, please visit Octave&apos;s project description!
					</p>
					<Link
						className="btn btn-primary text-white"
						href="https://kendalleasterly.com/projects/octave"
					>
						Read More
					</Link>
				</div>
			</div>

			<div className="divider"></div>

			<footer className="footer items-center p-4 text-neutral-content">
				<aside className="items-center grid-flow-col">
					<p> © 2024 Octave by <Link className = "link" href = "https://kendalleasterly.com">Kendall Easterly</Link>  - All rights reserved</p>
				</aside>
				<nav className="grid-flow-col gap-4 md:place-self-center md:justify-self-end">
					
					
				</nav>
			</footer>
		</div>
	)
}

export default ComingSoon
