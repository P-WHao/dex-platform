import React from "react";
import { toast } from "react-toastify";
import {
  callContractMethod,
  showContractResponse,
} from "../../../utils";
import "./style.css";

const RemovePool = ({ potatoRouter, lpBalance }) => {
  const removePool = async () => {
    const { result, error } = await callContractMethod(() =>
      potatoRouter.pullLiquidity()
    );

    showContractResponse(result, error, toast);
  };

  return (
    <>
      <div className="ownings">
        You currently own:<strong> {lpBalance} LP Tokens</strong>
      </div>
      <div className="remove_liquiditybtn d-flex justify-content-between mt-4">
        <button onClick={removePool} className="buttonbtm btn btn-secondary">
          Withdraw liquidity
        </button>
      </div>
    </>
  );
};

export default RemovePool;
