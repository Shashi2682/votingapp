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
      candidateCount: 0,
      candidates: [],
      isElStarted: false,
      isElEnded: false,
    };
  }

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];

      if (!deployedNetwork) {
        alert("Smart contract not deployed to the current network.");
        return;
      }

      const instance = new web3.eth.Contract(
        Election.abi,
        deployedNetwork.address
      );

      // Set web3, account, contract
      this.setState({
        web3,
        ElectionInstance: instance,
        account: accounts[0],
      });

      // Check admin
      const admin = await instance.methods.admin().call();
      if (accounts[0].toLowerCase() === admin.toLowerCase()) {
        this.setState({ isAdmin: true });
      }

      // Listen to ElectionEnded
      instance.events
        .ElectionEnded({})
        .on("data", (event) => {
          const { electionTitle, candidateAddrs, voteCounts, winner } =
            event.returnValues;

          const result = candidateAddrs.map((addr, i) => ({
            id: i,
            address: addr,
            header: `Candidate ${i + 1}`,
            slogan: "N/A",
            voteCount: voteCounts[i],
          }));

          localStorage.setItem("electionResults", JSON.stringify(result));
          localStorage.setItem("electionWinner", winner);
        })
        .on("error", (err) => console.error("ElectionEnded Event Error", err));

      // Check election status
      const isStarted = await instance.methods.getStart().call();
      const isEnded = await instance.methods.getEnd().call();

      const candidateCount = await instance.methods.getTotalCandidate().call();

      this.setState({
        isElStarted: isStarted,
        isElEnded: isEnded,
        candidateCount,
      });

      // Load candidates
      let candidates = [];
      if (isEnded) {
        const storedResults = localStorage.getItem("electionResults");
        if (storedResults) {
          candidates = JSON.parse(storedResults);
        }
      } else {
        for (let i = 0; i < candidateCount; i++) {
          const candidate = await instance.methods
            .candidateDetails(i)
            .call();
          candidates.push({
            id: candidate.candidateId,
            header: candidate.header,
            slogan: candidate.slogan,
            voteCount: candidate.voteCount,
          });
        }
      }

      this.setState({ candidates });
    } catch (error) {
      alert("Failed to load web3 or contract.");
      console.error(error);
    }
  };

  render() {
    const {
      web3,
      isAdmin,
      isElStarted,
      isElEnded,
      candidates,
    } = this.state;

    if (!web3) {
      return (
        <>
          {isAdmin ? <NavbarAdmin /> : <Navbar />}
          <center>Loading Web3, accounts, and contract...</center>
        </>
      );
    }

    return (
      <>
        {isAdmin ? <NavbarAdmin /> : <Navbar />}
        <br />
        <div>
          {!isElStarted && !isElEnded ? (
            <NotInit />
          ) : isElStarted && !isElEnded ? (
            <div className="container-item attention">
              <center>
                <h3>The election is being conducted at the moment.</h3>
                <p>The result will be displayed once the election has ended.</p>
                <p>Go ahead and cast your vote (if not already).</p>
                <br />
                <Link
                  to="/Voting"
                  style={{ color: "black", textDecoration: "underline" }}
                >
                  Voting Page
                </Link>
              </center>
            </div>
          ) : isElEnded ? (
            displayResults(candidates)
          ) : null}
        </div>
      </>
    );
  }
}

// WINNER DISPLAY FUNCTION
function displayWinner(candidates) {
  const maxVotes = Math.max(...candidates.map((c) => parseInt(c.voteCount)));
  const winners = candidates.filter(
    (c) => parseInt(c.voteCount) === maxVotes
  );

  return (
    <>
      {winners.map((winner) => (
        <div className="container-winner" key={winner.id}>
          <div className="winner-info">
            <p className="winner-tag">Winner!</p>
            <h2>{winner.header}</h2>
            <p className="winner-slogan">{winner.slogan}</p>
            {winner.address && (
              <p>
                <strong>Address:</strong> {winner.address}
              </p>
            )}
          </div>
          <div className="winner-votes">
            <div className="votes-tag">Total Votes:</div>
            <div className="vote-count">{winner.voteCount}</div>
          </div>
        </div>
      ))}
    </>
  );
}

// RESULTS DISPLAY FUNCTION
export function displayResults(candidates) {
  return (
    <>
      {candidates.length > 0 && (
        <div className="container-main">{displayWinner(candidates)}</div>
      )}
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
                <tbody>
                  {candidates.map((candidate) => (
                    <tr key={candidate.id}>
                      <td>{candidate.id}</td>
                      <td>{candidate.header}</td>
                      <td>{candidate.voteCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="container-item"
              style={{ border: "1px solid black" }}
            >
              <center>That is all.</center>
            </div>
          </>
        )}
      </div>
    </>
  );
}
