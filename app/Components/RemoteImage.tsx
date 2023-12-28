// "use client"

import Image from "next/image"

export default function RemoteImage({className, src}: {className: string, src: string}) {
	function imageLoader({width}:{width:number}) {
		return src
	}

	return (
		
			<Image
				loader={imageLoader}
				className={className}
				src={src}
				fill={true}
				alt=""
			/>
		
	)
}
