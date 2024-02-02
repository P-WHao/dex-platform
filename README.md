# 🏗 Basic Sample Hardhat Project - DEX

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/deploy.js
npx hardhat help
```

# 🏄‍ Quick Start
To deploy the DEX Exchange:

> Initialize Smart Contract:

```shell
npm install
npx hardhat compile
```

> Initialize Frontend:

```shell
cd frontend
npm install
```

# 🛠 Build
Initialize Deployment:

> First, generate few hardhat node at the root folder of the DEX:

```shell
cd ..
npx hardhat node
```

> In a second terminal window, start contracts deployment:

```shell
npx hardhat run --network localhost scripts/deploy.js
```

> In a third terminal window, start frontend deployment:

```shell
cd frontend
npm start
```

When you deployed, the owner address for this contract is 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 <br />
You may get the private key from your first terminal <br />
📱 Open http://localhost:3000 to see the app