/*
    Build Tx

        //Stake market
        //const memo = `STAKE:BNB.${this.data.asset.symbol}`;

    SWAP:ETH USDT-0X62E273709DA575835C7F6AEF4A31140CA5B1D190:0x8F9477eDf53B5f93DB702F6C9b1b2E77C8eD92B3


 */

require("dotenv").config({path:'../.env'})


let App = require("@pioneer-platform/pioneer-app")

let password = process.env['WALLET_PASSWORD']
let username = "thorchain-user-1"

console.log("password: ",password)
let run_test = async function(){
    try{

        //get config
        let config = await App.getConfig()
        config.password = password
        console.log("config: ",config)

        config.username = username

        //if no config
        if(!config){
            //init config
            throw Error("Must setup!")
        }

        console.log("config: ",config)
        let resultInit = await App.init(config)
        console.log("resultInit: ",resultInit)

        //get wallets
        let wallets = await App.getWallets()
        console.log("wallets: ",wallets)

        let context = wallets[0]

        let ethBalance = await context.getBalance("BNB")
        console.log("ethBalance: ",ethBalance)

        //get pools

        //add liquidity to pool

        //do swap

        //sendToAddress
        let address = process.env['TEST_BNB_MASTER_SECOND']
        let amount = "0.001"
        let memo = "foo:bar"

        let transfer = {
            coin:"BNB",
            addressTo:address,
            amount,
            memo
        }

        let rawTx = await context.buildTransfer(transfer)
        console.log("rawTx: ",rawTx)

        // let txid = await Wallet.sendToAddress("BNB",address,amount,memo)
        // console.log("txid: ",txid)


    }catch(e){
        console.error(e)
    }
}

run_test()
