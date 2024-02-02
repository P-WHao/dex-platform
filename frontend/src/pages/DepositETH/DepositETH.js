import { parseEther } from "ethers/lib/utils";
import React, { useState, Component } from "react";
import { toast } from "react-toastify";
import { callContractMethod, showContractResponse } from "../../utils";
import "./style.css";

import ethLogo from "../../eth-logo.png";
import tokenLogo from "../../potato-logo.png";

//Funding
const DepositETH = ({ potatoToken }) => {
  const [amount, setAmount] = useState("");

  //Handle how many digit to input
  const handleAmountChange = (e) => {
    const limit = e.target.value.includes(".") ? 7 : 6;
    if (e.target.value.length < limit) {
      setAmount(e.target.value.replace(/[^\d.]/g, ""));
    }
  };

  const contribute = async () => {
    if (amount <= 0) {
      return toast.error("You can't donate zero!");
    }

    const { result, error } = await callContractMethod(() =>
      potatoToken.contribute({ value: parseEther(amount) })
    );

    showContractResponse(result, error, toast);
    setAmount("");
  };

  

  return (
    <div className="deposit-eth-container">
      <div className="depositTxt">
        <span className=" text-muted">Amount to contribute: </span>
      </div>
      <div className="input-group mb-4">
        <input
          type="text"
          value={amount}
          placeholder="0"
          className="contribute-amount form-control form-control-lg"
          onChange={handleAmountChange}
        />
        {""}

        <div className="input-group-append">
          <div className="input-group-text">
            <img src={ethLogo} width="35" height="34" alt="" />
            &nbsp; ETH
          </div>
        </div>
      </div>

      <div className="depositTxt">
        <span className="text-muted">Will get you: </span>
      </div>

      <div className="input-group mb-4">
        <input
          disabled
          type="text"
          value={amount * 5}
          placeholder="0"
          className="estimated-amount form-control form-control-lg"
        />
        <div className="input-group-append">
          <div className="input-group-text">
            <img src={tokenLogo} width="35" height="34" alt="" />
            &nbsp; POT
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-center">
        <button
          type="button"
          class="buttonbtm btn btn-secondary "
          onClick={contribute}
        >
          Contribute
        </button>
      </div>

      
    </div>
  );
};

export default DepositETH;
