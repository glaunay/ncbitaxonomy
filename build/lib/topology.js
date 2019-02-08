"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const readline = require("readline");
const stream = require("stream");
const assert = require("assert");
const util = require("util");
const logger_1 = require("../logger");
function bcpLineSplit(lineContent) {
    return lineContent.slice(0, -2).split('\t|\t');
}
async function parseTree(pathDir) {
    let fI = await openFolderSources(pathDir);
    let myTree = new Tree();
    let nNode = await myTree.parseNodeList(fI.topology);
    logger_1.logger.info(`${nNode} node were defined`);
    await myTree.parseNames(fI.nodeNames);
    //    console.log(fI);
    return myTree;
}
exports.parseTree = parseTree;
function openFolderSources(pathDir) {
    return new Promise((resolve, reject) => {
        fs.readdir(pathDir, (err, files) => {
            let data = {};
            files.forEach(file => {
                //  console.log(file)
                if (file === 'names.dmp')
                    data['nodeNames'] = fs.createReadStream(`${pathDir}/${file}`);
                if (file === 'nodes.dmp')
                    data['topology'] = fs.createReadStream(`${pathDir}/${file}`);
                //console.log(file);
            });
            if (!("nodeNames" in data) || !("topology" in data))
                reject('Mssing');
            resolve(data);
        });
    });
}
class Tree {
    constructor() {
        this.nodePool = {};
    }
    lineage(node) {
        let currNode = node;
        let lineageArray = [];
        while (currNode.taxID !== '1') {
            lineageArray.push(currNode);
            currNode = this.getNode(currNode.parentID);
        }
        lineageArray.push(currNode);
        return lineageArray;
    }
    isChildOf(maybeChildNode, maybeParentNode) {
        let lineage = this.lineage(maybeChildNode);
        for (let node of lineage) {
            if (node.eq(maybeParentNode))
                return true;
        }
        return false;
    }
    // Clunky implentation
    find(data) {
        let hits = [];
        if (data.name) {
            let re = new RegExp('^' + data.name + '$', "g");
            for (let n of this.nodes()) {
                for (let nameDatum of n.nameData) {
                    if (re.test(nameDatum.name) || re.test(nameDatum.uniqueName)) {
                        hits.push(n);
                        break;
                    }
                }
            }
        }
        if (data.id)
            if (data.id in this.nodePool)
                return [this.nodePool[data.id]];
        if (data.directParent) {
            for (let n of this.nodes()) {
                if (n.parentID === data.directParent) {
                    hits.push(n);
                    break;
                }
            }
        }
        return hits;
    }
    *nodes() {
        let c = 0;
        for (let k in this.nodePool) {
            yield this.nodePool[k];
            c++;
        }
        return c;
    }
    // dirty cast
    getNode(key) {
        let k = typeof (key) === 'number' ? parseInt(key) : key;
        return this.nodePool[k];
    }
    addNode(newNode) {
        assert(!this.nodePool.hasOwnProperty(newNode.taxID), `${newNode.taxID} already in ${this.nodePool}`);
        this.nodePool[newNode.taxID] = newNode;
    }
    async parseNodeList(fStream) {
        logger_1.logger.debug("Parsing node topology ...");
        return new Promise((resolve, reject) => {
            let n = 0;
            const rl = readline.createInterface({
                input: fStream,
                output: new stream.Writable()
            });
            rl.on('line', data => {
                // console.log("ADDING THAT  :: " + data)
                this.addNode(new TaxNode(data));
                //console.log('-->' + data);
                /*let buffer:string[] = data.split(/\t|\t/);
                console.log(buffer);*/
                n += 1;
            });
            rl.on('close', () => {
                logger_1.logger.debug("Wiring ascendancy<HERE>");
                for (let child of this.nodes()) {
                    let parent = this.getNode(child.parentID);
                    // console.log(parent);
                    parent.childrenID.push(child.taxID);
                }
                resolve(n);
            });
        });
    }
    async parseNames(fStream) {
        return new Promise((resolve, reject) => {
            const rl = readline.createInterface({
                input: fStream,
                output: new stream.Writable()
            });
            rl.on('line', data => {
                let arr = bcpLineSplit(data);
                let n = this.getNode(arr[0]);
                n.nameData.push({
                    "taxID": arr[0],
                    "name": arr[1],
                    "uniqueName": arr[2],
                    "otherNames": arr[3]
                });
                //this.wire(new TaxNode(data))
                //console.log('-->' + data);
                /*let buffer:string[] = data.split(/\t|\t/);
                console.log(buffer);*/
            });
            rl.on('close', () => {
                resolve(49);
            });
        });
    }
}
exports.Tree = Tree;
class TaxNode {
    constructor(rawInput) {
        /*
        parent: TaxNode;
        children:TaxNode[] = [];
        */
        this.childrenID = [];
        this.nameData = [];
        let arr = bcpLineSplit(rawInput);
        this.taxID = arr[0];
        this.parentID = arr[1];
        this.rank = arr[2];
        this.comment = arr[-1];
    }
    toString() {
        return `${util.inspect(this, { showHidden: false, depth: null })}`;
    }
    greet() {
        return "Hello, "; // + this.greeting;
    }
    eq(other) {
        return this.taxID === other.taxID;
    }
    commonNames() {
        return this.nameData.map(d => d.name);
    }
}
