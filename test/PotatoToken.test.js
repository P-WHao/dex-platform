const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseEther } = require("ethers/lib/utils");

describe("PotatoToken TEST", function () {
  let owner,
    potatoToken,
    totalToken,
    addr1,
    addr2,
    addr,
    liquidityPool,
    lpToken;

  beforeEach(async () => {
    [owner, addr1, addr2, ...addr] = await ethers.getSigners();

    const PotatoToken = await ethers.getContractFactory("PotatoToken");
    totalToken = addr[3];
    potatoToken = await PotatoToken.deploy(totalToken.address);

    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    liquidityPool = await LiquidityPool.deploy();

    const LPToken = await ethers.getContractFactory("LPToken");
    lpToken = await LPToken.deploy(liquidityPool.address);
  });

  describe("Deployment", () => {
    it("Creates 600,000 available tokens", async () => {
      const supply = await potatoToken.totalSupply();
      expect(supply).to.be.equal("600000000000000000000000");
    });

    it("Check Total Token address", async () => {
      console.log("Potato token deployed to:", totalToken.address);
    });

    it("Potato Token has a name", async () => {
      const name = await potatoToken.name();
      expect(name).to.be.equal("Potato Token");
    });

    it("Potato Token has a symbol POT", async () => {
      const symbol = await potatoToken.symbol();
      expect(symbol).to.be.equal("POT");
    });
  });

  describe("Test for send funds to liquidity pool", () => {
    beforeEach(async () => {
      //Donate 100 eth from 30 different address
      for (let i = 0; i < 30; i++) {
        await potatoToken
          .connect(addr[i])
          .contribute({ value: parseEther("100") });
      }

      //Set Potato Token address
      await liquidityPool.setPotatoTokenAddress(potatoToken.address);

      //Set LP Token address
      await liquidityPool.setLPTokenAddress(lpToken.address);
    });

    it("move 3,000 ETH and 15,000 POT to LP", async () => {
      await potatoToken.sendLiquidityToLPContract(liquidityPool.address);

      const provider = ethers.provider;

      const liquidityPoolPOTBalance = await potatoToken.balanceOf(
        liquidityPool.address
      );
      const liquidityPoolETHBalance = await provider.getBalance(
        liquidityPool.address
      );

      expect(liquidityPoolPOTBalance).to.be.equal(parseEther("15000"));
      expect(liquidityPoolETHBalance).to.be.equal(parseEther("3000"));

      console.log("Balance ETH:", liquidityPoolETHBalance);
      console.log("Balance POT:", liquidityPoolPOTBalance);
    });
  });
});
