import React, { Component } from "react";

// Components
import Navbar from "../../Navbar/Navigation";
import NavbarAdmin from "../../Navbar/NavigationAdmin";
import AdminOnly from "../../AdminOnly";

// CSS
import "./Verification.css";

// Contract
import getWeb3 from "../../../getWeb3";
import Election from "../../../contracts/Election.json";

export default class Registration extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ElectionInstance: undefined,
      account: null,
      web3: null,
      isAdmin: false,
      voterCount: undefined,
      voters: [],
    };
  }

  // refreshing once
  componentDidMount = async () => {
    if (!window.location.hash) {
      window.location = window.location + "#loaded";
      window.location.reload();
    }
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];
      const instance = new web3.eth.Contract(
        Election.abi,
        deployedNetwork && deployedNetwork.address
      );

      // Set web3, accounts, and contract to state
      this.setState({ web3, ElectionInstance: instance, account: accounts[0] });

      // Admin account and verification
      const admin = await instance.methods.admin().call();
      console.log("Admin Address from Contract:", admin);
      console.log("Current Account:", this.state.account);
      
      // Ensure comparison is case-insensitive
      if (this.state.account.toLowerCase() === admin.toLowerCase()) {
        this.setState({ isAdmin: true });
      }

      // Total number of voters
      const voterCount = await instance.methods.getTotalVoters().call();
      this.setState({ voterCount: voterCount });

      // Loading all the voters
      let voters = [];
      for (let i = 0; i < this.state.voterCount; i++) {
        const voterAddress = await instance.methods.voters(i).call();
        const voter = await instance.methods.voterDetails(voterAddress).call();
        voters.push({
  address: voterAddress,
  name: voter.name,
  phone: voter.phone,
  hasVoted: voter.hasVoted,
  isVerified: voter.isVerified,
  isRegistered: voter.isRegistered,
});
      }
      this.setState({ voters: voters });

    } catch (error) {
      console.error("Error occurred while loading Web3, accounts, or contract:", error);
      alert(`Failed to load web3, accounts, or contract. Check console for details.`);
    }
  };

  renderUnverifiedVoters = (voter) => {
    const verifyVoter = async (verifiedStatus, address) => {
      await this.state.ElectionInstance.methods
        .verifyVoter(verifiedStatus, address)
        .send({ from: this.state.account, gas: 1000000 });
      window.location.reload();
    };

    return (
      <>
        {voter.isVerified ? (
          <div className="container-list success">
            <p style={{ margin: "7px 0px" }}>AC: {voter.address}</p>
            <table>
              <tbody>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Voted</th>
                </tr>
                <tr>
                  <td>{voter.name}</td>
                  <td>{voter.phone}</td>
                  <td>{voter.hasVoted ? "True" : "False"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}
        <div
          className="container-list attention"
          style={{ display: voter.isVerified ? "none" : null }}
        >
          <table>
            <tbody>
              <tr>
                <th>Account address</th>
                <td>{voter.address}</td>
              </tr>
              <tr>
                <th>Name</th>
                <td>{voter.name}</td>
              </tr>
              <tr>
                <th>Phone</th>
                <td>{voter.phone}</td>
              </tr>
              <tr>
                <th>Voted</th>
                <td>{voter.hasVoted ? "True" : "False"}</td>
              </tr>
              <tr>
                <th>Verified</th>
                <td>{voter.isVerified ? "True" : "False"}</td>
              </tr>
              <tr>
                <th>Registered</th>
                <td>{voter.isRegistered ? "True" : "False"}</td>
              </tr>
            </tbody>
          </table>
          <div style={{}}>
            <button
              className="btn-verification approve"
              disabled={voter.isVerified}
              onClick={() => verifyVoter(true, voter.address)}
            >
              Approve
            </button>
          </div>
        </div>
      </>
    );
  };

  render() {
    if (!this.state.web3) {
      return (
        <>
          {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}
          <center>Loading Web3, accounts, and contract...</center>
        </>
      );
    }

    if (!this.state.isAdmin) {
      return (
        <>
          <Navbar />
          <AdminOnly page="Verification Page." />
        </>
      );
    }

    return (
      <>
        <NavbarAdmin />
        <div className="container-main">
          <h3>Verification</h3>
          <small>Total Voters: {this.state.voters.length}</small>
          {this.state.voters.length < 1 ? (
            <div className="container-item info">None has registered yet.</div>
          ) : (
            <>
              <div className="container-item info">
                <center>List of registered voters</center>
              </div>
              {this.state.voters.map(this.renderUnverifiedVoters)}
            </>
          )}
        </div>
      </>
    );
  }
}
