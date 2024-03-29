import { useEffect, useState } from "react";
import { requestAccount } from "../index";

const useMetamaskAcc = () => {
  const [account, setAccount] = useState(undefined);

  const getAccount = async () => {
    const metamaskAccount = await requestAccount();
    setAccount(metamaskAccount);
  };

  useEffect(() => {
    getAccount();
    window.ethereum.on("accountsChanged", getAccount);
    window.ethereum.on("chainChanged", () => window.location.reload());
  }, []);

  return account;
};

export default useMetamaskAcc;
