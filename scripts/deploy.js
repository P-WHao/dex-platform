// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { hardhatArguments } = require("hardhat");
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const PotatoToken = await hre.ethers.getContractFactory("PotatoToken");

  //Set total token account
  const potatoToken = await PotatoToken.deploy(
    hardhatArguments.network === "localhost"
      ? "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
      : "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
  );
  console.log("Deploying Potato Token");
  await potatoToken.deployed();
  console.log("Potato Token deployed to:", potatoToken.address);

  const LiquidityPool = await hre.ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy();
  console.log("Deploying LiquidityPool");
  await liquidityPool.deployed();
  console.log("Liquidity Pool deployed to:", liquidityPool.address);

  const LPToken = await hre.ethers.getContractFactory("LPToken");
  const lpToken = await LPToken.deploy(liquidityPool.address);
  console.log("Deploying LPToken");
  await lpToken.deployed();
  console.log("LPToken deployed to:", lpToken.address);

  await liquidityPool.setPotatoTokenAddress(potatoToken.address);
  await liquidityPool.setLPTokenAddress(lpToken.address);

  const PotatoRouter = await hre.ethers.getContractFactory("PotatoRouter");
  const potatoRouter = await PotatoRouter.deploy(
    liquidityPool.address,
    potatoToken.address
  );
  console.log("Deploying PotatoRouter");
  await potatoRouter.deployed();
  console.log("Potato Router deployed to:", potatoRouter.address);

  await potatoToken.setRouterAddress(potatoRouter.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
