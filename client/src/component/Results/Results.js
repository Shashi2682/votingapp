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
      electionTitle: "",
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

      // Listen to ElectionResult event
      instance.events
        .ElectionResult({})
        .on("data", (event) => {
          const {
            electionTitle,
            candidateAddresses,
            headers,
            voteCounts,
            winnerId,
          } = event.returnValues;

          // Map candidates and parse votes
          const result = candidateAddresses.map((addr, i) => ({
            id: i,
            address: addr,
            header: headers && headers[i] ? headers[i] : `Candidate ${i + 1}`,
            slogan: "N/A", // If you have slogans on-chain, fetch them properly
            voteCount: parseInt(voteCounts[i]),
          }));

          // Save results in localStorage (optional)
          localStorage.setItem("electionResults", JSON.stringify(result));
          localStorage.setItem("electionWinnerId", winnerId);
          localStorage.setItem("electionTitle", electionTitle);

          // Update state with new data
          this.setState({
            candidates: result,
            isElEnded: true,
            electionTitle,
          });
        })
        .on("error", (err) => console.error("ElectionResult Event Error", err));

      // Check election status
      const isStarted = await instance.methods.getStart().call();
      const isEnded = await instance.methods.getEnd().call();
      const candidateCount = await instance.methods.getTotalCandidate().call();

      this.setState({
        isElStarted: isStarted,
        isElEnded: isEnded,
        candidateCount,
      });

      // Load candidates on mount
      let candidates = [];
      if (isEnded) {
        // Load from localStorage if available
        const storedResults = localStorage.getItem("electionResults");
        const storedTitle = localStorage.getItem("electionTitle");
        if (storedResults) {
          candidates = JSON.parse(storedResults);
          this.setState({ electionTitle: storedTitle || "" });
        }
      } else {
        for (let i = 0; i < candidateCount; i++) {
          const candidate = await instance.methods.candidateDetails(i).call();
          candidates.push({
            id: parseInt(candidate.candidateId),
            header: candidate.header,
            slogan: candidate.slogan,
            voteCount: parseInt(candidate.voteCount),
            address: candidate.candidateAddress || null,
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
      electionTitle,
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
            displayResults(candidates, electionTitle)
          ) : null}
        </div>
      </>
    );
  }
}

// WINNER DISPLAY FUNCTION
function displayWinner(candidates) {
  if (candidates.length === 0) return null;

  const maxVotes = Math.max(...candidates.map((c) => c.voteCount));
  const winners = candidates.filter((c) => c.voteCount === maxVotes);

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
export function displayResults(candidates, electionTitle) {
  return (
    <>
      <div className="container-main">
        <h2>{electionTitle || "Election Results"}</h2>
        {candidates.length > 0 ? (
          displayWinner(candidates)
        ) : (
          <p>No candidates found.</p>
        )}
      </div>
      <div className="container-main" style={{ borderTop: "1px solid" }}>
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
