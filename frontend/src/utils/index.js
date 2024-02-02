import PotatoToken from "../artifacts/contracts/PotatoToken.sol/PotatoToken.json";
import LiquidityPool from "../artifacts/contracts/LiquidityPool.sol/LiquidityPool.json";
import PotatoRouter from "../artifacts/contracts/PotatoRouter.sol/PotatoRouter.json";
import LPToken from "../artifacts/contracts/LPToken.sol/LPToken.json";

import { BigNumber } from "ethers";
import { ethers } from "ethers";

export const requestAccount = async () => {
  const [account] = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  return account;
};

//Get contract Instance
export const getContractInstance = async (
  contractToGet,
  withSigner = false
) => {
  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    let contract, signer;
    if (withSigner) {
      await requestAccount();
      signer = getSigner(provider);
    }
    contract = new ethers.Contract(
      contracts[contractToGet].address,
      contracts[contractToGet].abi,
      signer || provider
    );
    return contract;
  }
};

//This important
export const getSigner = (provider) => {
  if (window.ethereum) {
    const signer = provider.getSigner();
    return signer;
  }
};

//Call the contract method
export const callContractMethod = async (method) => {
  let error, result;
  try {
    result = await method();
  } catch (e) {
    error = returnError(e.error || e);
  }
  return {
    error,
    result,
  };
};

//Set contract address
export const contracts = {
  POTATO_TOKEN: {
    abi: PotatoToken.abi,
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  },
  LIQUIDITY_POOL: {
    abi: LiquidityPool.abi,
    address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  },
  LPTOKEN: {
    abi: LPToken.abi,
    address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  },
  POTATO_ROUTER: {
    abi: PotatoRouter.abi,
    address: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  },
};

const getErrorBackend = (revertReason) => {
  console.log(revertReason);
  const revertErrors = [
    "NOT_OWNER",
    "NO_TOKENS",
    "FUND_END",
    "User denied transaction",
    "errorSignature=null",
    "insufficient funds",
    "FUNDS_IS_ZERO",
  ];

  const error = revertErrors.find((errorConstant) =>
    revertReason.includes(errorConstant)
  );

  return showErrorMessage(error);
};

const showErrorMessage = (error) => {
  switch (error) {
    case "NOT_OWNER":
      return "Are you sure you are the OWNER?";
    case "FUND_END":
      return "Funding Process Ended and have been moved to the Liquidity Pool!";
    case "NO_TOKENS":
      return "You don't have enough POT token!";
    case "User denied transaction":
      return "Transaction denied by user!";
    case "errorSignature=null":
      return "Error getting contract! Are you on the hardhat local network?";
    case "insufficient funds":
      return "Insufficient funds!";
    case "FUNDS_IS_ZERO":
      return "Total Contribute is ZERO!";
    default:
      return "An error occured when calling this method!";
  }
};

export const returnError = (error) => {
  let errorReason = getErrorBackend(error?.message);

  return errorReason;
};

export const showContractResponse = async (result, error, toast) => {
  if (error) {
    return toast.error(error);
  }

  toast.success(
    "Transaction sent! Waiting for confirmation from the network..."
  );
  await result.wait();
  toast.success("Transaction confirmed!");
};

export const bigNumberToDecimal = (number) => {
  //The contract has 18 decimals so this will show 2
  const decimals = BigNumber.from("10000000000000000");
  const tokens = number.div(decimals).toString();
  //To move the comma two spaces left, we need to divide 100
  return tokens / 100;
};
