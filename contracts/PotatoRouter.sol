//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PotatoToken.sol";
import "./LiquidityPool.sol";

//Interface btwn frontend and contract (More Secure (Uniswap))
contract PotatoRouter {
    PotatoToken potatoToken;
    LiquidityPool liquidityPool;

    constructor(LiquidityPool _liquidityPool, PotatoToken _potatoToken) {
        liquidityPool = _liquidityPool;
        potatoToken = _potatoToken;
    }

    //Frontend will call this, then addLiquidity only call lower level deposit
    function addLiquidity(uint256 _potAmount) external payable {
        require(potatoToken.balanceOf(msg.sender) > 0, "NO_TOKENS");

        bool success = potatoToken.increaseContractAllowance(
            msg.sender,
            address(this),
            _potAmount
        );
        require(success);

        //From, to, amount
        potatoToken.transferFrom(msg.sender, address(liquidityPool), _potAmount);
        liquidityPool.deposit{value: msg.value}(_potAmount, msg.sender);
    }

    //Frontend will call this, then pullLiquidity only call lower level withdraw
    function pullLiquidity() external {
        liquidityPool.withdraw(msg.sender);
    }

    //Frontend will call this, then swapTokens call lower level function swap
    function swapTokens(uint256 _potAmount) external payable {
        bool success = potatoToken.increaseContractAllowance(
            msg.sender,
            address(this),
            _potAmount
        );
        require(success);

        //From, to, amount
        potatoToken.transferFrom(msg.sender, address(liquidityPool), _potAmount);
        liquidityPool.swap{value: msg.value}(msg.sender, _potAmount);
    }
}