// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

contract Election {
    address public admin;
    bool public start;
    bool public end;

    constructor(address _admin) {
        admin = _admin;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    struct Candidate {
        uint256 candidateId;
        string header;
        string slogan;
        uint256 voteCount;
    }

    struct Voter {
        bool hasVoted;
        bool isVerified;
        bool isRegistered;
    }

    struct ElectionDetails {
        string electionTitle;
        string adminName;
        string adminEmail;
        string adminTitle;
        string organizationTitle;
        bool isActive;
    }

    ElectionDetails public currentElection;

    mapping(uint256 => Candidate) public candidateDetails;
    uint256 public candidateCount;

    mapping(address => Voter) public voterDetails;
    address[] public voters;

    /// 🧾 Event to store election result for frontend (off-chain)
    event ElectionResult(
        string electionTitle,
        address[] candidateAddresses,
        string[] headers,
        uint256[] voteCounts,
        uint256 winnerId
    );

    /// 📌 Set up a new election
    function setElectionDetails(
        string memory _electionTitle,
        string memory _adminName,
        string memory _adminEmail,
        string memory _adminTitle,
        string memory _organizationTitle
    ) public onlyAdmin {
        require(!start, "Election already in progress");
        currentElection = ElectionDetails({
            electionTitle: _electionTitle,
            adminName: _adminName,
            adminEmail: _adminEmail,
            adminTitle: _adminTitle,
            organizationTitle: _organizationTitle,
            isActive: true
        });
        start = true;
        end = false;
    }

    function getElectionDetails() public view returns (
        string memory, string memory, string memory, string memory, string memory, bool
    ) {
        return (
            currentElection.electionTitle,
            currentElection.adminName,
            currentElection.adminEmail,
            currentElection.adminTitle,
            currentElection.organizationTitle,
            currentElection.isActive
        );
    }

    function addCandidate(string memory _header, string memory _slogan) public onlyAdmin {
        require(start, "Election not started");
        candidateDetails[candidateCount] = Candidate({
            candidateId: candidateCount,
            header: _header,
            slogan: _slogan,
            voteCount: 0
        });
        candidateCount++;
    }

    function registerAsVoter(string memory, string memory) public {
        require(!voterDetails[msg.sender].isRegistered, "Already registered");
        voterDetails[msg.sender] = Voter({
            hasVoted: false,
            isVerified: false,
            isRegistered: true
        });
        voters.push(msg.sender);
    }

    function verifyVoter(bool _status, address voterAddr) public onlyAdmin {
        require(voterDetails[voterAddr].isRegistered, "Not registered");
        voterDetails[voterAddr].isVerified = _status;
    }

    function vote(uint256 candidateId) public {
        require(start && !end, "Voting not allowed now");
        Voter storage voter = voterDetails[msg.sender];
        require(voter.isVerified, "Not verified");
        require(!voter.hasVoted, "Already voted");
        candidateDetails[candidateId].voteCount++;
        voter.hasVoted = true;
    }

    function endElection() public onlyAdmin {
        require(start, "Election not started");
        end = true;
        start = false;
        currentElection.isActive = false;

        address[] memory candidateAddresses = new address[](candidateCount);
        string[] memory headers = new string[](candidateCount);
        uint256[] memory votes = new uint256[](candidateCount);

        uint256 winnerId = 0;
        uint256 maxVotes = 0;

        for (uint256 i = 0; i < candidateCount; i++) {
            headers[i] = candidateDetails[i].header;
            votes[i] = candidateDetails[i].voteCount;
            if (candidateDetails[i].voteCount > maxVotes) {
                maxVotes = candidateDetails[i].voteCount;
                winnerId = i;
            }
        }

        emit ElectionResult(
            currentElection.electionTitle,
            candidateAddresses, // Can be removed or replaced with candidateIds
            headers,
            votes,
            winnerId
        );
    }

    function resetElection() public onlyAdmin {
        require(end, "Election must end first");

        // Delete candidates
        for (uint256 i = 0; i < candidateCount; i++) {
            delete candidateDetails[i];
        }
        candidateCount = 0;

        // Delete voters
        for (uint256 i = 0; i < voters.length; i++) {
            delete voterDetails[voters[i]];
        }
        delete voters;

        start = false;
        end = false;
        delete currentElection;
    }

    function getTotalCandidates() public view returns (uint256) {
        return candidateCount;
    }

    function getTotalVoters() public view returns (uint256) {
        return voters.length;
    }

    function getStart() public view returns (bool) {
        return start;
    }

    function getEnd() public view returns (bool) {
        return end;
    }
}
