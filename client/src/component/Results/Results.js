import React, { Component } from "react";
import { Link } from "react-router-dom";

// Components
import Navbar from "../Navbar/Navigation";
import NavbarAdmin from "../Navbar/NavigationAdmin";
import NotInit from "../NotInit";

// Contract
import getWeb3 from "../../getWeb3";
import Election from "../../contracts/Election.json";

// CSS
import "./Results.css";

export default class Result extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ElectionInstance: undefined,
      account: null,
      web3: null,
      isAdmin: false,
      candidateCount: undefined,
      candidates: [],
      isElStarted: false,
      isElEnded: false,
    };
  }

  componentDidMount = async () => {
    // Refreshing the page only once
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

      // Listen to ElectionEnded event and save results to localStorage
      instance.events
        .ElectionEnded({})
        .on("data", (event) => {
          const { electionTitle, candidateAddrs, voteCounts, winner } = event.returnValues;

          const result = candidateAddrs.map((addr, i) => ({
            id: i,
            address: addr,
            header: "Candidate " + (i + 1), // You can customize this if you have names stored elsewhere
            slogan: "N/A",                  // Same here
            voteCount: voteCounts[i],
          }));

          localStorage.setItem("electionResults", JSON.stringify(result));
          localStorage.setItem("electionWinner", winner);
        })
        .on("error", (error) => {
          console.error("Error in ElectionEnded event:", error);
        });

      // Set web3, accounts, and contract to the state
      this.setState({ web3, ElectionInstance: instance, account: accounts[0] });

      // Get total number of candidates
      const candidateCount = await instance.methods.getTotalCandidate().call();
      this.setState({ candidateCount: candidateCount });

      // Get start and end values
      const start = await instance.methods.getStart().call();
      this.setState({ isElStarted: start });
      const end = await instance.methods.getEnd().call();
      this.setState({ isElEnded: end });

      // Load candidates details
      let candidates = [];
      if (end) {
        // Election ended, load from localStorage
        const storedResults = localStorage.getItem("electionResults");
        if (storedResults) {
          candidates = JSON.parse(storedResults);
        }
      } else {
        // Election ongoing or not started, load from contract
        for (let i = 0; i < candidateCount; i++) {
          const candidate = await instance.methods.candidateDetails(i).call();
          candidates.push({
            id: candidate.candidateId,
            header: candidate.header,
            slogan: candidate.slogan,
            voteCount: candidate.voteCount,
          });
        }
      }
      this.setState({ candidates });

      // Admin account and verification
      const admin = await instance.methods.admin().call();
      if (this.state.account.toLowerCase() === admin.toLowerCase()) {
        this.setState({ isAdmin: true });
      }
    } catch (error) {
      // Catch any errors
      alert(`Failed to load web3, accounts, or contract. Check console for details.`);
      console.error(error);
    }
  };

  render() {
    // Check if web3 is available
    if (!this.state.web3) {
      return (
        <>
          {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}
          <center>Loading Web3, accounts, and contract...</center>
        </>
      );
    }

    return (
      <>
        {this.state.isAdmin ? <NavbarAdmin /> : <Navbar />}
        <br />
        <div>
          {!this.state.isElStarted && !this.state.isElEnded ? (
            <NotInit />
          ) : this.state.isElStarted && !this.state.isElEnded ? (
            <div className="container-item attention">
              <center>
                <h3>The election is being conducted at the moment.</h3>
                <p>Result will be displayed once the election has ended.</p>
                <p>Go ahead and cast your vote {"(if not already)"}.</p>
                <br />
                <Link to="/Voting" style={{ color: "black", textDecoration: "underline" }}>
                  Voting Page
                </Link>
              </center>
            </div>
          ) : this.state.isElEnded ? (
            displayResults(this.state.candidates)
          ) : null}
        </div>
      </>
    );
  }
}

function displayWinner(candidates) {
  const getWinner = (candidates) => {
    let maxVoteReceived = 0;
    let winnerCandidate = [];
    for (let i = 0; i < candidates.length; i++) {
      if (parseInt(candidates[i].voteCount) > maxVoteReceived) {
        maxVoteReceived = parseInt(candidates[i].voteCount);
        winnerCandidate = [candidates[i]];
      } else if (parseInt(candidates[i].voteCount) === maxVoteReceived) {
        winnerCandidate.push(candidates[i]);
      }
    }
    return winnerCandidate;
  };

  const renderWinner = (winner) => {
    return (
      <div className="container-winner" key={winner.id}>
        <div className="winner-info">
          <p className="winner-tag">Winner!</p>
          <h2>{winner.header}</h2>
          <p className="winner-slogan">{winner.slogan}</p>
          <p><strong>Address:</strong> {winner.address}</p>
        </div>
        <div className="winner-votes">
          <div className="votes-tag">Total Votes:</div>
          <div className="vote-count">{winner.voteCount}</div>
        </div>
      </div>
    );
  };

  const winnerCandidate = getWinner(candidates);
  return <>{winnerCandidate.map(renderWinner)}</>;
}

export function displayResults(candidates) {
  const renderResults = (candidate) => {
    return (
      <tr key={candidate.id}>
        <td>{candidate.id}</td>
        <td>{candidate.header}</td>
        <td>{candidate.voteCount}</td>
      </tr>
    );
  };

  return (
    <>
      {candidates.length > 0 ? (
        <div className="container-main">{displayWinner(candidates)}</div>
      ) : null}
      <div className="container-main" style={{ borderTop: "1px solid" }}>
        <h2>Results</h2>
        <small>Total candidates: {candidates.length}</small>
        {candidates.length < 1 ? (
          <div className="container-item attention">
            <center>No candidates.</center>
          </div>
        ) : (
          <>
            <div className="container-item">
              <table>
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Candidate</th>
                    <th>Votes</th>
                  </tr>
                </thead>
                <tbody>{candidates.map(renderResults)}</tbody>
              </table>
            </div>
            <div className="container-item" style={{ border: "1px solid black" }}>
              <center>That is all.</center>
            </div>
          </>
        )}
      </div>
    </>
  );
}
