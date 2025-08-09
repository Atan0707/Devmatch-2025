//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * A smart contract for streaming content donations
 * Allows content creators to register their streaming URLs and receive donations
 * @author Pisa
 */
contract PisangContract is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // State Variables
    address public immutable contractOwner;
    uint256 public totalContents = 0;
    uint256 public totalDonations = 0;
    uint256 public platformFee = 250; // 2.5% (in basis points)
    
    // Token support
    mapping(address => bool) public supportedTokens;
    mapping(address => string) public tokenSymbols;
    address[] public supportedTokenList;
    
    // Structs
    struct Content {
        string url;
        address owner;
        uint256 totalDonationsReceived;
        uint256 donationCount;
        bool isActive;
        uint256 createdAt;
    }
    
    struct Donation {
        address donor;
        address contentOwner;
        uint256 amount;
        uint256 timestamp;
        string contentUrl;
        address token; // address(0) for ETH, token address for ERC20
    }
    
    // Mappings
    mapping(string => Content) public contents; // url => Content
    mapping(address => string[]) public creatorContents; // creator => urls[]
    mapping(address => mapping(address => uint256)) public creatorEarnings; // creator => token => total earnings
    mapping(address => mapping(address => uint256)) public donorTotalDonations; // donor => token => total donated
    mapping(uint256 => Donation) public donations; // donation ID => Donation
    mapping(string => uint256[]) public contentDonations; // url => donation IDs[]
    
    // Events
    event ContentRegistered(
        string indexed url, 
        address indexed owner, 
        uint256 timestamp
    );
    
    event DonationMade(
        address indexed donor,
        address indexed contentOwner,
        string indexed contentUrl,
        uint256 amount,
        uint256 donationId,
        uint256 timestamp,
        address token
    );
    
    event ContentDeactivated(string indexed url, address indexed owner);
    event ContentReactivated(string indexed url, address indexed owner);
    event WithdrawalMade(address indexed creator, uint256 amount, address token);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event TokenAdded(address indexed token, string symbol);
    event TokenRemoved(address indexed token);
    
    // Modifiers
    modifier onlyContractOwner() {
        require(msg.sender == contractOwner, "Not the contract owner");
        _;
    }
    
    modifier onlyContentOwner(string memory _url) {
        require(contents[_url].owner == msg.sender, "Not the content owner");
        _;
    }
    
    modifier contentExists(string memory _url) {
        require(bytes(contents[_url].url).length > 0, "Content does not exist");
        _;
    }
    
    modifier contentActive(string memory _url) {
        require(contents[_url].isActive, "Content is not active");
        _;
    }
    
    // Constructor
    constructor(address _contractOwner) {
        contractOwner = _contractOwner;
    }
    
    /**
     * Register a new streaming content URL
     * @param _url The streaming content URL
     */
    function registerContent(string memory _url) public {
        require(bytes(_url).length > 0, "URL cannot be empty");
        require(bytes(contents[_url].url).length == 0, "Content already registered");
        
        contents[_url] = Content({
            url: _url,
            owner: msg.sender,
            totalDonationsReceived: 0,
            donationCount: 0,
            isActive: true,
            createdAt: block.timestamp
        });
        
        creatorContents[msg.sender].push(_url);
        totalContents++;
        
        emit ContentRegistered(_url, msg.sender, block.timestamp);
    }
    
    /**
     * Donate to a specific content
     * @param _url The content URL to donate to
     */
    function donateToContent(string memory _url) 
        public 
        payable 
        contentExists(_url) 
        contentActive(_url) 
    {
        require(msg.value > 0, "Donation amount must be greater than 0");
        
        Content storage content = contents[_url];
        
        // Calculate platform fee
        uint256 fee = (msg.value * platformFee) / 10000;
        uint256 creatorAmount = msg.value - fee;
        
        // Update content stats
        content.totalDonationsReceived += creatorAmount;
        content.donationCount++;
        
        // Update creator earnings (ETH)
        creatorEarnings[content.owner][address(0)] += creatorAmount;
        
        // Update donor stats (ETH)
        donorTotalDonations[msg.sender][address(0)] += msg.value;
        
        // Create donation record
        donations[totalDonations] = Donation({
            donor: msg.sender,
            contentOwner: content.owner,
            amount: msg.value,
            timestamp: block.timestamp,
            contentUrl: _url,
            token: address(0) // ETH
        });
        
        // Add donation ID to content donations
        contentDonations[_url].push(totalDonations);
        
        totalDonations++;
        
        emit DonationMade(
            msg.sender, 
            content.owner, 
            _url, 
            msg.value, 
            totalDonations - 1, 
            block.timestamp,
            address(0) // ETH
        );
    }
    
    /**
     * Donate tokens to a specific content
     * @param _url The content URL to donate to
     * @param _token The token address to donate
     * @param _amount The amount of tokens to donate
     */
    function donateTokenToContent(
        string memory _url, 
        address _token, 
        uint256 _amount
    ) 
        public 
        contentExists(_url) 
        contentActive(_url) 
        nonReentrant
    {
        require(_amount > 0, "Donation amount must be greater than 0");
        require(supportedTokens[_token], "Token not supported");
        
        Content storage content = contents[_url];
        
        // Transfer tokens from donor to contract
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        
        // Calculate platform fee
        uint256 fee = (_amount * platformFee) / 10000;
        uint256 creatorAmount = _amount - fee;
        
        // Update content stats (we track total in Wei/smallest unit equivalent)
        content.totalDonationsReceived += creatorAmount;
        content.donationCount++;
        
        // Update creator earnings
        creatorEarnings[content.owner][_token] += creatorAmount;
        
        // Update donor stats
        donorTotalDonations[msg.sender][_token] += _amount;
        
        // Create donation record
        donations[totalDonations] = Donation({
            donor: msg.sender,
            contentOwner: content.owner,
            amount: _amount,
            timestamp: block.timestamp,
            contentUrl: _url,
            token: _token
        });
        
        // Add donation ID to content donations
        contentDonations[_url].push(totalDonations);
        
        totalDonations++;
        
        emit DonationMade(
            msg.sender, 
            content.owner, 
            _url, 
            _amount, 
            totalDonations - 1, 
            block.timestamp,
            _token
        );
    }
    
    /**
     * Allow creators to withdraw their ETH earnings
     */
    function withdrawEthEarnings() public nonReentrant {
        uint256 amount = creatorEarnings[msg.sender][address(0)];
        require(amount > 0, "No ETH earnings to withdraw");
        
        creatorEarnings[msg.sender][address(0)] = 0;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH withdrawal failed");
        
        emit WithdrawalMade(msg.sender, amount, address(0));
    }
    
    /**
     * Allow creators to withdraw their token earnings
     * @param _token The token address to withdraw
     */
    function withdrawTokenEarnings(address _token) public nonReentrant {
        require(supportedTokens[_token], "Token not supported");
        uint256 amount = creatorEarnings[msg.sender][_token];
        require(amount > 0, "No token earnings to withdraw");
        
        creatorEarnings[msg.sender][_token] = 0;
        
        IERC20(_token).safeTransfer(msg.sender, amount);
        
        emit WithdrawalMade(msg.sender, amount, _token);
    }
    
    /**
     * Withdraw all earnings for a creator (ETH + all supported tokens)
     */
    function withdrawAllEarnings() public nonReentrant {
        bool hasWithdrawn = false;
        
        // Withdraw ETH earnings
        uint256 ethAmount = creatorEarnings[msg.sender][address(0)];
        if (ethAmount > 0) {
            creatorEarnings[msg.sender][address(0)] = 0;
            (bool success, ) = msg.sender.call{value: ethAmount}("");
            require(success, "ETH withdrawal failed");
            emit WithdrawalMade(msg.sender, ethAmount, address(0));
            hasWithdrawn = true;
        }
        
        // Withdraw token earnings
        for (uint256 i = 0; i < supportedTokenList.length; i++) {
            address token = supportedTokenList[i];
            uint256 tokenAmount = creatorEarnings[msg.sender][token];
            if (tokenAmount > 0) {
                creatorEarnings[msg.sender][token] = 0;
                IERC20(token).safeTransfer(msg.sender, tokenAmount);
                emit WithdrawalMade(msg.sender, tokenAmount, token);
                hasWithdrawn = true;
            }
        }
        
        require(hasWithdrawn, "No earnings to withdraw");
    }
    
    /**
     * Deactivate content (only by content owner)
     * @param _url The content URL to deactivate
     */
    function deactivateContent(string memory _url) 
        public 
        contentExists(_url) 
        onlyContentOwner(_url) 
    {
        contents[_url].isActive = false;
        emit ContentDeactivated(_url, msg.sender);
    }
    
    /**
     * Reactivate content (only by content owner)
     * @param _url The content URL to reactivate
     */
    function reactivateContent(string memory _url) 
        public 
        contentExists(_url) 
        onlyContentOwner(_url) 
    {
        contents[_url].isActive = true;
        emit ContentReactivated(_url, msg.sender);
    }
    
    /**
     * Get content information
     * @param _url The content URL
     */
    function getContent(string memory _url) 
        public 
        view 
        returns (
            string memory url,
            address owner,
            uint256 totalDonationsReceived,
            uint256 donationCount,
            bool isActive,
            uint256 createdAt
        ) 
    {
        Content memory content = contents[_url];
        return (
            content.url,
            content.owner,
            content.totalDonationsReceived,
            content.donationCount,
            content.isActive,
            content.createdAt
        );
    }
    
    /**
     * Get all content URLs by a creator
     * @param _creator The creator's address
     */
    function getCreatorContents(address _creator) 
        public 
        view 
        returns (string[] memory) 
    {
        return creatorContents[_creator];
    }
    
    /**
     * Get donation IDs for a specific content
     * @param _url The content URL
     */
    function getContentDonations(string memory _url) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return contentDonations[_url];
    }
    
    /**
     * Check if content exists
     * @param _url The content URL to check
     * @return bool True if content exists, false otherwise
     */
    function contentExistsCheck(string memory _url) 
        public 
        view 
        returns (bool) 
    {
        return bytes(contents[_url].url).length > 0;
    }
    
    /**
     * Get donation details by ID
     * @param _donationId The donation ID
     */
    function getDonation(uint256 _donationId) 
        public 
        view 
        returns (
            address donor,
            address contentOwner,
            uint256 amount,
            uint256 timestamp,
            string memory contentUrl,
            address token
        ) 
    {
        Donation memory donation = donations[_donationId];
        return (
            donation.donor,
            donation.contentOwner,
            donation.amount,
            donation.timestamp,
            donation.contentUrl,
            donation.token
        );
    }
    
    /**
     * Get top donors for a specific content (last 10 donations)
     * @param _url The content URL
     */
    function getRecentDonations(string memory _url, uint256 _limit) 
        public 
        view 
        returns (uint256[] memory) 
    {
        uint256[] memory contentDonationIds = contentDonations[_url];
        uint256 length = contentDonationIds.length;
        
        if (length == 0) {
            return new uint256[](0);
        }
        
        uint256 limit = _limit > length ? length : _limit;
        uint256[] memory recentDonations = new uint256[](limit);
        
        for (uint256 i = 0; i < limit; i++) {
            recentDonations[i] = contentDonationIds[length - 1 - i];
        }
        
        return recentDonations;
    }
    
    /**
     * Get creator earnings for a specific token
     * @param _creator The creator's address
     * @param _token The token address (address(0) for ETH)
     */
    function getCreatorEarnings(address _creator, address _token) 
        public 
        view 
        returns (uint256) 
    {
        return creatorEarnings[_creator][_token];
    }
    
    /**
     * Get creator earnings for all tokens
     * @param _creator The creator's address
     */
    function getCreatorAllEarnings(address _creator) 
        public 
        view 
        returns (address[] memory tokens, uint256[] memory amounts, string[] memory symbols) 
    {
        // Include ETH + all supported tokens
        tokens = new address[](supportedTokenList.length + 1);
        amounts = new uint256[](supportedTokenList.length + 1);
        symbols = new string[](supportedTokenList.length + 1);
        
        // ETH earnings
        tokens[0] = address(0);
        amounts[0] = creatorEarnings[_creator][address(0)];
        symbols[0] = "ETH";
        
        // Token earnings
        for (uint256 i = 0; i < supportedTokenList.length; i++) {
            address token = supportedTokenList[i];
            tokens[i + 1] = token;
            amounts[i + 1] = creatorEarnings[_creator][token];
            symbols[i + 1] = tokenSymbols[token];
        }
    }
    
    /**
     * Get donor total donations for a specific token
     * @param _donor The donor's address
     * @param _token The token address (address(0) for ETH)
     */
    function getDonorTotalDonations(address _donor, address _token) 
        public 
        view 
        returns (uint256) 
    {
        return donorTotalDonations[_donor][_token];
    }
    
    /**
     * Get donor total donations for all tokens
     * @param _donor The donor's address
     */
    function getDonorAllDonations(address _donor) 
        public 
        view 
        returns (address[] memory tokens, uint256[] memory amounts, string[] memory symbols) 
    {
        // Include ETH + all supported tokens
        tokens = new address[](supportedTokenList.length + 1);
        amounts = new uint256[](supportedTokenList.length + 1);
        symbols = new string[](supportedTokenList.length + 1);
        
        // ETH donations
        tokens[0] = address(0);
        amounts[0] = donorTotalDonations[_donor][address(0)];
        symbols[0] = "ETH";
        
        // Token donations
        for (uint256 i = 0; i < supportedTokenList.length; i++) {
            address token = supportedTokenList[i];
            tokens[i + 1] = token;
            amounts[i + 1] = donorTotalDonations[_donor][token];
            symbols[i + 1] = tokenSymbols[token];
        }
    }

    /**
     * Add a supported token (only contract owner)
     * @param _token The token address to add
     * @param _symbol The token symbol for display purposes
     */
    function addSupportedToken(address _token, string memory _symbol) 
        public 
        onlyContractOwner 
    {
        require(_token != address(0), "Invalid token address");
        require(!supportedTokens[_token], "Token already supported");
        require(bytes(_symbol).length > 0, "Symbol cannot be empty");
        
        supportedTokens[_token] = true;
        tokenSymbols[_token] = _symbol;
        supportedTokenList.push(_token);
        
        emit TokenAdded(_token, _symbol);
    }
    
    /**
     * Remove a supported token (only contract owner)
     * @param _token The token address to remove
     */
    function removeSupportedToken(address _token) 
        public 
        onlyContractOwner 
    {
        require(supportedTokens[_token], "Token not supported");
        
        supportedTokens[_token] = false;
        delete tokenSymbols[_token];
        
        // Remove from supportedTokenList
        for (uint256 i = 0; i < supportedTokenList.length; i++) {
            if (supportedTokenList[i] == _token) {
                supportedTokenList[i] = supportedTokenList[supportedTokenList.length - 1];
                supportedTokenList.pop();
                break;
            }
        }
        
        emit TokenRemoved(_token);
    }
    
    /**
     * Get all supported tokens
     */
    function getSupportedTokens() 
        public 
        view 
        returns (address[] memory tokens, string[] memory symbols) 
    {
        tokens = supportedTokenList;
        symbols = new string[](supportedTokenList.length);
        
        for (uint256 i = 0; i < supportedTokenList.length; i++) {
            symbols[i] = tokenSymbols[supportedTokenList[i]];
        }
    }
    
    /**
     * Update platform fee (only contract owner)
     * @param _newFee New fee in basis points (e.g., 250 = 2.5%)
     */
    function updatePlatformFee(uint256 _newFee) public onlyContractOwner {
        require(_newFee <= 1000, "Fee cannot exceed 10%"); // Max 10%
        uint256 oldFee = platformFee;
        platformFee = _newFee;
        emit PlatformFeeUpdated(oldFee, _newFee);
    }
    
    /**
     * Get platform statistics
     */
    function getPlatformStats() 
        public 
        view 
        returns (
            uint256 totalContentsCount,
            uint256 totalDonationsCount,
            uint256 currentPlatformFee
        ) 
    {
        return (totalContents, totalDonations, platformFee);
    }
    
    /**
     * Withdraw platform fees in ETH (only contract owner)
     */
    function withdrawPlatformFeesEth() public onlyContractOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH fees to withdraw");
        
        (bool success, ) = contractOwner.call{value: balance}("");
        require(success, "ETH fee withdrawal failed");
    }
    
    /**
     * Withdraw platform fees in tokens (only contract owner)
     * @param _token The token address to withdraw fees for
     */
    function withdrawPlatformFeesToken(address _token) public onlyContractOwner nonReentrant {
        require(supportedTokens[_token], "Token not supported");
        uint256 balance = IERC20(_token).balanceOf(address(this));
        
        require(balance > 0, "No token fees to withdraw");
        IERC20(_token).safeTransfer(contractOwner, balance);
    }
    
    /**
     * Withdraw all platform fees (ETH + all tokens) (only contract owner)
     */
    function withdrawAllPlatformFees() public onlyContractOwner nonReentrant {
        // Withdraw ETH fees
        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) {
            (bool success, ) = contractOwner.call{value: ethBalance}("");
            require(success, "ETH fee withdrawal failed");
        }
        
        // Withdraw token fees
        for (uint256 i = 0; i < supportedTokenList.length; i++) {
            address token = supportedTokenList[i];
            uint256 tokenBalance = IERC20(token).balanceOf(address(this));
            if (tokenBalance > 0) {
                IERC20(token).safeTransfer(contractOwner, tokenBalance);
            }
        }
    }
    
    /**
     * Emergency function to transfer content ownership
     * @param _url The content URL
     * @param _newOwner The new owner address
     */
    function transferContentOwnership(string memory _url, address _newOwner) 
        public 
        contentExists(_url) 
        onlyContentOwner(_url) 
    {
        require(_newOwner != address(0), "Invalid new owner address");
        require(_newOwner != contents[_url].owner, "Same owner");
        
        address oldOwner = contents[_url].owner;
        contents[_url].owner = _newOwner;
        
        // Update creator contents arrays
        string[] storage oldOwnerContents = creatorContents[oldOwner];
        for (uint256 i = 0; i < oldOwnerContents.length; i++) {
            if (keccak256(bytes(oldOwnerContents[i])) == keccak256(bytes(_url))) {
                oldOwnerContents[i] = oldOwnerContents[oldOwnerContents.length - 1];
                oldOwnerContents.pop();
                break;
            }
        }
        
        creatorContents[_newOwner].push(_url);
    }
    
    /**
     * Function that allows the contract to receive ETH
     */
    receive() external payable {}
    
    /**
     * Fallback function
     */
    fallback() external payable {}
}
