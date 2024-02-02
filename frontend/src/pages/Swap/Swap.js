import React, { useCallback, useEffect, useState } from "react";
import {
  LIQUIDITY_POOL,
  POTATO_TOKEN,
  POTATO_ROUTER,
} from "../../utils/constantContractName";
import Loading from "../Loading/Loading";
import useContract from "../../utils/hooks/useContract";
import "./style.css";
import {
  bigNumberToDecimal,
  callContractMethod,
  showContractResponse,
} from "../../utils";
import { toast } from "react-toastify";
import { parseEther } from "ethers/lib/utils";

import ethLogo from "../../eth-logo.png";
import tokenLogo from "../../potato-logo.png";

//When swap the DEX will charge for 1% transaction fees
//(When u swap 2ETH for 9.98POT, your wallet will only have 9.88POT as 0.998POT will be charge as transaction fees)
const Swap = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [inputAmount, setInputAmount] = useState("");
  const [inputToken, setInputToken] = useState("ETH");
  const [areFundsMoved, setAreFundsMoved] = useState();

  const [ethReserve, setEthReserve] = useState("");
  const [potReserve, setPotReserve] = useState("");

  const potatoRouter = useContract(POTATO_ROUTER, true);
  const potatoToken = useContract(POTATO_TOKEN, true);
  const lp = useContract(LIQUIDITY_POOL, true);

  const handleInputChange = (eventValue) => {
    const value = eventValue
      .replace(/[^.\d]/g, "")
      .replace(/^(\d*\.?)|(\d*)\.?/g, "$1$2");
    setInputAmount(value);
  };

  const switchInput = () => {
    setInputToken((prevState) => (prevState === "ETH" ? "POT" : "ETH"));
  };

  //Check whether owner move the fund to pool (if yes then set fundAlrdMove to true)
  const getFundsMovedOrNot = useCallback(async () => {
    const { result, error } = await callContractMethod(() =>
      potatoToken.fundMoved()
    );

    if (error) {
      return toast.error(error);
    }

    setAreFundsMoved(result);
  }, [potatoToken]);

  //Get the pool reserve from liquidity pool contract
  const getCurrentReserves = useCallback(async () => {
    const { result, error } = await callContractMethod(() => lp.getReserves());

    if (error) {
      return toast.error(error);
    }

    const reserves = result.map((reserve) => bigNumberToDecimal(reserve));
    setEthReserve(reserves[0]);
    setPotReserve(reserves[1]);
  }, [lp]);

  //Swap then pass to backend (Return the result)
  const swapTokens = async () => {
    if (inputAmount <= 0) {
      return toast.error("You can't swap zero!");
    }
    const methodToCall = () =>
      inputToken === "ETH"
        ? potatoRouter.swapTokens(0, { value: parseEther(inputAmount) })
        : potatoRouter.swapTokens(parseEther(inputAmount));

    const { result, error } = await callContractMethod(methodToCall);

    if (error) {
      return toast.error(error);
    }

    showContractResponse(result, error, toast);
  };

  //Display live result (output) for user using xyk
  const calculateTradedAmount = () => {
    const product = ethReserve * potReserve;

    let amountToGet;
    if (inputToken === "ETH") {
      const y = product / (ethReserve + parseFloat(inputAmount));
      amountToGet = potReserve - y;
    } else {
      const x = product / (potReserve + parseFloat(inputAmount));
      amountToGet = ethReserve - x;
    }
    return amountToGet.toFixed(2);
  };

  useEffect(() => {
    if (potatoRouter && lp && potatoToken) {
      getCurrentReserves();
      getFundsMovedOrNot();
      setIsLoading(false);
    }
  }, [potatoRouter, lp, potatoToken, getCurrentReserves, getFundsMovedOrNot]);

  if (areFundsMoved === false) {
    return "It still in FUNDING phase ! !";
  }

  return (
    <Loading isLoading={isLoading}>
      <div className="container_Swap">
        <div className="d-flex justify-content-between">
          <div className="input1">
            <span className="float-left text-muted">Input</span>
          </div>
          <div className="input2">
            {inputToken === "ETH" ? "ETH Reserves: " : "POT Reserves: "}
            <strong>{inputToken === "ETH" ? ethReserve : potReserve}</strong>
          </div>
        </div>

        <div className="input-group mb-4">
          <input
            type="text"
            value={inputAmount}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={`${inputToken} amount...`}
            className="form-control form-control-lg form-control"
          />
          <div className="input-group-append">
            <div className="input-group-text">
              <img
                src={inputToken === "ETH" ? ethLogo : tokenLogo}
                width="35"
                height="34"
                alt=""
              />
              &nbsp; {inputToken}
            </div>
          </div>
        </div>

        {/* Change to Sell Form Button */}
        <div className="d-flex justify-content-center">
          <button
            className="btn btn-outline-dark"
            type="button"
            onClick={switchInput}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-arrow-down-up"
              viewBox="0 0 16 16"
            >
              <path
                fill-rule="evenodd"
                d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5zm-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5z"
              />
            </svg>
          </button>
        </div>

        <div className="d-flex justify-content-between">
          <div className="input1">
            <span className="float-left text-muted">Output</span>
          </div>
          <div className="input2">
            {inputToken === "POT" ? "ETH Reserves: " : "POT Reserves: "}
            <strong>{inputToken === "POT" ? ethReserve : potReserve}</strong>
          </div>
        </div>

        <div className="input-group mb-2">
          <input
            disabled
            type="text"
            value={calculateTradedAmount()}
            placeholder="0"
            className="estimated-amount form-control form-control-lg"
          />
          <div className="input-group-append">
            <div className="input-group-text">
              <img
                src={inputToken === "ETH" ? tokenLogo : ethLogo}
                width="35"
                height="34"
                alt=""
              />
              &nbsp; {inputToken === "ETH" ? "POT" : "ETH"}
            </div>
          </div>
        </div>

        <div className="mb-2">
          <span className="float-left text-muted">Exchange Rate</span>
          <span className="float-right text-muted">
            {" "}
            1 {inputToken === "ETH" ? "ETH" : "POT"} ={" "}
            {inputToken === "ETH"
              ? (calculateTradedAmount() / inputAmount).toFixed(2)
              : (calculateTradedAmount() / inputAmount).toFixed(2)}{" "}
            {inputToken === "ETH" ? "POT" : "ETH"}
          </span>
        </div>
        <div className="d-flex justify-content-between">
          <button class="buttonbtm btn btn-secondary " onClick={swapTokens}>
            SWAP
          </button>
        </div>
      </div>
    </Loading>
  );
};

export default Swap;
