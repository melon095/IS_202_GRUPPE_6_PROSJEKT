interface IconProps {
	alt: string;
	src: string;
	fill?: string;
}

export const Icon = ({ src, alt, fill }: IconProps) => {
	return (
		<figure className="image is-48x48">
			<img
				src={src}
				alt={alt}
				style={{
					objectFit: "cover",
					fill: fill,
				}}
				className="icon"
			/>
		</figure>
	);
};
