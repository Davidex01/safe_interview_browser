import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

function Container({ className, children }) {
  return (
    <div className={clsx("ui-container", className)}>
      {children}
    </div>
  );
}

Container.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

export default Container;