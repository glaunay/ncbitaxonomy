import util = require('util');
import program = require('commander');

import {logger, setLogLevel} from '../logger';
import fs = require('fs');
import { parseTree, Tree } from '../index';

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
  .option('-v, --verbosity [logLevel]', 'Set log level', setLogLevel, 'info')
.parse(process.argv)

if (!program.input)
    throw ('Please provide and input folder of *.aln files');


parseTree(program.input).then( (treeObj:Tree) => {
    //console.log(treeObj.getNode(2));    
    let nodes = [];
    if (program.named != undefined) {
        logger.info(`Looking for nodes named ${program.named}`);
        nodes = treeObj.find({"name": program.named});
        logger.info(`${program.named} returned ${nodes.length} Taxons`);
    }

    if (program.parent != undefined) {
        logger.info(`Looking for direct children of ${program.parent}`);
        nodes = treeObj.find({"directParent": program.parent});
        logger.info(`${program.parent} returned ${nodes.length} Taxons`);
        logger.info(`${nodes[0]}`);
    }

    if (program.key != undefined) {
        logger.info(`Looking for node w/ ID ${program.key}`);
        nodes = treeObj.find({"id": program.key});
        logger.info(`${program.key} returned ${nodes.length} Taxons`);
        logger.info(`${nodes[0]}`);
    }

    if (nodes.length > 0) logger.info(`${util.inspect(nodes, {showHidden: false, depth: null})}`);

    if (program.maybeChild != undefined && program.maybeParent != undefined) {
        let parentNode = treeObj.getNode(program.maybeParent); 
        let childNode = treeObj.getNode(program.maybeChild); 
        let test = treeObj.lineage(childNode);
        let status = treeObj.isChildOf(childNode, parentNode) ? 'IS CHILD' : 'NOT A CHILD';
        logger.info(`${status} FROM : ${childNode}\n---\nTO : ${parentNode}\####\n${test}`);
    }

} );





