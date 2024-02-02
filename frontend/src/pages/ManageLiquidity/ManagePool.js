import React, { useCallback, useState, useEffect } from "react";
import { toast } from "react-toastify";
import AddPool from "./AddPool/AddPool";
import { bigNumberToDecimal, callContractMethod } from "../../utils";
import {
  POTATO_TOKEN,
  LIQUIDITY_POOL,
  LPTOKEN,
  POTATO_ROUTER,
} from "../../utils/constantContractName";
import useContract from "../../utils/hooks/useContract";
import useMetamaskAccount from "../../utils/hooks/useMetamaskAcc";
import RemovePool from "./WithdrawLiquidity/RemovePool";
import Loading from "../Loading/Loading";
import "./style.css";

const ManagePool = () => {
  const lp = useContract(LIQUIDITY_POOL, true);
  const lpToken = useContract(LPTOKEN, true);
  const potatoRouter = useContract(POTATO_ROUTER, true);
  const potatoToken = useContract(POTATO_TOKEN, true);
  const account = useMetamaskAccount();

  const [lpBalance, setLPBalance] = useState(null);
  const [areFundsMoved, setAreFundsMoved] = useState();
  const [isLoading, setIsLoading] = useState(true);

  const getFundsMovedOrNot = useCallback(async () => {
    const { result, error } = await callContractMethod(() =>
      potatoToken.fundMoved()
    );

    if (error) {
      return toast.error(error);
    }

    setAreFundsMoved(result);
  }, [potatoToken]);

  const getBalance = useCallback(async () => {
    const { result, error } = await callContractMethod(() =>
      lpToken.balanceOf(account)
    );

    if (error) {
      return toast.error(error);
    }

    setLPBalance(bigNumberToDecimal(result));
  }, [account, lpToken]);

  const getInfo = useCallback(async () => {
    setIsLoading(true);
    if (lp && lpToken && account && potatoToken && potatoRouter) {
      await getBalance();
      await getFundsMovedOrNot();
    }
    setIsLoading(false);
  }, [
    lp,
    lpToken,
    account,
    potatoToken,
    potatoRouter,
    getBalance,
    getFundsMovedOrNot,
  ]);

  useEffect(getInfo, [getInfo]);
  useEffect(() => {
    if (lp) {
      const liquidityAdded = lp.filters.LiquidityAdded(account);
      const liquidityRemoved = lp.filters.LiquidityRemoved(account);

      lp.on(liquidityAdded, getInfo);
      lp.on(liquidityRemoved, getInfo);
    }
  }, [account, getInfo, lp]);

  if (areFundsMoved === false) {
    return "It still in FUNDING phase ! !";
  }

  return (
    <Loading isLoading={isLoading && lpBalance === null}>
      <div className="liquidity-container">
        {lpBalance === 0 ? (
          <AddPool lpBalance={lpBalance} potatoRouter={potatoRouter} />
        ) : (
          <RemovePool lpBalance={lpBalance} potatoRouter={potatoRouter} />
        )}
      </div>
    </Loading>
  );
};

export default ManagePool;
