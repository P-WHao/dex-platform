const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseEther } = require("ethers/lib/utils");

describe("LiquidityPoolSwap TEST", function () {
  let owner,
    potatoToken,
    totalToken,
    addr1,
    addr2,
    addr,
    provider,
    liquidityPool,
    lpToken,
    potatoRouter;

  beforeEach(async () => {
    [owner, addr1, addr2, ...addr] = await ethers.getSigners();

    provider = ethers.provider;

    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    liquidityPool = await LiquidityPool.deploy();

    const PotatoToken = await ethers.getContractFactory("PotatoToken");
    totalToken = addr[3];
    potatoToken = await PotatoToken.deploy(totalToken.address);

    const LPToken = await ethers.getContractFactory("LPToken");
    lpToken = await LPToken.deploy(liquidityPool.address);

    const PotatoRouter = await ethers.getContractFactory("PotatoRouter");
    potatoRouter = await PotatoRouter.deploy(
      liquidityPool.address,
      potatoToken.address
    );

    //Set router address
    await potatoToken.setRouterAddress(potatoRouter.address);

    //Donate from 10 different address
    for (let i = 0; i < 10; i++) {
      await potatoToken
        .connect(addr[i])
        .contribute({ value: parseEther("10") });
      await potatoToken.connect(addr[i]).claimTokens();
    }

    //Set Potato Token address
    await liquidityPool.setPotatoTokenAddress(potatoToken.address);

    //Set LP Token address
    await liquidityPool.setLPTokenAddress(lpToken.address);

    await potatoToken.sendLiquidityToLPContract(liquidityPool.address);
  });

  describe("Retrieve Address", () => {
    it("Check all address", async () => {
      console.log("Liquidity deployed to:", liquidityPool.address);
      console.log("Router deployed to:", potatoRouter.address);
      console.log("LP token deployed to:", lpToken.address);
      console.log("Potato token deployed to:", potatoToken.address);
    });
  });

  describe("Swapping", () => {
    it("Swaps 5 POT for close to 1 ETH", async () => {
      const balanceBeforeSwap = await provider.getBalance(addr[0].address);

      await expect(() =>
        potatoRouter.connect(addr[0]).swapTokens(parseEther("5"))
      ).to.changeTokenBalances(
        potatoToken,
        [liquidityPool, addr[0]],
        [parseEther("5"), parseEther("-5")]
      );

      const balanceAfterSwap = await provider.getBalance(addr[0].address);

      expect(balanceAfterSwap.sub(balanceBeforeSwap)).to.be.closeTo(
        parseEther("1"),
        parseEther("1")
      );
    });

    it("Swaps 5 ETH for close to 25 POT", async () => {
      const balanceBeforeSwap = await potatoToken.balanceOf(addr[0].address);

      await expect(() =>
        potatoRouter.connect(addr[0]).swapTokens(0, { value: parseEther("5") })
      ).to.changeEtherBalances(
        [liquidityPool, addr[0]],
        [parseEther("5"), parseEther("-5")]
      );

      const balanceAfterSwap = await potatoToken.balanceOf(addr[0].address);

      console.log("balanceBeforeSwap", balanceBeforeSwap);
      console.log("balanceAfterSwap", balanceAfterSwap);
      expect(balanceAfterSwap.sub(balanceBeforeSwap)).to.be.closeTo(
        parseEther("25"),
        parseEther("2")
      );
    });

    // it("Swaps 6 ETH for close to 25 POT", async () => {
    //   const balanceBeforeSwap1 = await potatoToken.balanceOf(addr[1].address);

    //   await expect(() =>
    //     potatoRouter.connect(addr[1]).swapTokens(0, { value: parseEther("6") })
    //   ).to.changeEtherBalances(
    //     [liquidityPool, addr[1]],
    //     [parseEther("6"), parseEther("-6")]
    //   );

    //   const balanceAfterSwap1 = await potatoToken.balanceOf(addr[1].address);

    //   console.log("balanceBeforeSwap", balanceBeforeSwap1);
    //   console.log("balanceAfterSwap", balanceAfterSwap1);
    //   expect(balanceAfterSwap1.sub(balanceBeforeSwap1)).to.be.closeTo(
    //     parseEther("25"),
    //     parseEther("2")
    //   );
    // });
  });

  describe("Depositing", () => {
    it("Deposit initial amount with 100ETH and 500POT", async () => {
      const liquidityPoolPOTBalance = await potatoToken.balanceOf(
        liquidityPool.address
      );
      const liquidityPoolETHBalance = await provider.getBalance(
        liquidityPool.address
      );

      expect(liquidityPoolPOTBalance).to.be.equal(parseEther("500"));
      expect(liquidityPoolETHBalance).to.be.equal(parseEther("100"));

      console.log("Balance ETH:", liquidityPoolETHBalance);
      console.log("Balance POT:", liquidityPoolPOTBalance);
    });

    it("Mints initial LP tokens and assigns to Potato Token contract", async () => {
      const lpOfPotatoToken = await lpToken.balanceOf(potatoToken.address);

      /*
       * Potato Token contract sent 100 eth and 500 tokens, so it should have
       * sqrt(100 * 500), around 223.60 LP tokens
       */
      expect(lpOfPotatoToken).to.be.within(
        parseEther("223"),
        parseEther("224")
      );
    });

    // it("Transfers ETH and Potato Token to Liquidity Pool", async () => {
    //   await expect(() =>
    //     potatoRouter
    //       .connect(addr[0])
    //       .addLiquidity(parseEther("1"), { value: parseEther("0.2") })
    //   ).to.changeEtherBalances(
    //     [addr[0], liquidityPool],
    //     [parseEther("-0.2"), parseEther("0.2")]
    //   );
    //   const totalSupplyyyy = await lpToken.totalSupply();
    //   console.log("TOTAL supply", totalSupplyyyy);
    // });

    it("Mints and assigns LP tokens", async () => {
      await potatoRouter
        .connect(addr[0])
        .addLiquidity(parseEther("1"), { value: parseEther("0.2") }); //POT & ETH // need 5 to 1 (Balance)

      const lpBalance = await lpToken.balanceOf(addr[0].address);

      const totalSupplyy = await lpToken.totalSupply();
      console.log("TOTAL supply", totalSupplyy);

      const ERR = await liquidityPool.getReserves();
      console.log("Ethe R", ERR);
      console.log("TOTAL LP", lpBalance);
      //expect(lpBalance).to.be.within(parseEther("0.44"), parseEther("0.45"));
    });

    it("Mints and assigns LP tokens", async () => {
      await potatoRouter
        .connect(addr[1])
        .addLiquidity(parseEther("11"), { value: parseEther("2.2") });

      const lppBalance = await lpToken.balanceOf(addr[1].address);

      const totalSupplyyy = await lpToken.totalSupply();
      console.log("TOTAL supply", totalSupplyyy);

      const ER = await liquidityPool.getReserves();
      console.log("Ethe R", ER);
      console.log("TOTAL LP", lppBalance);
      //expect(lpBalance).to.be.within(parseEther("0.44"), parseEther("0.45"));
    });
  });

  describe("Withdrawing (Withdraw Potato & ETH deposited, BURN LP Token)", () => {
    it("Deposits and withdraws close to the same ether amount", async () => {
      await potatoRouter
        .connect(addr[0])
        .addLiquidity(parseEther("25"), { value: parseEther("5") });

      const liquidityPoolETHBalanceBefore = await provider.getBalance(
        liquidityPool.address
      );
      const userBalanceBefore = await provider.getBalance(addr[0].address);

      await potatoRouter.connect(addr[0]).pullLiquidity();

      const liquidityPoolETHBalanceAfter = await provider.getBalance(
        liquidityPool.address
      );
      const userBalanceAfter = await provider.getBalance(addr[0].address);

      console.log(
        "liquidityPoolETHBalanceBefore",
        liquidityPoolETHBalanceBefore
      );
      console.log("userBalanceBefore", userBalanceBefore);
      console.log("liquidityPoolETHBalanceAfter", liquidityPoolETHBalanceAfter);
      console.log("userBalanceAfter", userBalanceAfter);

      //Close to 5 can (+ - 3)
      expect(
        liquidityPoolETHBalanceBefore.sub(liquidityPoolETHBalanceAfter)
      ).to.be.closeTo(parseEther("5"), parseEther("3"));

      expect(userBalanceAfter.sub(userBalanceBefore)).to.be.closeTo(
        parseEther("5"),
        parseEther("3")
      );
    });

    it("Deposits and withdraws close to the same POT amount", async () => {
      await potatoRouter
        .connect(addr[0])
        .addLiquidity(parseEther("25"), { value: parseEther("5") });

      const liquidityPoolPOTBalanceBefore = await potatoToken.balanceOf(
        liquidityPool.address
      );
      const userBalanceBefore = await potatoToken.balanceOf(addr[0].address);

      await potatoRouter.connect(addr[0]).pullLiquidity();

      const liquidityPoolPOTBalanceAfter = await potatoToken.balanceOf(
        liquidityPool.address
      );
      const userBalanceAfter = await potatoToken.balanceOf(addr[0].address);

      console.log(
        "liquidityPoolPOTBalanceBefore",
        liquidityPoolPOTBalanceBefore
      );
      console.log("userBalanceBefore", userBalanceBefore);
      console.log("liquidityPoolPOTBalanceAfter", liquidityPoolPOTBalanceAfter);
      console.log("userBalanceAfter", userBalanceAfter);

      expect(
        liquidityPoolPOTBalanceBefore.sub(liquidityPoolPOTBalanceAfter)
      ).to.be.closeTo(parseEther("25"), parseEther("3"));

      expect(userBalanceAfter.sub(userBalanceBefore)).to.be.closeTo(
        parseEther("25"),
        parseEther("3")
      );
    });
  });
});
