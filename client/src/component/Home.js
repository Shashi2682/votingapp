import React, { Component } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

// Components
import Navbar from "./Navbar/Navigation";
import NavbarAdmin from "./Navbar/NavigationAdmin";
import UserHome from "./UserHome";
import StartEnd from "./StartEnd";
import ElectionStatus from "./ElectionStatus";

// Contract
import getWeb3 from "../getWeb3";
import Election from "../contracts/Election";
// CSS
import "./Home.css";

export default class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ElectionInstance: undefined,
      account: null,
      web3: null,
      isAdmin: false,
      elStarted: false,
      elEnded: false,
      elDetails: {},
    };
  }

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      if (!web3) {
        alert("Failed to load web3. Make sure MetaMask is installed and connected.");
        return;
      }

      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];

      if (!deployedNetwork) {
        alert("Smart contract not deployed on the selected network.");
        return;
      }

      const instance = new web3.eth.Contract(Election.abi, deployedNetwork.address);

      this.setState({ web3, ElectionInstance: instance, account: accounts[0] });

      const admin = await instance.methods.admin().call();  // Get admin address
      this.setState({ isAdmin: this.state.account === admin });

      // Load Election Details
      const start = await instance.methods.getStart().call();
      const end = await instance.methods.getEnd().call();
      const electionDetails = await instance.methods.getElectionDetails(0).call();  // Assuming first election

      this.setState({
        elStarted: start,
        elEnded: end,
        elDetails: {
          adminName: electionDetails.adminName,
          adminEmail: electionDetails.adminEmail,
          adminTitle: electionDetails.adminTitle,
          electionTitle: electionDetails.electionTitle,
          organizationTitle: electionDetails.organizationTitle,
        },
      });
    } catch (error) {
      console.error("Error loading Web3, accounts, or contract:", error);
      alert("Failed to load Web3. Check console for details.");
    }
  };

  // End election and reset for new election
  endElection = async () => {
    await this.state.ElectionInstance.methods
      .endElection(0)  // Assuming first election
      .send({ from: this.state.account, gas: 1000000 });

    // Reset election data for the new election
    await this.state.ElectionInstance.methods
      .resetElection()
      .send({ from: this.state.account, gas: 1000000 });

    window.location.reload(); // Reload to reflect new state
  };

  // Register a new election
  registerElection = async (data) => {
    await this.state.ElectionInstance.methods
      .setElectionDetails(
        data.adminFName.toLowerCase() + " " + data.adminLName.toLowerCase(),
        data.adminEmail.toLowerCase(),
        data.adminTitle.toLowerCase(),
        data.electionTitle.toLowerCase(),
        data.organizationTitle.toLowerCase()
      )
      .send({ from: this.state.account, gas: 1000000 });
    window.location.reload();
  };

  render() {
    if (!this.state.web3) {
      return (
        <>
          <Navbar />
          <center>Loading Web3, accounts, and contract...</center>
        </>
      );
    }
    return (
      <>
        {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}
        <div className="container-main">
          <div className="container-item center-items info">
            Your Account: {this.state.account}
          </div>
          {!this.state.elStarted && !this.state.elEnded ? (
            <div className="container-item info">
              <center>
                <h3>The election has not been initialized.</h3>
                {this.state.isAdmin ? <p>Set up the election.</p> : <p>Please wait..</p>}
              </center>
            </div>
          ) : null}
        </div>

        {this.state.isAdmin ? (
          <>
            <this.renderAdminHome />
          </>
        ) : this.state.elStarted ? (
          <>
            <UserHome el={this.state.elDetails} />
          </>
        ) : this.state.elEnded ? (
          <>
            <div className="container-item attention">
              <center>
                <h3>The Election has ended.</h3>
                <br />
                <Link to="/Results" style={{ color: "black", textDecoration: "underline" }}>
                  See results
                </Link>
              </center>
            </div>
          </>
        ) : null}
      </>
    );
  }

  renderAdminHome = () => {
    const EMsg = (props) => {
      return <span style={{ color: "tomato" }}>{props.msg}</span>;
    };

    const AdminHome = () => {
      const { handleSubmit, register, formState: { errors } } = useForm();

      const onSubmit = (data) => {
        this.registerElection(data);
      };

      return (
        <div>
          <form onSubmit={handleSubmit(onSubmit)}>
            {!this.state.elStarted && !this.state.elEnded ? (
              <div className="container-main-admin">
                <div className="about-admin">
                  <h3>About Admin</h3>
                  <div className="container-item-admin">
                    <div>
                      <label className="label-home">
                        Full Name {errors.adminFName && <EMsg msg="*required" />}
                        <input
                          className="input-home"
                          type="text"
                          placeholder="First Name"
                          {...register("adminFName", { required: true })}
                        />
                        <input
                          className="input-home"
                          type="text"
                          placeholder="Last Name"
                          {...register("adminLName")}
                        />
                      </label>

                      <label className="label-home">
                        Email {errors.adminEmail && <EMsg msg={errors.adminEmail.message} />}
                        <input
                          className="input-home"
                          placeholder="eg. you@example.com"
                          name="adminEmail"
                          {...register("adminEmail", {
                            required: "*Required",
                            pattern: {
                              value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/,
                              message: "*Invalid",
                            },
                          })}
                        />
                      </label>

                      <label className="label-home">
                        Job Title or Position {errors.adminTitle && <EMsg msg="*required" />}
                        <input
                          className="input-home"
                          type="text"
                          placeholder="eg. HR Head "
                          {...register("adminTitle", { required: true })}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="about-election">
                  <h3>About Election</h3>
                  <div className="container-item-admin center-items">
                    <div>
                      <label className="label-home">
                        Election Title {errors.electionTitle && <EMsg msg="*required" />}
                        <input
                          className="input-home"
                          type="text"
                          placeholder="eg. School Election"
                          {...register("electionTitle", { required: true })}
                        />
                      </label>
                      <label className="label-home">
                        Organization Name {errors.organizationName && <EMsg msg="*required" />}
                        <input
                          className="input-home"
                          type="text"
                          placeholder="eg. Lifeline Academy"
                          {...register("organizationTitle", { required: true })}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : this.state.elStarted ? (
              <UserHome el={this.state.elDetails} />
            ) : null}
            <StartEnd
              elStarted={this.state.elStarted}
              elEnded={this.state.elEnded}
              endElFn={this.endElection}
            />
            <ElectionStatus elStarted={this.state.elStarted} elEnded={this.state.elEnded} />
          </form>
        </div>
      );
    };

    return <AdminHome />;
  };
}
