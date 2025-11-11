interface IconProps {
	alt: string;
	src: string;
}

export const Icon = ({ src, alt }: IconProps) => {
	return (
		<figure className="image is-48x48">
			<img
				src={src}
				alt={alt}
				style={{
					objectFit: "cover",
				}}
				className="icon"
			/>
		</figure>
	);
};
