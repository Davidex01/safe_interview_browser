import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

function Button({
  children,
  variant = "primary",
  as = "button",
  className,
  disabled = false,
  ...rest
}) {
  const Component = as;

  const isLink = Component === "a";

  return (
    <Component
      className={clsx(
        "ui-button",
        `ui-button--${variant}`,
        { "ui-button--disabled": disabled },
        className
      )}
      // Если это ссылка, не пробрасываем disabled атрибут
      {...(!isLink && { disabled })}
      {...rest}
    >
      {children}
    </Component>
  );
}

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(["primary", "secondary", "ghost"]),
  as: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

export default Button;