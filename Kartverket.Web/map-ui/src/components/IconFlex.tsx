import { FontAwesomeIcon, FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import { ElementType } from "react";

type Icon = FontAwesomeIconProps["icon"];

type IconFlexProps<T extends ElementType = "button"> = {
	as?: T;
	icon: FontAwesomeIconProps | Icon;
	children: React.ReactNode;
	fullWidth?: boolean;
	className?: string;
	style?: React.CSSProperties;
} & React.ComponentPropsWithoutRef<T>;

function isFullProps(icon: FontAwesomeIconProps | Icon): icon is FontAwesomeIconProps {
	return typeof icon === "object" && "icon" in icon;
}

export const IconFlex = <T extends ElementType = "button">({
	as,
	icon,
	children,
	fullWidth = false,
	className = "",
	style,
	...rest
}: IconFlexProps<T>) => {
	const Component = as || "button";

	// NOTE: Må ha mellomrom før "button"                                        V
	//       for å unngå at className blir "is-info is-flex is-align-items-centerbutton"
	if (Component === "button") className = ` button ${className}`;

	const iconProps: FontAwesomeIconProps = isFullProps(icon) ? icon : { icon };

	return (
		<Component
			className={`is-flex is-align-items-center ${fullWidth ? "is-fullwidth" : ""} ${className}`}
			style={style}
			{...rest}
		>
			<span className="icon">
				<FontAwesomeIcon {...iconProps} />
			</span>
			<span>{children}</span>
		</Component>
	);
};
