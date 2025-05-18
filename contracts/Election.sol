// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

contract Election {
    address public admin;
    uint256 public candidateCount;
    uint256 public voterCount;
    bool public start;
    bool public end;

    // Constructor that sets the predefined admin address
    constructor(address _admin) {
        admin = _admin;
        candidateCount = 0;
        voterCount = 0;
        start = false;
        end = false;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only the admin can perform this action.");
        _;
    }

    struct Candidate {
        uint256 candidateId;
        string header;
        string slogan;
        uint256 voteCount;
    }

    mapping(uint256 => Candidate) public candidateDetails;

    // Add a candidate
    function addCandidate(string memory _header, string memory _slogan) public onlyAdmin {
        require(start == true, "Election not started.");
        Candidate memory newCandidate = Candidate({
            candidateId: candidateCount,
            header: _header,
            slogan: _slogan,
            voteCount: 0
        });
        candidateDetails[candidateCount] = newCandidate;
        candidateCount += 1;
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

    // Set the election details
    function setElectionDetails(
        string memory _electionTitle,
        string memory _adminName,
        string memory _adminEmail,
        string memory _adminTitle,
        string memory _organizationTitle
    ) public onlyAdmin {
        require(!start, "An election is already in progress.");
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

    // Get the election details
    function getElectionDetails() public view returns (string memory, string memory, string memory, string memory, string memory, bool) {
        return (
            currentElection.electionTitle,
            currentElection.adminName,
            currentElection.adminEmail,
            currentElection.adminTitle,
            currentElection.organizationTitle,
            currentElection.isActive
        );
    }

    function getTotalCandidates() public view returns (uint256) {
        return candidateCount;
    }

    function getTotalVoters() public view returns (uint256) {
        return voterCount;
    }

    struct Voter {
        address voterAddress;
        string name;
        string phone;
        bool isVerified;
        bool hasVoted;
        bool isRegistered;
    }

    address[] public voters;
    mapping(address => Voter) public voterDetails;

    // Register as a voter
    function registerAsVoter(string memory _name, string memory _phone) public {
        require(voterDetails[msg.sender].isRegistered == false, "You are already registered.");

        Voter memory newVoter = Voter({
            voterAddress: msg.sender,
            name: _name,
            phone: _phone,
            hasVoted: false,
            isVerified: false,
            isRegistered: true
        });
        voterDetails[msg.sender] = newVoter;
        voters.push(msg.sender);
        voterCount += 1;
    }

    // Verify a voter
    function verifyVoter(bool _verifiedStatus, address voterAddress) public onlyAdmin {
        voterDetails[voterAddress].isVerified = _verifiedStatus;
    }

    // Vote for a candidate
    function vote(uint256 candidateId) public {
        require(voterDetails[msg.sender].hasVoted == false, "Already voted");
        require(voterDetails[msg.sender].isVerified == true, "Not verified");
        require(start == true, "Election not started");
        require(end == false, "Election ended");

        candidateDetails[candidateId].voteCount += 1;
        voterDetails[msg.sender].hasVoted = true;
    }

    // End the election
    function endElection() public onlyAdmin {
        require(start == true, "Election not started");
        end = true;
        start = false;
        currentElection.isActive = false;
    }

    // Reset election for new cycle (only after ending the election and showing results)
    function resetElection() public onlyAdmin {
        require(end == true, "Election has not ended yet");

        // Reset vote counts but keep candidates
        for (uint256 i = 0; i < candidateCount; i++) {
            candidateDetails[i].voteCount = 0;  // Reset the vote count for candidates
        }

        // Reset voters' data for new election
        delete voters;
        voterCount = 0;

        // Reset election status
        start = false;
        end = false;
        currentElection.isActive = false;
    }

    // Get if the election has started
    function getStart() public view returns (bool) {
        return start;
    }

    // Get if the election has ended
    function getEnd() public view returns (bool) {
        return end;
    }
}
