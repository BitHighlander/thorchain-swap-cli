/*
    Primary App functions

    App cycle



            -Highlander
 */

const TAG = " | App | ";
const log = require("loggerdog-client")();
const App = require("@pioneer-platform/pioneer-app");
const generator = require('generate-password');
const describe = require("describe-export");
const CryptoJS = require("crypto-js")
const vorpal = require("vorpal")();
const bcrypt = require("bcryptjs");
const bip39 = require(`bip39`)

//thorchain
let thor = require("./thorchain")

//midgard
let midgard = require("@pioneer-platform/midgard-client")

import {
    prompt_fio_enable,
    prompt_password_enable,
    prompt_create_wallet,
    prompt_password_create,
    prompt_password_input,
    prompt_seed_input
} from './inquiries'

let FIO_ACCEPT:any
let FIO_REJECT:any
let PASSWORDLESS_ENABLE = false

//global
let help: any = {
    info: "",
};

function standardRandomBytesFunc(size:any) {
    /* istanbul ignore if: not testable on node */
    return CryptoJS.lib.WordArray.random(size).toString()
}

export async function onStart() {
    let tag = TAG + " | onStart | ";
    try {

        //get config
        let config = await App.getConfig()
        log.info(tag,"config: ",config)

        if(!config){
            //TODO prompt language?
            //make config
            await App.initConfig("english");
            await App.updateConfig({created: new Date().getTime()});
            config = await App.getConfig()
        }

        if(config && !config.promptedFio){
            //opt in to FIO
            //if unkown state, request
            if(!FIO_ACCEPT && !FIO_REJECT){
                //prompt
                let accepted = await prompt_fio_enable()
                // @ts-ignore
                if(accepted){
                    App.updateConfig({FIO_ACCEPT:true});
                    App.updateConfig({promptedFio:true});
                    FIO_ACCEPT = true
                } else {
                    App.updateConfig({FIO_REJECT:true});
                    App.updateConfig({promptedFio:true});
                    FIO_REJECT = true
                }
            }
            config = await App.getConfig()
        }

        if(config && !config.promptedPasswordless){
            //prompt
            let accepted = await prompt_password_enable()
            App.updateConfig({promptedPasswordless:true});
            // @ts-ignore
            if(!accepted){
                PASSWORDLESS_ENABLE = true
            }
            config = await App.getConfig()
        }

        if(config && config.temp){
            PASSWORDLESS_ENABLE = true
        }

        /*
            Password setup

            Config password
                //wallet passwords
         */

        let password

        //if passwordless generate
        if(PASSWORDLESS_ENABLE && !config.temp && !config.passwordHash){
            let passwords = generator.generateMultiple(1, {
                length: 10,
                uppercase: false
            });
            password = passwords[0]
            App.updateConfig({temp:password});
            config = await App.getConfig()
        } else if(!PASSWORDLESS_ENABLE && !config.passwordHash){
            //Create NEW password
            let responses = await prompt_password_create()
            log.debug(tag,"create password: ",responses)
            //TODO
            //verify password1 2 match
            if(responses.password !== responses.password2){
                log.info("Invalid input! password dont match!")
                await onStart()
                return
            }
            //verify password not weak

            //if accept
            const hash = bcrypt.hashSync(responses.password, 10);
            await App.updateConfig({passwordHash:hash});
                //hash and create

            //if reject
                //try again

            password = responses.password
        } else if(config.temp){
            password = config.temp
            //

        } else if(config.passwordHash){
            let passwordInput = await prompt_password_input()
            log.info(tag,"passwordInput: ",passwordInput)
            //TODO hash & verify
            let isValid = bcrypt.compareSync(passwordInput, config.passwordHash); // true
            if(!isValid) {
                log.info("Invalid password!")
                await onStart()
                return
            }

            password = passwordInput
        }

        let wallets = await App.getWalletNames()
        log.info(tag,"wallets: ",wallets)

        //if fio get fio username
        let username
        if(config && !config.username && config.FIO_ACCEPT){
            //generate random
            let randomChars = generator.generateMultiple(1, {
                length: 10,
                uppercase: false
            });
            username = "temp:"+randomChars[0]
            config.username = username
        } else if(config && !config.username && config.FIO_REJECT){
            //prompt create username
            throw Error("TODO username prompt")
        }

        //if no wallets
        if(wallets.length > 0){
            //wallet found
            log.info(tag,"Wallets found! ",wallets)

        } else {
            //create wallet
            let type:any = await prompt_create_wallet()
            log.info(tag,"type: ",type)

            // @ts-ignore
            if(type === "create a new wallet") {
                log.info(tag,"create new wallet!")
                // //create a new
                let randomBytesFunc = standardRandomBytesFunc
                const randomBytes = Buffer.from(randomBytesFunc(32), `hex`)
                if (randomBytes.length !== 32) throw Error(`Entropy has incorrect length`)
                let mnemonic = bip39.entropyToMnemonic(randomBytes.toString(`hex`))

                //create
                let wallet:any = {
                    mnemonic,
                    username:config.username,
                    password
                }
                if(config.temp) wallet.temp = config.temp
                //create wallet files
                log.info("1 creating wallet: ",wallet)
                let resultCreate = await App.createWallet('software',wallet)
                log.info("result creating wallet: ",resultCreate)
            } else if (type === "restore from seed") {
                log.info("TODO restore from seed!")
                let seed = await prompt_seed_input()
                //TODO validate seed
                    //if invalid, ask for again
                //create
                let wallet:any = {
                    mnemonic:seed,
                    username:config.username,
                    password
                }
                if(config.temp) wallet.temp = config.temp
                //create wallet files
                log.info("2 creating wallet: ",wallet)
                let resultCreate = await App.createWallet('software',wallet)
                log.info("result creating wallet: ",resultCreate)
            } else if (type === "pair hardware wallet") {
                log.info("pair hardware wallet!")
                throw Error("TODO")
            }
        }


        //start app
        log.info("pre-init CONFIG: ",config)
        if(password) config.password = password
        if(!config.temp && !config.password) throw Error("102: password required for startup! ")

        //

        let resultInit = await App.init(config)
        log.info("resultInit: ",resultInit)

        //if username is temp
        if(config.FIO_ACCEPT && config.username.indexOf("temp:") >= 0){
            //FIO name enable
            let fioPubkey = await App.getFioPubkey()
            log.info(tag,"fioPubkey: ",fioPubkey)

            let usernames = await App.getFioAccountsByPubkey(fioPubkey)
            if(usernames.length === 0){
                //open fio signup
                open("https://reg.fioprotocol.io/ref/shapeshift?publicKey=" + fioPubkey);
            } else {
                username = usernames.fio_addresses[0].fio_address
                if(!username) throw Error("failed to find fio username!")
                App.updateConfig({username});
            }
        }



        //return start failed
        //actions required
            //register config
            //register wallet

        return true
    } catch (e) {
        console.error(tag, "e: ", e);
        return {};
    }
}


