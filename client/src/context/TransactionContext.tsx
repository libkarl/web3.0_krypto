import React, { Context, useEffect, useState } from "react";
import { ethers } from "ethers";
import { createContext } from "react";
import { contractABI, contractAddress } from "../utils/constants";

declare global {
  interface Window {
    ethereum: any;
    web3: any;
  }
}

type TransactionContextType = {
  connectWallet: () => Promise<void>;
  currentAccount: string;
  handleChange: (e: any, name: any) => void;
  formData: FormDataObject;
  setFormData: React.Dispatch<React.SetStateAction<FormDataObject>>;
  sendTransaction: () => Promise<void>;
  transactions: any;
  isLoading: any;
};

type FormDataObject = {
  addressTo: string;
  amount: string;
  keyword: string;
  message: string;
};

export const TransactionContext = createContext<TransactionContextType | null>(
  null
);

const { ethereum } = window;

// funkce pro fetch vytvořeného kontraktu

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const transactionContract = new ethers.Contract(
    contractAddress,
    contractABI,
    signer
  );

  return transactionContract;
};

type TransactionProviderProps = {
  children: React.ReactNode;
};

export const TransactionProvider = ({ children }: TransactionProviderProps) => {
  const [currentAccount, setCurrentAccout] = useState("");
  const [formData, setFormData] = useState<FormDataObject>({
    addressTo: "",
    amount: "",
    keyword: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [trnsactionCount, setTransactionCount] = useState(
    localStorage.getItem("transactionCount")
  );
  const [transactions, setTransactions] = useState([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    name: string
  ) => {
    // IF you are updateting old state with new state,
    // it is neccessary to use call back func
    // prew state is object which is provided by React framework as previos state
    setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  const getAllTransactions = async () => {
    try {
      if (ethereum) {
        const transactionsContract = getEthereumContract();
        // The get all transactions on the transactionContract object is special function
        // which is created inside my solidity contract
        const availableTransactions =
          await transactionsContract.getAllTransactions();

        const structuredTransactions = availableTransactions.map(
          (transaction: any) => ({
            addressTo: transaction.receiver,
            addressFrom: transaction.sender,
            // there is Bignumber date format inside ethereum objet timestamp field
            // so it has to be converted this way
            timestamp: new Date(
              transaction.timestamp.toNumber() * 1000
            ).toLocaleString(),
            message: transaction.message,
            keyword: transaction.keyword,
            // convert hex dec Gwei amount of ether to just ether
            amount: parseInt(transaction.amount._hex) / 10 ** 18,
          })
        );

        setTransactions(structuredTransactions);
      } else {
        console.log("Ethereum is not present");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfTransactionsExist = async () => {
    try {
      const transactionContract = getEthereumContract();
      const transactionCount = await transactionContract.getTransactionCount();

      window.localStorage.setItem("transactionCount", transactionCount);
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum objet");
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) return alert("Please install metamask");

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        setCurrentAccout(accounts[0]);

        getAllTransactions();
      } else {
        console.log("No accounts find");
      }
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum objet");
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install metamask");
      // pokud je metamask nainstalovaná dostunu list účtů, kte kterým se můžu připojit
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setCurrentAccout(accounts[0]);
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum objet");
    }
  };

  const sendTransaction = async () => {
    console.log("send transaction");
    try {
      if (!ethereum) return alert("Please install metamask");
      const { addressTo, amount, keyword, message } = formData;
      console.log(amount);
      const transactionContract = getEthereumContract();
      // This will parse amount to the Gwei amount
      const prsedAmount = ethers.utils.parseEther(amount);
      // ethereum.rquest just created transaction
      await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: currentAccount,
            to: addressTo,
            gas: "0x5208", // 21 GWEI or 0.000021 ETH
            value: prsedAmount._hex, // convert Gwei to hex
          },
        ],
      });

      // after creating transaction it has to be save in block chain
      // addToBlockchain is my function from solidity contract
      const transactionHash = await transactionContract.addToBlockchain(
        addressTo,
        prsedAmount,
        message,
        keyword
      );

      setIsLoading(true);
      console.log(`Loading - ${transactionHash.hash}`);
      // This will wait until the trnsaction is finished
      await transactionHash.wait();
      setIsLoading(false);
      console.log(`Success - ${transactionHash.hash}`);

      const transactionCount = await transactionContract.getTransactionCount();
      setTransactionCount(transactionCount.toNumber());
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum objet");
    }
  };

  // při prvním načtení aplikace zkontroluje jestli je připojena metamask peněženka
  useEffect(() => {
    checkIfWalletIsConnected();
    checkIfTransactionsExist();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        connectWallet,
        currentAccount,
        formData,
        setFormData,
        handleChange,
        sendTransaction,
        transactions,
        isLoading,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
