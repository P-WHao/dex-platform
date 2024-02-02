//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./LiquidityPool.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PotatoToken is ERC20 {
    event TokensBought(address indexed _account, uint256 amount);
    event FundsMoved();

    uint256 public MAX_SUPPLY;
    uint256 public totalContributed;

    //For funding purpose (Owner can move fund)
    bool public fundMoved;

    address public owner;
    address payable public totalTokenWallet;
    address public potatoRouter;

    mapping(address => uint256) public balancesToClaim;

    //Function Modifier Owner Account (onlyOwner())
    modifier isOwner() {  
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    modifier isRouter() {
        require(msg.sender == potatoRouter, "NOT_ROUTER");
        _;
    }

    modifier areFundsMoved() {
        require(!fundMoved, "FUND_END");
        _;
    }

    modifier areTotalNotZero() {
        require(totalContributed!=0, "FUNDS_IS_ZERO");
        _;
    }
    
    constructor(address payable totalToken) ERC20("Potato Token", "POT"){
        MAX_SUPPLY = 600000 * 10 ** decimals();
        _mint(address(this), MAX_SUPPLY);
        owner = msg.sender;
        totalTokenWallet = totalToken;
    }

    //Set the router address
    function setRouterAddress(address _potatoRouter) external isOwner {
        require(address(potatoRouter) == address(0), "WRITE_ONCE");
        potatoRouter = _potatoRouter;
    }

    function increaseContractAllowance(
        address _owner,
        address _spender,
        uint256 _amount
    ) public isRouter returns (bool) {
        _approve(
            _owner,
            _spender,
            allowance(msg.sender, address(this)) + _amount
        );

        return true;
    }

    function contribute() external payable areFundsMoved {
        //When contribute user will contribute ETH into pool and will sent the ETH * 5 = POT token in pool
        uint256 tokenAmount = msg.value * 5;
        balancesToClaim[msg.sender] += tokenAmount;
        totalContributed += msg.value;
        emit TokensBought(msg.sender, tokenAmount);
    }
    
    function claimTokens() external areFundsMoved {
        uint256 tokensToClaim = balancesToClaim[msg.sender];

        super._transfer(address(this), msg.sender, tokensToClaim);
    }

    //Moves tokens amount from sender to recipient. (Openzeppelin) (inherit)
    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal override {
        super._transfer(sender, recipient, amount);
    }

    //Owner move the fund to liquidity pool
    function sendLiquidityToLPContract(LiquidityPool liquidityPool) external areTotalNotZero isOwner areFundsMoved {
        fundMoved = true;
        
        uint256 potatoTokenAmountToTransfer = totalContributed * 5;

        //from, to, amount
        super._transfer(
            address(this),
            address(liquidityPool),
            potatoTokenAmountToTransfer
        );

        liquidityPool.deposit{value: totalContributed}(
            potatoTokenAmountToTransfer,
            address(this)
        );
    }
}