export async function loadModule(module:any) {
    let tag = TAG + " | loadModule | ";
    try {

        log.info(tag,"module: ",module)
        const map = describe.map(module);
        log.info(tag,"map: ",map)

        Object.keys(map).forEach(function (key) {
            let tag = TAG + " | " + key + " | ";
            let debug = false;
            log.debug(tag, "key: ", key);
            let expectedParams = map[key];

            log.debug(tag, "expectedParams: ", expectedParams);

            let helpString;
            if (help[key]) helpString = help[key];
            if (!helpString){
                if(expectedParams.length > 1) helpString = " params: " + expectedParams;
            }

            vorpal.command(key, helpString)
                .action(function (args: any, cb: any) {
                    let params = [];

                    if (expectedParams.length > 0) {
                        for (let i = 0; i < expectedParams.length; i++) {
                            let param = {
                                type: "input",
                                name: expectedParams[i],
                                message: "input " + expectedParams[i] + ": ",
                            };
                            params.push(param);
                        }
                    }

                    // @ts-ignore
                    let promise = this.prompt(params, function (answers: any) {
                        // You can use callbacks...
                    });

                    promise.then(async function (answers: any) {
                        log.debug(tag, "answers: ", answers);

                        let parameters: any = [];
                        Object.keys(answers).forEach(function (answer) {
                            parameters.push(answers[answer]);
                        });
                        log.info(tag, "parameters: ", parameters);
                        try {

                            // @ts-ignore
                            const result = await thor[key].apply(this, parameters);
                            log.info("result: ", result);

                            cb()
                        } catch (e) {
                            console.error(tag, "e: ", e);
                        }
                    });
                })
        })

        return true
    } catch (e) {
        console.error(tag, "e: ", e);
        return {};
    }
}


/*
    Run Interactive terminal
 */
