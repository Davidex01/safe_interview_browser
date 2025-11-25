import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import Container from "./Container.jsx";

function Section({ id, title, subtitle, children, className }) {
  return (
    <section id={id} className={clsx("ui-section", className)}>
      <Container>
        {title && <h2 className="ui-section__title">{title}</h2>}
        {subtitle && (
          <p className="ui-section__subtitle">{subtitle}</p>
        )}
        {children}
      </Container>
    </section>
  );
}

Section.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
};

export default Section;