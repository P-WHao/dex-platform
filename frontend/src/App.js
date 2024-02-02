import logo from "./logo.svg";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import "react-tabs/style/react-tabs.css";

//For top right metamask
import React, { useEffect, useState, useCallback, Component } from "react";
import { toast } from "react-toastify";

//Use hook to call contract
import useContract from "./utils/hooks/useContract";
import { POTATO_TOKEN } from "./utils/constantContractName";

import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { ToastContainer } from "react-toastify";

import FundingForm from "./pages/FundingForm/FundingForm";
import ManagePool from "./pages/ManageLiquidity/ManagePool";
import Swap from "./pages/Swap/Swap";

import tokenLogo from "./nav-potato.png";
import walletLogo from "./wallet-logo.png";
import ethLogo from "./eth-logo.png";
//For top right metamask
import { callContractMethod } from "./utils";
import useMetamaskAccount from "./utils/hooks/useMetamaskAcc";

const App = () => {
  const potatoToken = useContract(POTATO_TOKEN);

  //For top right metamask
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

  return (
    <div className="pt-5 bg-color-la">
      <nav className="navbar navbar-light fixed-top bg-light flex-md-nowrap p-0 shadow">
        <a
          className="navbar-brand col-sm-3 col-md-2 mr-0"
          //href="http://www.dappuniversity.com/bootcamp"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={tokenLogo}
            width="30"
            height="30"
            class="space-with-left d-inline-block align-top"
            alt=""
          />
          PotatoSwap
        </a>

        {/* For top right metamask */}
        <small className="text-secondary">
          <small id="account" className="space-with">
            {account}
          </small>

          <img
            src={walletLogo}
            className="space-with ml-2"
            width="30"
            height="30"
            alt=""
          />
        </small>
      </nav>

      <div class="eth_logo">
        <button class="btn btn-secondary  rounded-pill " type="button">
          <img
            src={ethLogo}
            width="30"
            height="30"
            margin-right="10px"
            class="d-inline-block align-top mr-2"
            alt=""
          />
          Ethereum
        </button>
      </div>

      <u>
        <h1 class="potCoin">POTATO SWAP</h1>
      </u>

      {potatoToken ? (
        <>
          <div class="display_menu">
            <Tabs>
              <TabList>
                <Tab>Funding</Tab>
                <Tab>Swap</Tab>
                <Tab>Manage Liquidity</Tab>
              </TabList>

              <TabPanel>
                <FundingForm />
              </TabPanel>
              <TabPanel>
                <Swap />
              </TabPanel>
              <TabPanel>
                <ManagePool />
              </TabPanel>
            </Tabs>
            <ToastContainer />
          </div>
        </>
      ) : (
        "Please connect your wallet to use the dapp!"
      )}
    </div>
  );
};

export default App;
