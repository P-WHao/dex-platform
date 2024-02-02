import React, { useEffect, useState, useCallback } from "react";
import { callContractMethod } from "../../utils";
import { toast } from "react-toastify";
import useContract from "../../utils/hooks/useContract";
import useMetamaskAccount from "../../utils/hooks/useMetamaskAcc";
import TokensPurchased from "../TokensPurchased/TokensPurchased";
import DepositETH from "../DepositETH/DepositETH";
import OwnerActions from "../Owner/Owner";
import { POTATO_TOKEN } from "../../utils/constantContractName";

const FundingForm = () => {
  const [owner, setOwner] = useState(null);
  const potatoToken = useContract(POTATO_TOKEN, true);
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

  return (
    <div>
      {account && potatoToken ? (
        <>
          <TokensPurchased potatoToken={potatoToken} account={account} />
          <DepositETH potatoToken={potatoToken} account={account} />
          {/* <br></br> */}
          {<OwnerActions potatoToken={potatoToken} />}
          {/* account === owner &&  */}
        </>
      ) : (
        "Updating... Please Connect Metamask Wallet and Refresh your Browser"
      )}
    </div>
  );
};

export default FundingForm;
