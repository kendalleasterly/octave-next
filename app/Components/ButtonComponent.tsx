function ButtonComponent({text, action}: {text: string, action: () => void}) {
	return (
		<button
			className="py-1 bg-accent20 dark:bg-accent80 rounded-lg px-10 w-full "
			onClick={action}>
			<p className="text-accent80 dark:text-accent20 font-semibold text-center">
				{text}
			</p>
		</button>
	);
}

export default ButtonComponent;
