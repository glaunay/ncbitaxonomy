"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const program = require("commander");
const logger_1 = require("../logger");
const index_1 = require("../index");
/*

    CLI version of the taxonomy tree service

*/
program
    .version('0.1.0')
    .option('-i, --input      [dirPath]', 'Taxonomy dump folder')
    .option('-n, --named       [regExp]', 'Find Taxonomy node(s) based on name')
    .option('-k, --key         [regExp]', 'Find One Taxonomy node based on its TaxonID')
    .option('-p, --parent      [number]', 'Find Taxonomy node(s) based on parent TaxonID')
    .option('-a, --maybeChild  [number]', 'One valid Taxonomy identifier for child in child, parent check')
    .option('-b, --maybeParent [number]', 'One valid Taxonomy identifier for parent in child, parent check')
    .option('-v, --verbosity [logLevel]', 'Set log level', logger_1.setLogLevel, 'info')
    .parse(process.argv);
if (!program.input)
    throw ('Please provide and input folder of *.aln files');
index_1.parseTree(program.input).then((treeObj) => {
    //console.log(treeObj.getNode(2));    
    let nodes = [];
    if (program.named != undefined) {
        logger_1.logger.info(`Looking for nodes named ${program.named}`);
        nodes = treeObj.find({ "name": program.named });
        logger_1.logger.info(`${program.named} returned ${nodes.length} Taxons`);
    }
    if (program.parent != undefined) {
        logger_1.logger.info(`Looking for direct children of ${program.parent}`);
        nodes = treeObj.find({ "directParent": program.parent });
        logger_1.logger.info(`${program.parent} returned ${nodes.length} Taxons`);
        logger_1.logger.info(`${nodes[0]}`);
    }
    if (program.key != undefined) {
        logger_1.logger.info(`Looking for node w/ ID ${program.key}`);
        nodes = treeObj.find({ "id": program.key });
        logger_1.logger.info(`${program.key} returned ${nodes.length} Taxons`);
        logger_1.logger.info(`${nodes[0]}`);
    }
    if (nodes.length > 0)
        logger_1.logger.info(`${util.inspect(nodes, { showHidden: false, depth: null })}`);
    if (program.maybeChild != undefined && program.maybeParent != undefined) {
        let parentNode = treeObj.getNode(program.maybeParent);
        let childNode = treeObj.getNode(program.maybeChild);
        let test = treeObj.lineage(childNode);
        let status = treeObj.isChildOf(childNode, parentNode) ? 'IS CHILD' : 'NOT A CHILD';
        logger_1.logger.info(`${status} FROM : ${childNode}\n---\nTO : ${parentNode}\####\n${test}`);
    }
});
