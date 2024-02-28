// SPDX-License-Identifier: MIT
// Creator: andreitoma8
pragma solidity ^0.8.13;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    function decimals() external view returns (uint8);

    function balanceOf(address _owner) external view returns (uint256 balance);
}

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

library TransferHelper {
    function safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 value
    ) internal {
        // bytes4(keccak256(bytes('transferFrom(address,address,uint256)')));
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(0x23b872dd, from, to, value)
        );
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "TransferHelper: TRANSFER_FROM_FAILED"
        );
    }

    function safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "TransferHelper: ETH_TRANSFER_FAILED");
    }
}

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _transferOwnership(_msgSender());
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

contract VerifySignature {
    /* 1. Unlock MetaMask account
    ethereum.enable()
    */

    /* 2. Get message hash to sign
    getMessageHash(
        0x14723A09ACff6D2A60DcdF7aA4AFf308FDDC160C,
        123,
        "coffee and donuts",
        1
    )

    hash = "0xcf36ac4f97dc10d91fc2cbb20d718e94a8cbfe0f82eaedc6a4aa38946fb797cd"
    */
    function getMessageHash(
        address _to,
        uint256 _amount,
        uint256 _nonce
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_to, _amount, _nonce));
    }

    /* 3. Sign message hash
    # using browser
    account = "copy paste account of signer here"
    ethereum.request({ method: "personal_sign", params: [account, hash]}).then(console.log)

    # using web3
    web3.personal.sign(hash, web3.eth.defaultAccount, console.log)

    Signature will be different for different accounts
    0x993dab3dd91f5c6dc28e17439be475478f5635c92a56e17e82349d3fb2f166196f466c0b4e0c146f285204f0dcb13e5ae67bc33f4b888ec32dfe0a063e8f3f781b
    */
    function getEthSignedMessageHash(
        bytes32 _messageHash
    ) public pure returns (bytes32) {
        /*
        Signature is produced by signing a keccak256 hash with the following format:
        "\x19Ethereum Signed Message\n" + len(msg) + msg
        */
        return
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    _messageHash
                )
            );
    }

    /* 4. Verify signature
    signer = 0xB273216C05A8c0D4F0a4Dd0d7Bae1D2EfFE636dd
    to = 0x14723A09ACff6D2A60DcdF7aA4AFf308FDDC160C
    amount = 123
    message = "coffee and donuts"
    nonce = 1
    signature =
        0x993dab3dd91f5c6dc28e17439be475478f5635c92a56e17e82349d3fb2f166196f466c0b4e0c146f285204f0dcb13e5ae67bc33f4b888ec32dfe0a063e8f3f781b
    */
    function verify(
        address _signer,
        address _to,
        uint256 _amount,
        uint256 _nonce,
        bytes memory signature
    ) public pure returns (bool) {
        bytes32 messageHash = getMessageHash(_to, _amount, _nonce);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        return recoverSigner(ethSignedMessageHash, signature) == _signer;
    }

    function recoverSigner(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(
        bytes memory sig
    ) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");

        assembly {
            /*
            First 32 bytes stores the length of the signature

            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature

            mload(p) loads next 32 bytes starting at the memory address p into memory
            */

            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        // implicitly return (r, s, v)
    }
}

