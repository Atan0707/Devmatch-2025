//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * A smart contract for streaming content donations
 * Allows content creators to register their streaming URLs and receive donations
 * @author Pisang Biru 
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
    
    // Platform support
    mapping(string => bool) public supportedPlatforms;
    string[] public supportedPlatformList;
    
    // Structs
    struct Content {
        string username;
        string platform; // twitch, youtube, facebook, tiktok, etc.
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
        string contentUsername;
        string contentPlatform;
        address token; // address(0) for ETH, token address for ERC20
    }
    
    // Mappings
    mapping(string => Content) public contents; // "username-at-platform" => Content
    mapping(address => string[]) public creatorContents; // creator => "username-at-platform"[]
    mapping(address => mapping(address => uint256)) public creatorEarnings; // creator => token => total earnings
    mapping(address => mapping(address => uint256)) public donorTotalDonations; // donor => token => total donated
    mapping(uint256 => Donation) public donations; // donation ID => Donation
    mapping(string => uint256[]) public contentDonations; // "username-at-platform" => donation IDs[]
    
    // Events
    event ContentRegistered(
        string indexed username,
        string indexed platform,
        address indexed owner, 
        uint256 timestamp
    );
    
    event DonationMade(
        address indexed donor,
        address indexed contentOwner,
        string indexed contentUsername,
        string contentPlatform,
        uint256 amount,
        uint256 donationId,
        uint256 timestamp,
        address token
    );
    
    event ContentDeactivated(string indexed username, string indexed platform, address indexed owner);
    event ContentReactivated(string indexed username, string indexed platform, address indexed owner);
    event WithdrawalMade(address indexed creator, uint256 amount, address token);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event TokenAdded(address indexed token, string symbol);
    event TokenRemoved(address indexed token);
    event PlatformAdded(string indexed platform);
    event PlatformRemoved(string indexed platform);
    event UsernameChanged(address indexed owner, string indexed oldUsername, string indexed newUsername, string platform);
    
    // Modifiers
    modifier onlyContractOwner() {
        require(msg.sender == contractOwner, "Not the contract owner");
        _;
    }
    
    modifier onlyContentOwner(string memory _usernameAtPlatform) {
        require(contents[_usernameAtPlatform].owner == msg.sender, "Not the content owner");
        _;
    }
    
    modifier contentExists(string memory _usernameAtPlatform) {
        require(bytes(contents[_usernameAtPlatform].username).length > 0, "Content does not exist");
        _;
    }
    
    modifier contentActive(string memory _usernameAtPlatform) {
        require(contents[_usernameAtPlatform].isActive, "Content is not active");
        _;
    }
    
    // Constructor
    constructor(address _contractOwner) {
        contractOwner = _contractOwner;
        
        // Initialize supported platforms
        supportedPlatforms["twitch"] = true;
        supportedPlatforms["youtube"] = true;
        supportedPlatforms["facebook"] = true;
        supportedPlatforms["tiktok"] = true;
        supportedPlatforms["instagram"] = true;
        supportedPlatforms["twitter"] = true;
        
        supportedPlatformList.push("twitch");
        supportedPlatformList.push("youtube");
        supportedPlatformList.push("facebook");
        supportedPlatformList.push("tiktok");
        supportedPlatformList.push("instagram");
        supportedPlatformList.push("twitter");
    }
    
    /**
     * Helper function to create username-at-platform key
     * @param _username The username
     * @param _platform The platform
     */
    function _createKey(string memory _username, string memory _platform) 
        internal 
        pure 
        returns (string memory) 
    {
        return string(abi.encodePacked(_username, "@", _platform));
    }
    
    /**
     * Register a new streaming content with username and platform
     * @param _username The username on the platform
     * @param _platform The platform (twitch, youtube, facebook, tiktok, etc.)
     */
    function registerContent(string memory _username, string memory _platform) public {
        require(bytes(_username).length > 0, "Username cannot be empty");
        require(bytes(_platform).length > 0, "Platform cannot be empty");
        require(supportedPlatforms[_platform], "Platform not supported");
        
        string memory key = _createKey(_username, _platform);
        require(bytes(contents[key].username).length == 0, "Content already registered");
        
        contents[key] = Content({
            username: _username,
            platform: _platform,
            owner: msg.sender,
            totalDonationsReceived: 0,
            donationCount: 0,
            isActive: true,
            createdAt: block.timestamp
        });
        
        creatorContents[msg.sender].push(key);
        totalContents++;
        
        emit ContentRegistered(_username, _platform, msg.sender, block.timestamp);
    }
    
    /**
     * Donate to a specific content
     * @param _username The username to donate to
     * @param _platform The platform of the content
     */
    function donateToContent(string memory _username, string memory _platform) 
        public 
        payable 
    {
        string memory key = _createKey(_username, _platform);
        require(bytes(contents[key].username).length > 0, "Content does not exist");
        require(contents[key].isActive, "Content is not active");
        require(msg.value > 0, "Donation amount must be greater than 0");
        
        Content storage content = contents[key];
        
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
            contentUsername: _username,
            contentPlatform: _platform,
            token: address(0) // ETH
        });
        
        // Add donation ID to content donations
        contentDonations[key].push(totalDonations);
        
        totalDonations++;
        
        emit DonationMade(
            msg.sender, 
            content.owner, 
            _username,
            _platform,
            msg.value, 
            totalDonations - 1, 
            block.timestamp,
            address(0) // ETH
        );
    }
    
    /**
     * Donate tokens to a specific content
     * @param _username The username to donate to
     * @param _platform The platform of the content
     * @param _token The token address to donate
     * @param _amount The amount of tokens to donate
     */
    function donateTokenToContent(
        string memory _username,
        string memory _platform,
        address _token, 
        uint256 _amount
    ) 
        public 
        nonReentrant
    {
        string memory key = _createKey(_username, _platform);
        require(bytes(contents[key].username).length > 0, "Content does not exist");
        require(contents[key].isActive, "Content is not active");
        require(_amount > 0, "Donation amount must be greater than 0");
        require(supportedTokens[_token], "Token not supported");
        
        Content storage content = contents[key];
        
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
            contentUsername: _username,
            contentPlatform: _platform,
            token: _token
        });
        
        // Add donation ID to content donations
        contentDonations[key].push(totalDonations);
        
        totalDonations++;
        
        emit DonationMade(
            msg.sender, 
            content.owner, 
            _username,
            _platform,
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
     * @param _username The username to deactivate
     * @param _platform The platform of the content
     */
    function deactivateContent(string memory _username, string memory _platform) 
        public 
    {
        string memory key = _createKey(_username, _platform);
        require(bytes(contents[key].username).length > 0, "Content does not exist");
        require(contents[key].owner == msg.sender, "Not the content owner");
        
        contents[key].isActive = false;
        emit ContentDeactivated(_username, _platform, msg.sender);
    }
    
    /**
     * Reactivate content (only by content owner)
     * @param _username The username to reactivate
     * @param _platform The platform of the content
     */
    function reactivateContent(string memory _username, string memory _platform) 
        public 
    {
        string memory key = _createKey(_username, _platform);
        require(bytes(contents[key].username).length > 0, "Content does not exist");
        require(contents[key].owner == msg.sender, "Not the content owner");
        
        contents[key].isActive = true;
        emit ContentReactivated(_username, _platform, msg.sender);
    }
    
    /**
     * Get content information
     * @param _username The username
     * @param _platform The platform
     */
    function getContent(string memory _username, string memory _platform) 
        public 
        view 
        returns (
            string memory username,
            string memory platform,
            address owner,
            uint256 totalDonationsReceived,
            uint256 donationCount,
            bool isActive,
            uint256 createdAt
        ) 
    {
        string memory key = _createKey(_username, _platform);
        Content memory content = contents[key];
        return (
            content.username,
            content.platform,
            content.owner,
            content.totalDonationsReceived,
            content.donationCount,
            content.isActive,
            content.createdAt
        );
    }
    
    /**
     * Get all content keys (username-at-platform) by a creator
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
     * @param _username The username
     * @param _platform The platform
     */
    function getContentDonations(string memory _username, string memory _platform) 
        public 
        view 
        returns (uint256[] memory) 
    {
        string memory key = _createKey(_username, _platform);
        return contentDonations[key];
    }
    
    /**
     * Check if content exists
     * @param _username The username to check
     * @param _platform The platform to check
     * @return bool True if content exists, false otherwise
     */
    function contentExistsCheck(string memory _username, string memory _platform) 
        public 
        view 
        returns (bool) 
    {
        string memory key = _createKey(_username, _platform);
        return bytes(contents[key].username).length > 0;
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
            string memory contentUsername,
            string memory contentPlatform,
            address token
        ) 
    {
        Donation memory donation = donations[_donationId];
        return (
            donation.donor,
            donation.contentOwner,
            donation.amount,
            donation.timestamp,
            donation.contentUsername,
            donation.contentPlatform,
            donation.token
        );
    }
    
    /**
     * Get recent donations for a specific content
     * @param _username The username
     * @param _platform The platform
     * @param _limit The number of recent donations to return
     */
    function getRecentDonations(string memory _username, string memory _platform, uint256 _limit) 
        public 
        view 
        returns (uint256[] memory) 
    {
        string memory key = _createKey(_username, _platform);
        uint256[] memory contentDonationIds = contentDonations[key];
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
     * Get all supported platforms
     */
    function getSupportedPlatforms() 
        public 
        view 
        returns (string[] memory) 
    {
        return supportedPlatformList;
    }
    
    /**
     * Add a supported platform (only contract owner)
     * @param _platform The platform name to add
     */
    function addSupportedPlatform(string memory _platform) 
        public 
        onlyContractOwner 
    {
        require(bytes(_platform).length > 0, "Platform cannot be empty");
        require(!supportedPlatforms[_platform], "Platform already supported");
        
        supportedPlatforms[_platform] = true;
        supportedPlatformList.push(_platform);
        
        emit PlatformAdded(_platform);
    }
    
    /**
     * Remove a supported platform (only contract owner)
     * @param _platform The platform name to remove
     */
    function removeSupportedPlatform(string memory _platform) 
        public 
        onlyContractOwner 
    {
        require(supportedPlatforms[_platform], "Platform not supported");
        
        supportedPlatforms[_platform] = false;
        
        // Remove from supportedPlatformList
        for (uint256 i = 0; i < supportedPlatformList.length; i++) {
            if (keccak256(bytes(supportedPlatformList[i])) == keccak256(bytes(_platform))) {
                supportedPlatformList[i] = supportedPlatformList[supportedPlatformList.length - 1];
                supportedPlatformList.pop();
                break;
            }
        }
        
        emit PlatformRemoved(_platform);
    }
    
    /**
     * Change username for an existing content account
     * @param _oldUsername The current username
     * @param _newUsername The new username
     * @param _platform The platform of the content
     */
    function changeUsername(
        string memory _oldUsername, 
        string memory _newUsername, 
        string memory _platform
    ) 
        public 
    {
        require(bytes(_newUsername).length > 0, "New username cannot be empty");
        require(supportedPlatforms[_platform], "Platform not supported");
        
        string memory oldKey = _createKey(_oldUsername, _platform);
        string memory newKey = _createKey(_newUsername, _platform);
        
        require(bytes(contents[oldKey].username).length > 0, "Old content does not exist");
        require(contents[oldKey].owner == msg.sender, "Not the content owner");
        require(bytes(contents[newKey].username).length == 0, "New username already exists");
        
        // Copy content data to new key
        Content storage oldContent = contents[oldKey];
        contents[newKey] = Content({
            username: _newUsername,
            platform: _platform,
            owner: oldContent.owner,
            totalDonationsReceived: oldContent.totalDonationsReceived,
            donationCount: oldContent.donationCount,
            isActive: oldContent.isActive,
            createdAt: oldContent.createdAt
        });
        
        // Move donation records to new key
        contentDonations[newKey] = contentDonations[oldKey];
        delete contentDonations[oldKey];
        
        // Update all donation records to point to new username
        uint256[] memory donationIds = contentDonations[newKey];
        for (uint256 i = 0; i < donationIds.length; i++) {
            donations[donationIds[i]].contentUsername = _newUsername;
        }
        
        // Update creator contents array
        string[] storage creatorContentsList = creatorContents[msg.sender];
        for (uint256 i = 0; i < creatorContentsList.length; i++) {
            if (keccak256(bytes(creatorContentsList[i])) == keccak256(bytes(oldKey))) {
                creatorContentsList[i] = newKey;
                break;
            }
        }
        
        // Delete old content
        delete contents[oldKey];
        
        emit UsernameChanged(msg.sender, _oldUsername, _newUsername, _platform);
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
     * @param _username The username
     * @param _platform The platform
     * @param _newOwner The new owner address
     */
    function transferContentOwnership(
        string memory _username, 
        string memory _platform, 
        address _newOwner
    ) 
        public 
    {
        string memory key = _createKey(_username, _platform);
        require(bytes(contents[key].username).length > 0, "Content does not exist");
        require(contents[key].owner == msg.sender, "Not the content owner");
        require(_newOwner != address(0), "Invalid new owner address");
        require(_newOwner != contents[key].owner, "Same owner");
        
        address oldOwner = contents[key].owner;
        contents[key].owner = _newOwner;
        
        // Update creator contents arrays
        string[] storage oldOwnerContents = creatorContents[oldOwner];
        for (uint256 i = 0; i < oldOwnerContents.length; i++) {
            if (keccak256(bytes(oldOwnerContents[i])) == keccak256(bytes(key))) {
                oldOwnerContents[i] = oldOwnerContents[oldOwnerContents.length - 1];
                oldOwnerContents.pop();
                break;
            }
        }
        
        creatorContents[_newOwner].push(key);
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
