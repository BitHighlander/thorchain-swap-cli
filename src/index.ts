#!/usr/bin/env node
"use strict";
/*
        Pioneer CLI
            -Highlander

    Exploring New Worlds!

 */
require("dotenv").config();
require("dotenv").config({path: "./../.env"});
require("dotenv").config({path: "../../.env"});
require("dotenv").config({path: "../../../.env"});
require("dotenv").config({path: "../../../.env"});
require("dotenv").config({path: "../../../../.env"});


const TAG = " | App | ";
//cli tools
const inquirer = require("inquirer");

//primary app
import {
    showWelcome
} from './modules/views'
import {
    onStart,
    onRun
} from './modules/app'

//Subcommand patch
const program = require( './modules/commander-patch' );
const log = require("loggerdog-client")();

// must be before .parse()
program.on('--help', () => {
    showWelcome()
});

/*
    onStart
        If no commands, assume --it
 */
log.info("args",process.argv)

const onInteractiveTerminal = async function(){
    let tag = TAG + " | onInteractiveTerminal | "
    try{
        log.info("Starting Interactive Terminal")
        //start it mode
        showWelcome()

        let successStart = await onStart()
        log.info(tag,"successStart: ",successStart)
        //display dashboard

        //onRun
        onRun()

    }catch(e){
        log.error("Terminal Exit: ",e)
        process.exit(2)
    }
}

if(process.argv.length === 2){
    onInteractiveTerminal()
} else {
    program.parse( process.argv );
}


















