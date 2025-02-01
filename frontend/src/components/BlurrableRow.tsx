import Row from "react-bootstrap/Row";
import styled from "styled-components";

interface BlurrableRowProps {
  disabled?: boolean;
}

export const BlurrableRow = styled(Row)<BlurrableRowProps>`
  filter: ${(props) => (props.disabled === true ? "blur(8px)" : undefined)};
  pointer-events: ${(props) => (props.disabled === true ? "none" : undefined)};
`;
