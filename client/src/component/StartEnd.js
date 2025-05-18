import React from "react";
import { Link } from "react-router-dom";

const StartEnd = (props) => {
  const btn2 = {
    display: "block",
    padding: "21px",
    margin: "7px",
    minWidth: "max-content",
    textAlign: "center",
    width: "333px",
    alignSelf: "center",
  };

  return (
    <div>
      {!props.elStarted ? (
        <>
          {/* Display message to add candidates before starting */}
          {!props.elEnded ? (
            <>
              <div
                className="container-item attention"
                style={{ display: "block" }}
              >
                <h2>Add Candidates before Starting the Election</h2>
                <p>
                  Go to{" "}
                  <Link
                    title="Add a new candidate"
                    to="/addCandidate"
                    style={{
                      color: "black",
                      textDecoration: "underline",
                    }}
                  >
                    add candidates
                  </Link>{" "}
                  page.
                </p>
              </div>
              <div className="container-item-start">
                <button
                  type="submit"
                  onClick={props.startElFn} // Start election function
                >
                  Start Election {props.elEnded ? "Again" : null}
                </button>
              </div>
            </>
          ) : (
            <div className="container-item">
              <center>
                <p>Re-deploy the contract to start election again.</p>
              </center>
            </div>
          )}
          {props.elEnded ? (
            <div className="container-item">
              <center>
                <p>The election ended.</p>
              </center>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="container-item-start">
            <center>
              <p>The election has started.</p>
            </center>
          </div>
          <div className="container-item-start">
            <button
              type="button"
              onClick={props.endElFn} // Trigger end election function
            >
              End Election
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default StartEnd;
