import React from "react";

function UserHome(props) {
  return (
    <div>
      <h1>Election:</h1>
      <div className="container-main-election">
        <div className="container-list-election title">
          <h1>Title: {props.el.electionTitle}</h1>
          <br />

          <h2>
            <center>Organization: {props.el.organizationTitle} </center>
          </h2>

          <table style={{ marginTop: "20px" }}>
            <tr>
              <th>admin</th>
              <td>
                {props.el.adminName} ({props.el.adminTitle})
              </td>
            </tr>
            <tr>
              <th>contact</th>
              <td style={{ textTransform: "none" }}>{props.el.adminEmail}</td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserHome;
