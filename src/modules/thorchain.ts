/*

    Get coins supported

    Get rate for pair

    get deposit address

    start shift
        send x amount
            estimate return

    view all shifts



 */

// @ts-ignore
const TAG = " | thorchain | "
const log = require("loggerdog-client")();

let midgard = require("@pioneer-platform/midgard-client")

let coins = [
    'BTC',
    'BNB',
    'ETH'
]

module.exports = {
    getCoins: function () {
        return get_coins();
    },
    getRate: function () {
        return get_rate();
    },
    getDepositAddress: function (coin:string) {
        return get_deposit_address(coin);
    },
}

const get_rate = async function () {
    let tag = TAG + " | get_rate | "
    try {


        return true
    } catch (e) {
        log.error(tag, "e: ", e)
    }
}

const get_coins = async function () {
    let tag = TAG + " | get_coins | "
    try {
        return coins
    } catch (e) {
        log.error(tag, "e: ", e)
    }
}

const get_deposit_address = async function (coin:string) {
    let tag = TAG + " | get_deposit_addresses | "
    try {

        let depositAddresses = await midgard.getPoolAddress()

        let addressMap:any = {}
        for(let i = 0; i < depositAddresses.length; i++){
            let addressInfo = depositAddresses[i]
            let address = addressInfo.address
            let chain = addressInfo.chain
            addressMap[chain] = address
        }

        if(addressMap[coin]){
            return addressMap[coin]
        } else {
            log.error(tag," Address not found for coin: ",coin)
        }
    } catch (e) {
        log.error(tag, "e: ", e)
    }
}
