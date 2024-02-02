import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import "./style.css";
import walletLogo from "../../wallet-logo.png";
import { bigNumberToDecimal, callContractMethod } from "../../utils";

const TokensPurchased = ({ potatoToken, account }) => {
  const [tokens, setTokens] = useState(null);

  const getTokensAssigned = useCallback(async () => {
    const { result, error } = await callContractMethod(() =>
      potatoToken.balancesToClaim(account)
    );

    if (error) {
      return toast.error(error);
    }

    const tokens = bigNumberToDecimal(result);
    setTokens(tokens);
  }, [account, potatoToken]);

  useEffect(() => {
    getTokensAssigned();
  }, [potatoToken, account, getTokensAssigned]);

  useEffect(() => {
    const filter = potatoToken.filters.TokensBought(account);
    potatoToken.on(filter, () => getTokensAssigned());
  }, [potatoToken, account, getTokensAssigned]);

  return tokens >= 0 ? (
    <div className="wallet-info text-center">
      {/* <div className="walletdisplay">
      <img src={walletLogo} className="ml-2" width='30' height='30' alt="" />
      <div>
        <strong> :</strong> {account}

      </div>
      </div> */}

      <div>
        You have funded : <strong>{tokens} POT</strong>
      </div>
    </div>
  ) : (
    "Loading... (Make sure you are on the correct network!)"
  );
};

export default TokensPurchased;
