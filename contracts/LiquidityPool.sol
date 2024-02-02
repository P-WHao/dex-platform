//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./LPToken.sol";
import "./PotatoToken.sol";
import "hardhat/console.sol";

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@uniswap/lib/contracts/libraries/Babylonian.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LiquidityPool is Ownable {
    //Notify user account balance
    event TradedTokens(
        address indexed _account,
        uint256 _ethTraded,
        uint256 _potTraded
    );

    event LiquidityAdded(address indexed _account);
    
    event LiquidityRemoved(address indexed _account);

    uint256 ethReserve;
    uint256 potReserve;
    uint32 lastBlockTimestamp;
    LPToken lpToken;
    PotatoToken potatoToken;

    //SWAP 
    //When swap we check account address and the user amount (AMM XYK Applied here)
    function swap(address account, uint256 _potatoTokenAmount) external payable {
        //XYK Model -> K = X * Y
        uint256 kValue = ethReserve * potReserve;
        uint256 transferBeforeFee; //User receive before transaction fees
        uint256 transactionFees; //Transaction fees we charge
        uint256 transferAfterFee; //User receive after transaction fees

        //ETH is 0
        if (msg.value == 0) {
            //when user give potato token, and take eth from pool

            /*
             * X       * Y        = K
             * 10 eth  * 5000 POT = 50000

             * Eth pool = 10 - 1 = 9 <- new eth reserve in pool
             * Token pool = 50000 / 9 = 5555.56 <- new token reserve in pool
             
             //To Transfer to user
                Old eth reserve - New eth reserve = Amount POT to user
                10              - 9               = 1
            
             //Owner Charge Fees 
                transaction fee = (1% * User receive before transaction fees)
            */

            uint256 x = kValue / (potReserve + _potatoTokenAmount);
            transferBeforeFee = ethReserve - x;

            //Contract take 1% fee
            transactionFees = (1 * transferBeforeFee) / 100;
            transferAfterFee = transferBeforeFee - transactionFees;

            (bool success, ) = account.call{value: transferAfterFee}("");

            require(success, "TRANSFER_FAILED");
        } else {
            //when user give eth, and take potato token from pool
            /*
             * X       * Y        = K
             * 10 eth  * 5000 POT = 50000
             
             * Eth pool = 10 + 1 = 11 <- new eth reserve in pool
             * Token pool = 50000 / 11 = 4545.45 <- new token reserve in pool

             //To Transfer to user
                Old POT reserve - New POT reserve = Amount POT to user
                5000            - 4545.45         = 454.55
            
             //Owner Charge Fees 
                transaction fee = (1% * User receive before transaction fees)
            */

            // Assume
            // 1 ETH = 5 POT
            // user give 1 eth and will take how many from pool?
            // Current Pool for ETH = 10
            // Current Pool for POT = 50

            // X  * Y  = k
            // 10 * 50 = 500

            // x will increase as user give eth 
            // 10 + 1 = 11

            // y will decrease as give eth and get POT
            // 50 - ? = ?
            // y = k/x
            // y = 500/11
            //   = 45.45 <- calculated left in pool

            // To user = Total Y - calculated left in pool
            // ?       = 50      - 45.45
            //         = 4.55

            //USER GIVE 2 ETH
            // Assume
            // 1 ETH = 5 POT
            // user give 2 eth and will take how many from pool?
            // Current Pool for ETH = 10
            // Current Pool for POT = 50

            // X  * Y  = k
            // 10 * 50 = 500

            // x will increase as user give eth 
            // 10 + 2 = 12

            // y will decrease as give eth and get POT
            // 50 - ? = ?
            // y = k/x
            // y = 500/12
            //   = 41.67 <- calculated left in pool

            // To user = Total Y - calculated left in pool
            // ?       = 50      - 41.67
            //         = 8.33

            //x * y = kValue
            //x = eth, y = tempVar, kValue = constant
            uint256 y = kValue / (ethReserve + msg.value);
            transferBeforeFee = potReserve - y;

            //Contract take 1% fee
            transactionFees = (1 * transferBeforeFee) / 100;
            transferAfterFee = transferBeforeFee - transactionFees;

            potatoToken.transfer(account, transferAfterFee);
        }
        emit TradedTokens(account, msg.value, _potatoTokenAmount);
        _update();
    }

    function deposit(uint256 potatoTokenAmount, address account) external payable {
        uint256 liquidity;
        uint256 totalSupply = lpToken.totalSupply(); //Total lptoken in contract
        uint256 ethAmount = msg.value;

        //If user deposit then here will run to calculate the liquidity they will get
        if (totalSupply > 0) {
            liquidity = Math.min(
                (ethAmount * totalSupply) / ethReserve,
                (potatoTokenAmount * totalSupply) / potReserve
            );
        } else { //When Owner moved the funds to liquidity pool then here will run and calculated the liquidity (Run Once)
            liquidity = Babylonian.sqrt(ethAmount * potatoTokenAmount);
        }

        //then will mint the lptoken
        lpToken.mint(account, liquidity);
        emit LiquidityAdded(account);
        _update();
    }

    function withdraw(address account) external {
        uint256 liquidity = lpToken.balanceOf(account);
        require(liquidity != 0, "NO_TOKENS");

        //Total lptoken in contract
        uint256 totalSupply = lpToken.totalSupply();

        //Calculate how much will get back
        uint256 ethAmount = (ethReserve * liquidity) / totalSupply;
        uint256 potatoTokenAmount = (potReserve * liquidity) / totalSupply;

        lpToken.burn(account, liquidity);

        (bool ethTransferSuccess, ) = account.call{value: ethAmount}("");
        bool potTransferSuccess = potatoToken.transfer(account, potatoTokenAmount);

        require(ethTransferSuccess && potTransferSuccess, "FAILED_TRANSFER");
        emit LiquidityRemoved(account);
        _update();
    }

    //Update the block time
    function _update() private {
        uint32 blockTimestamp = uint32(block.timestamp % 2**32);
        uint32 timeElapsed;
        
        unchecked {
            timeElapsed = blockTimestamp - lastBlockTimestamp;
        }

        if (timeElapsed > 0) {
            ethReserve = address(this).balance;
            potReserve = potatoToken.balanceOf(address(this));
            lastBlockTimestamp = blockTimestamp;
        }
    }

    //Find total liquidity pool value/ reserve, can call by frontend
    function getReserves() external view returns (uint256, uint256) {
        return (ethReserve, potReserve);
    }

    //Set LPToken Address
    function setLPTokenAddress(LPToken _lpToken) external onlyOwner {
        require(address(lpToken) == address(0), "WRITE_ONCE");
        lpToken = _lpToken;
    }

    //Set PotatoToken Address
    function setPotatoTokenAddress(PotatoToken _potatoToken) external onlyOwner {
        require(address(potatoToken) == address(0), "WRITE_ONCE");
        potatoToken = _potatoToken;
    }
}