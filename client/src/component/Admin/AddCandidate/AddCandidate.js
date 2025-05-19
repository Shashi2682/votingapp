import React, { Component } from "react";
import Navbar from "../../Navbar/Navigation";
import NavbarAdmin from "../../Navbar/NavigationAdmin";
import AdminOnly from "../../AdminOnly";
import getWeb3 from "../../../getWeb3";
import Election from "../../../contracts/Election.sol";
import "./StartEnd.css";

export default class StartEnd extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ElectionInstance: undefined,
      web3: null,
      account: null,
      isAdmin: false,
      elStarted: false,
      elEnded: false,
      electionTitle: "",
    };
  }

  componentDidMount = async () => {
    if (!window.location.hash) {
      window.location = window.location + "#loaded";
      window.location.reload();
      return;
    }

    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];
      const instance = new web3.eth.Contract(
        Election.abi,
        deployedNetwork && deployedNetwork.address
      );

      this.setState({
        web3: web3,
        ElectionInstance: instance,
        account: accounts[0],
      });

      const admin = await instance.methods.admin().call();
      if (accounts[0].toLowerCase() === admin.toLowerCase()) {
        this.setState({ isAdmin: true });
      }

      const started = await instance.methods.getStart().call();
      const ended = await instance.methods.getEnd().call();
      const electionTitle = await instance.methods.getElectionDetails().call();

      this.setState({ elStarted: started, elEnded: ended, electionTitle });
    } catch (error) {
      alert("Failed to load web3, accounts, or contract.");
      console.error(error);
    }
  };

  startElection = async () => {
    const { ElectionInstance, account, elEnded } = this.state;

    if (elEnded) {
      // Automatically reset election if previously ended
      await ElectionInstance.methods
        .resetElection()
        .send({ from: account, gas: 1000000 });
    }

    await ElectionInstance.methods
      .setElectionDetails(
        "Election Title",      // Replace with actual dynamic inputs as needed
        "Admin Name",
        "admin@example.com",
        "Admin Title",
        "Organization Name"
      )
      .send({ from: account, gas: 1000000 });

    window.location.reload();
  };

  endElection = async () => {
    await this.state.ElectionInstance.methods
      .endElection()
      .send({ from: this.state.account, gas: 1000000 });

    window.location.reload();
  };

  render() {
    const {
      web3,
      isAdmin,
      elStarted,
      elEnded
    } = this.state;

    if (!web3) {
      return (
        <>
          {isAdmin ? <NavbarAdmin /> : <Navbar />}
          <center>Loading Web3, accounts, and contract...</center>
        </>
      );
    }

    if (!isAdmin) {
      return (
        <>
          <Navbar />
          <AdminOnly page="Start and end election page." />
        </>
      );
    }

    return (
      <>
        <NavbarAdmin />
        {!elStarted && !elEnded && (
          <div className="container-item info">
            <center>The election has never been initiated.</center>
          </div>
        )}

        <div className="container-main">
          <h3>Start or end election</h3>

          {!elStarted ? (
            <>
              <div className="container-item">
                <button onClick={this.startElection} className="start-btn">
                  Start {elEnded ? "Again" : ""}
                </button>
              </div>
              {elEnded && (
                <div className="container-item">
                  <center>
                    <p>The election ended.</p>
                  </center>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="container-item">
                <center>
                  <p>The election started.</p>
                </center>
              </div>
              <div className="container-item">
                <button onClick={this.endElection} className="start-btn">
                  End
                </button>
              </div>
            </>
          )}

          <div className="election-status">
            <p>Started: {elStarted ? "True" : "False"}</p>
            <p>Ended: {elEnded ? "True" : "False"}</p>
          </div>
        </div>
      </>
    );
  }
}
