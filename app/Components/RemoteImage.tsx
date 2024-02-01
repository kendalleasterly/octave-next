import Image from "next/image"

export default function RemoteImage({imgClass, src, className}: {className: string, imgClass: string, src: string}) {
	function imageLoader({width}:{width:number}) {
		return src
	}

	//IMPORTANT: this must have a parent div, which must have the relative class attribute along with all the ones you thought were in this one

	return (
		<div className={`relative ${className}`}>
<Image
				loader={imageLoader}
				className={imgClass}
				src={src}
				fill={true}
				unoptimized
				alt=""
			/>
		</div>
			
		
	)
}
