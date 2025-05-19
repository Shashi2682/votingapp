import React, { Component } from "react";
import Navbar from "../../Navbar/Navigation";
import NavbarAdmin from "../../Navbar/NavigationAdmin";
import getWeb3 from "../../../getWeb3";
import Election from "../../../contracts/Election.json";
import AdminOnly from "../../AdminOnly";
import "./AddCandidate.css";

export default class AddCandidate extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ElectionInstance: undefined,
      web3: null,
      accounts: null,
      isAdmin: false,
      header: "",
      slogan: "",
      candidates: [],
      candidateCount: 0,
    };
  }

  componentDidMount = async () => {
    // Refresh page only once
    if (!window.location.hash) {
      window.location = window.location + "#loaded";
      window.location.reload();
    }

    try {
      // Get network provider and web3 instance
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];
      const instance = new web3.eth.Contract(
        Election.abi,
        deployedNetwork && deployedNetwork.address
      );

      // Set web3, accounts, and contract to state, and then interact with the contract
      this.setState({
        web3: web3,
        ElectionInstance: instance,
        account: accounts[0],
      });

      // Hardcode the admin address here
      const adminAddress = "0xEF3F529f5b7474c167336c14f211329174c0Ea04";  // Replace with the actual admin address

      // Check if the current account is the admin
      if (this.state.account.toLowerCase() === adminAddress.toLowerCase()) {
        this.setState({ isAdmin: true });
      }

      // Fetch total candidates and their details
      const candidateCount = await instance.methods.getTotalCandidates().call(); // Updated method name
      this.setState({ candidateCount: candidateCount });

      let candidates = [];
      for (let i = 0; i < candidateCount; i++) {
        const candidate = await instance.methods.candidateDetails(i).call();
        console.log("Fetched candidate:", candidate);  // Debugging
        candidates.push({
          id: candidate.candidateId,
          header: candidate.header,
          slogan: candidate.slogan,
        });
      }
      this.setState({ candidates });

    } catch (error) {
      console.error(error);
      alert("Failed to load web3, accounts, or contract. Check console for details.");
    }
  };

  updateHeader = (event) => {
    this.setState({ header: event.target.value });
  };

  updateSlogan = (event) => {
    this.setState({ slogan: event.target.value });
  };

  addCandidate = async () => {
    const { header, slogan, account, ElectionInstance } = this.state;
    await ElectionInstance.methods
      .addCandidate(header, slogan)
      .send({ from: account, gas: 1000000 });

    // Update the state without reloading the page
    const candidateCount = await ElectionInstance.methods.getTotalCandidate().call(); // Updated method name
    this.setState({ candidateCount });

    let candidates = [];
    for (let i = 0; i < candidateCount; i++) {
      const candidate = await ElectionInstance.methods.candidateDetails(i).call();
      candidates.push({
        id: candidate.candidateId,
        header: candidate.header,
        slogan: candidate.slogan,
      });
    }
    this.setState({ candidates });
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
          <AdminOnly page="Add Candidate Page." />
        </>
      );
    }

    return (
      <>
        <NavbarAdmin />
        <div className="container-main">
          <h2>Add a new candidate</h2>
          <small>Total candidates: {this.state.candidateCount}</small>
          <div className="container-item">
            <form className="form">
              <label className={"label-ac"}>
                Header
                <input
                  className={"input-ac"}
                  type="text"
                  placeholder="eg. Marcus"
                  value={this.state.header}
                  onChange={this.updateHeader}
                />
              </label>
              <label className={"label-ac"}>
                Slogan
                <input
                  className={"input-ac"}
                  type="text"
                  placeholder="eg. It is what it is"
                  value={this.state.slogan}
                  onChange={this.updateSlogan}
                />
              </label>
              <button
                className="btn-add"
                disabled={this.state.header.length < 3 || this.state.header.length > 21}
                onClick={this.addCandidate}
              >
                Add
              </button>
            </form>
          </div>
        </div>
        {this.loadAdded(this.state.candidates)}
      </>
    );
  }

  loadAdded(candidates) {
    const renderAdded = (candidate) => {
      return (
        <div className="container-list success" key={candidate.id}>
          <div style={{ maxHeight: "21px", overflow: "auto" }}>
            {candidate.id}. <strong>{candidate.header}</strong>: {candidate.slogan}
          </div>
        </div>
      );
    };
    return (
      <div className="container-main" style={{ borderTop: "1px solid" }}>
        <div className="container-item info">
          <center>Candidates List</center>
        </div>
        {candidates.length < 1 ? (
          <div className="container-item alert">
            <center>No candidates added.</center>
          </div>
        ) : (
          <div
            className="container-item"
            style={{ display: "block", backgroundColor: "#DDFFFF" }}
          >
            {candidates.map(renderAdded)}
          </div>
        )}
      </div>
    );
  }
}
