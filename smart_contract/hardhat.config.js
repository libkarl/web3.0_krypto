// https://eth-goerli.g.alchemy.com/v2/FNifTFEqv7Bi8i7IXuPa1A_1tF_Lvd2D

require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.0",
  networks: {
    goerli: {
      url: "https://eth-goerli.g.alchemy.com/v2/FNifTFEqv7Bi8i7IXuPa1A_1tF_Lvd2D",
      accounts: [
        "5e6868655030acabacfb29e3fd39b19744f6ff85d6801807dd38b8631b93350f",
      ],
    },
  },
};
