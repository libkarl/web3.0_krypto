// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

contract Transactions { 
        uint256 transactionCount;
        // The time stamp will be a number that is going to say when we did send out transfer
        event Transfer(address from, address receiver, uint amount, string message, uint256 timestamp, string keyword);
       

        struct TransferStruct {
                address sender;
                address receiver;
                uint amount;
                string message;
                uint256 timestamp;
                string keyword;
        }
        
        // definice array with different transaction

        TransferStruct[] public transactions;
        // string memory message are just specific data stored in the memory of that transaction
        // it is not require, message are just additional data
        function addToBlockchain(address payable receiver, uint amount, string memory message, string memory keyword) public{
                transactionCount += 1;
                transactions.push(TransferStruct(msg.sender, receiver, amount, message, block.timestamp, keyword));

                emit Transfer(msg.sender, receiver, amount, message, block.timestamp, keyword);
        }

        // This function will return array of different transaction which will be taken from the memory 
        function getAllTransactions() public view returns (TransferStruct[] memory){
                return transactions;
        }

        // This func will be return transaction count
        function getTransactionCount() public view returns (uint256){
              return transactionCount; 
        }
}