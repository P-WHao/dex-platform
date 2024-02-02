import React, { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import {
  callContractMethod,
  contracts,
  showContractResponse,
} from "../../utils";
import useMetamaskAccount from "../../utils/hooks/useMetamaskAcc";
import "./style.css";

const OwnerActions = ({ potatoToken }) => {
  const [areFundsMoved, setAreFundsMoved] = useState();
  const [owner, setOwner] = useState(null);
  const account = useMetamaskAccount();

  const getOwner = useCallback(async () => {
    const { result, error } = await callContractMethod(potatoToken.owner);

    if (error) {
      return toast.error(error);
    }

    setOwner(result.toLowerCase());
  }, [potatoToken]);

  useEffect(() => {
    if (potatoToken && account) {
      getOwner();
    }
  }, [potatoToken, account, getOwner]);

  const getFundsMovedOrNot = useCallback(async () => {
    const { result, error } = await callContractMethod(() =>
      potatoToken.fundMoved()
    );

    if (error) {
      return toast.error(error);
    }

    setAreFundsMoved(result);
  }, [potatoToken]);

  useEffect(() => {
    getFundsMovedOrNot();
    potatoToken.on("FundsMoved", getFundsMovedOrNot);
  }, [potatoToken, getFundsMovedOrNot]);

  //Owner move the fund to pool and open the swap and manage liquidity
  const moveFunds = async () => {
    if (account != owner) {
      return toast.error("Are you sure you are the OWNER?");
    }
    const { result, error } = await callContractMethod(() =>
      potatoToken.sendLiquidityToLPContract(contracts.LIQUIDITY_POOL.address)
    );

    showContractResponse(result, error, toast);
  };

  return (
    <div className="owner-container">
      {!areFundsMoved && <h3>Owner Action!</h3>}
      {!areFundsMoved && (
        <button
          type="button"
          class="buttonownerbtm btn btn-secondary"
          onClick={moveFunds}
        >
          Move funds to Liquidity Pool
        </button>
      )}
      {areFundsMoved && <h3>"Funding Process Ended"</h3>}
    </div>
  );
};

export default OwnerActions;
