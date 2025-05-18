import React from "react";

const ElectionStatus = (props) => {
  return (
    <div className="container-main-status">
      <h3>Election Status</h3>
      <div>
        <p>Started: {props.elStarted ? "True" : "False"}</p>
        <p>Ended: {props.elEnded ? "True" : "False"}</p>
      </div>
      <div className="container-item-status" />
    </div>
  );
};

export default ElectionStatus;