contract Oxoa is Ownable, VerifySignature {
    event NewNode(
        uint256 _numberOfNodes,
        address indexed _owner,
        uint256 _nodeId,
        uint256 indexed _nodePrice,
        uint256 _refAmount,
        address indexed _refAddress
    );

    event ClaimOXOA(address indexed _owner, uint256 _amount, uint256 _nonce);

    address public oxoaTokenAddress =
        0xDC2Db003Be75D4e2a2F1d00B9efC91c00B8D814B;
    //mainnet 0xDC2Db003Be75D4e2a2F1d00B9efC91c00B8D814B;

    address public recipientAddress = address(0);

    address public holderAddress = address(0);

    uint256 public refPercent = 5;

    mapping(string => Discount) public discounts;

    uint256 public nodePrice = 0.04 ether;

    mapping(uint256 => bool) public usedNonce;

    mapping(address => uint256) public specialRefs;

    struct Discount {
        uint256 percent;
        uint256 count;
    }

    struct Ref {
        uint256 count;
        uint256 amount;
    }

    mapping(address => Ref) public refs;

    constructor() {
        holderAddress = msg.sender;
        recipientAddress = msg.sender;
    }

    function _state()
        external
        view
        returns (
            address _oxoaTokenAddress,
            uint256 _nodePrice,
            uint256 _refPercent
        )
    {
        return (oxoaTokenAddress, nodePrice, refPercent);
    }

    function buyNodeKey(
        uint256 _numberOfNodes,
        address _refAddress,
        string calldata _discountCode
    ) external payable {
        if (bytes(_discountCode).length > 0) {
            require(
                discounts[_discountCode].percent > 0 &&
                    discounts[_discountCode].count > 0,
                "Invalid discount code"
            );
        }
        uint256 subTotal = _numberOfNodes * nodePrice;
        if (
            bytes(_discountCode).length > 0 &&
            discounts[_discountCode].percent > 0 &&
            discounts[_discountCode].count > 0
        ) {
            subTotal =
                (_numberOfNodes *
                    nodePrice *
                    (100 - discounts[_discountCode].percent)) /
                100;
            discounts[_discountCode].count--;
        }

        require(msg.value >= subTotal, "Not enough ether");

        uint256 refAmount = 0;
        if (
            _refAddress != address(0) &&
            _refAddress != msg.sender &&
            subTotal > 0
        ) {
            uint256 ref = specialRefs[_refAddress] > 0
                ? specialRefs[_refAddress]
                : refPercent;
            if (ref > 0) {
                refAmount = (subTotal * ref) / 100;
                if (refAmount > 0) {
                    require(msg.value >= refAmount, "Not enough ether");
                    TransferHelper.safeTransferETH(_refAddress, refAmount);

                    refs[_refAddress].count += 1;
                    refs[_refAddress].amount += refAmount;
                }
            }
        }
        if (msg.value - refAmount > 0) {
            TransferHelper.safeTransferETH(
                recipientAddress,
                msg.value - refAmount
            );
        }

        uint256 nodeId = (uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    msg.sender,
                    refAmount,
                    _refAddress
                )
            )
        ) % (999_999_999_999 - 100_000_000_000 + 1)) + 100_000_000_000;

        emit NewNode(
            _numberOfNodes,
            msg.sender,
            nodeId,
            nodePrice,
            refAmount,
            _refAddress
        );
    }

    function claimOxoa(
        uint256 amount,
        uint256 nonce,
        bytes calldata signature
    ) external {
        require(
            verify(owner(), msg.sender, amount, nonce, signature) &&
                usedNonce[nonce] == false,
            "Invalid signature"
        );
        require(
            IERC20(oxoaTokenAddress).allowance(holderAddress, address(this)) >=
                amount,
            "Token holder not allowance"
        );
        usedNonce[nonce] = true;

        TransferHelper.safeTransferFrom(
            oxoaTokenAddress,
            holderAddress,
            msg.sender,
            amount
        );
        emit ClaimOXOA(msg.sender, amount, nonce);
    }

    function setOxoaTokenAddress(address _oxoaTokenAddress) external onlyOwner {
        oxoaTokenAddress = _oxoaTokenAddress;
    }

    function updateNodePrice(uint256 _nodePrice) external onlyOwner {
        nodePrice = _nodePrice;
    }

    function setRecipientAddress(address _recipientAddress) external onlyOwner {
        recipientAddress = _recipientAddress;
    }

    function setHolderAddress(address _holderAddress) external onlyOwner {
        holderAddress = _holderAddress;
    }

    function setRefPercent(uint256 _refPercent) external onlyOwner {
        require(_refPercent <= 100 && _refPercent >= 0, "Invalid ref percent");
        refPercent = _refPercent;
    }

    function setSpecialRef(
        address _refAddress,
        uint256 _refPercent
    ) external onlyOwner {
        require(_refPercent <= 100 && _refPercent >= 0, "Invalid ref percent");
        specialRefs[_refAddress] = _refPercent;
    }

    function setDiscount(
        string calldata _code,
        uint256 _percent,
        uint256 _count
    ) external onlyOwner {
        require(
            _percent <= 100 && _percent >= 0 && _count >= 0,
            "Invalid discount percent"
        );
        discounts[_code].percent = _percent;
        discounts[_code].count = _count;
    }
}
