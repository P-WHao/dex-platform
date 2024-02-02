import { parseEther } from "ethers/lib/utils";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  callContractMethod,
  showContractResponse,
  bigNumberToDecimal,
} from "../../../utils";
import "./style.css";

import { LIQUIDITY_POOL } from "../../../utils/constantContractName";

import ethLogo from "../../../eth-logo.png";
import tokenLogo from "../../../potato-logo.png";

import useContract from "../../../utils/hooks/useContract";

const AddPool = ({ potatoRouter }) => {
  const [allowCustomAmounts, setAllowCustomAmounts] = useState(true);
  const [ethAmount, setEthAmount] = useState("");
  const [potAmount, setPotAmount] = useState("");

  const [ethReserve, setEthReserve] = useState("");
  const [potReserve, setPotReserve] = useState("");

  const lp = useContract(LIQUIDITY_POOL, true);

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

  const handleInputChange = (token, eventValue) => {
    const value = eventValue
      .replace(/[^.\d]/g, "")
      .replace(/^(\d*\.?)|(\d*)\.?/g, "$1$2");

    if (token === "eth") {
      setEthAmount(value);

      const product = ethReserve * potReserve;
      const addedEthReserve = ethReserve + parseFloat(value);
      const leftPOTinPool = product / addedEthReserve;
      const toGiveUserPot = potReserve - leftPOTinPool;
      const toCalGiveUserPotOne = toGiveUserPot / parseFloat(value);

      if (allowCustomAmounts) setPotAmount(value * toCalGiveUserPotOne);
    } else if (token === "pot") {
      setPotAmount(value);

      const product = ethReserve * potReserve;
      const addedPotReserve = potReserve + parseFloat(value);
      const leftEthinPool = product / addedPotReserve;
      const toGiveUserEth = ethReserve - leftEthinPool;
      const toCalGiveUserEthOne = toGiveUserEth / parseFloat(value);

      if (allowCustomAmounts) setEthAmount(value * toCalGiveUserEthOne);
    }
  };

  const depositLiquidity = async () => {
    if (ethAmount <= 0 && potAmount <= 0) {
      return toast.error("You can't add both 0!");
    }

    const { result, error } = await callContractMethod(() =>
      potatoRouter.addLiquidity(parseEther(potAmount.toString()), {
        value: parseEther(ethAmount.toString()),
      })
    );

    showContractResponse(result, error, toast);
  };

  const handleCheckboxClick = () => {
    setAllowCustomAmounts((prevState) => !prevState);

    //Have some bug XD
    if (!allowCustomAmounts) setPotAmount(ethAmount * 5);
  };

  useEffect(() => {
    if (lp) {
      getCurrentReserves();
    }
  }, [lp, getCurrentReserves]);

  return (
    <div className="container-big">
      <h3>Add Liquidity</h3>
      <div className="input-amounts mt-4">
        <div className="input-group mb-4">
          <input
            type="text"
            value={ethAmount}
            placeholder="ETH amount..."
            onChange={(e) => handleInputChange("eth", e.target.value)}
            className="form-control form-control-lg"
          />

          <div className="input-group-append">
            <div className="input-group-text">
              <img src={ethLogo} width="35" height="34" alt="" />
              &nbsp; ETH
            </div>
          </div>
        </div>
        <div className="input-group mb-4">
          <input
            type="text"
            value={potAmount}
            placeholder="POT amount..."
            onChange={(e) => handleInputChange("pot", e.target.value)}
            className="form-control form-control-lg"
          />
          <div className="input-group-append">
            <div className="input-group-text">
              <img src={tokenLogo} width="35" height="34" alt="" />
              &nbsp; POT
            </div>
          </div>
        </div>
        {/* <div className="assist-container">
          <label>
            <input
              type="checkbox"
              name="assist-on"
              value={allowCustomAmounts}
              onChange={handleCheckboxClick}
            />{" "}
            Allow custom amounts
          </label>
        </div> */}
      </div>
      {ethAmount && potAmount ? (
        <div className="add_liquiditybtn d-flex justify-content-between mt-4">
          <button
            onClick={depositLiquidity}
            className="buttonbtm btn btn-secondary "
          >
            Add liquidity
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default AddPool;