export async function onRun() {
    let tag = TAG + " | onRun | ";
    try {

        //get context
        let wallets = await App.getWallets()
        console.log("wallets: ",wallets)

        let context = wallets[0]

        let ethBalance = await context.getBalance("ETH")
        console.log("ethBalance: ",ethBalance)

        // let contextView:any = JSON.parse(JSON.stringify(context))
        let contextView:any = {}
        console.log("contextView: ",contextView)

        let allKeys = Object.keys(context)
        for(let i = 0; i < allKeys.length; i++){
            let key = allKeys[i]
            if(typeof(context[key]) === 'function'){
                contextView[key] = context[key]
            }
        }
        console.log("context: ",context)

        // log.info(tag,"thor: ",thor)
        // const map = describe.map(thor);
        // log.info(tag,"map: ",map)

        //TODO add switch wallet context

        //any more 1 off CLI needs?

        let prompt = "client: ";
        //await loadModule(context)
        await loadModule(thor)


        // Object.keys(map).forEach(function (key) {
        //     let tag = TAG + " | " + key + " | ";
        //     let debug = false;
        //     log.debug(tag, "key: ", key);
        //     let expectedParams = map[key];
        //
        //     log.debug(tag, "expectedParams: ", expectedParams);
        //
        //     let helpString;
        //     if (help[key]) helpString = help[key];
        //     if (!helpString){
        //         if(expectedParams.length > 1) helpString = " params: " + expectedParams;
        //     }
        //
        //     vorpal.command(key, helpString)
        //         .action(function (args: any, cb: any) {
        //             let params = [];
        //
        //             if (expectedParams.length > 0) {
        //                 for (let i = 0; i < expectedParams.length; i++) {
        //                     let param = {
        //                         type: "input",
        //                         name: expectedParams[i],
        //                         message: "input " + expectedParams[i] + ": ",
        //                     };
        //                     params.push(param);
        //                 }
        //             }
        //
        //             // @ts-ignore
        //             let promise = this.prompt(params, function (answers: any) {
        //                 // You can use callbacks...
        //             });
        //
        //             promise.then(async function (answers: any) {
        //                 log.debug(tag, "answers: ", answers);
        //
        //                 let parameters: any = [];
        //                 Object.keys(answers).forEach(function (answer) {
        //                     parameters.push(answers[answer]);
        //                 });
        //                 log.info(tag, "parameters: ", parameters);
        //                 try {
        //
        //                     // @ts-ignore
        //                     const result = await thor[key].apply(this, parameters);
        //                     log.info("result: ", result);
        //
        //                     cb()
        //                 } catch (e) {
        //                     console.error(tag, "e: ", e);
        //                 }
        //             });
        //         })
        // })

        // //getInfo
        // let key = "getInfo"
        // log.debug(tag, "key: ", key);
        // let expectedParams:any = [];
        //
        // log.debug(tag, "expectedParams: ", expectedParams);
        //
        // let helpString;
        // if (help[key]) helpString = help[key];
        // if (!helpString){
        //     if(expectedParams.length > 1) helpString = " params: " + expectedParams;
        // }
        //
        // vorpal.command(key, helpString)
        //     .action(function (args: any, cb: any) {
        //             try{
        //                 let params:any = [];
        //                 log.info("args: ",args)
        //                 // @ts-ignore
        //                 let promise = this.prompt(params, function (answers: any) {
        //                     // You can use callbacks...
        //                 });
        //
        //                 promise.then(async function (answers: any) {
        //                     log.debug(tag, "answers: ", answers);
        //
        //                     let parameters: any = [];
        //                     Object.keys(answers).forEach(function (answer) {
        //                         parameters.push(answers[answer]);
        //                     });
        //                     log.info(tag, "parameters: ", parameters);
        //                     try {
        //
        //                         let result = await midgard.getInfo()
        //                         log.info(tag,"result: ",result.data)
        //
        //                         //create view
        //
        //                         cb()
        //                     } catch (e) {
        //                         console.error(tag, "e: ", e);
        //                     }
        //                 });
        //
        //             } catch (e) {
        //                 console.error(tag, "e: ", e);
        //             }
        //         })

        vorpal
            .delimiter(prompt)
            //.action(app.tick())
            .show();

    } catch (e) {
        console.error(tag, "e: ", e);
        return {};
    }
}

// //TODO
// export function onSetup() {
//     let tag = TAG + " | onSetup | ";
//     try {
//
//     } catch (e) {
//         console.error(tag, "e: ", e);
//         return {};
//     }
// }
//
//
// //TODO
// export function onRestore() {
//     let tag = TAG + " | onRun | ";
//     try {
//
//     } catch (e) {
//         console.error(tag, "e: ", e);
//         return {};
//     }
// }
