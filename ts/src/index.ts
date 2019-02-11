import fs = require('fs');
import readline = require('readline');
import stream = require('stream');
import assert = require('assert');
import util = require('util');
import logger = require('winston');

function bcpLineSplit(lineContent:string) : string[] {
    return lineContent.slice(0, -2).split('\t|\t');
}


export async function parseTree(pathDir:string): Promise<Tree>  {
    let fI = await openFolderSources(pathDir);
    
    let myTree = new Tree();
    let nNode = await myTree.parseNodeList(fI.topology);
  
    logger.info(`${nNode} node were defined`);

    await myTree.parseNames(fI.nodeNames);


//    console.log(fI);



    return myTree;
}

function openFolderSources(pathDir:string): Promise< { [s: string]: fs.ReadStream; }> {
    return new Promise( (resolve, reject) => {
        fs.readdir(pathDir, (err, files) => {
            let data : { [s: string]: fs.ReadStream; } = {};
            files.forEach(file => {
              //  console.log(file)
                if(file === 'names.dmp')
                    data['nodeNames'] = fs.createReadStream(`${pathDir}/${file}`);
                if(file === 'nodes.dmp')
                    data['topology'] = fs.createReadStream(`${pathDir}/${file}`);
                //console.log(file);
            });
            if (! ("nodeNames" in data) || ! ("topology" in data))
                reject('Mssing');

            resolve(data);
        });
    });
}


/*
Taxonomy names file (names.dmp):
        tax_id                                  -- the id of node associated with this name
        name_txt                                -- name itself
        unique name                             -- the unique variant of this name if name not unique
        name class                              -- (synonym, common name, ...)
*/

export interface searchCrit {
    name? : string,
    id? : string|number,
    directParent? : string|number
}

export class Tree {
    root: TaxNode;
    nodePool : { [s: string]: TaxNode } = {};

    constructor() {
    }
    lineage(node:TaxNode) : TaxNode[] {
        let currNode:TaxNode = node;
        let lineageArray:TaxNode[] = [];
        while (currNode.taxID !== '1') {
            lineageArray.push(currNode);
            currNode = this.getNode(currNode.parentID);
        }
        lineageArray.push(currNode);
        return lineageArray;
    }
    isChildOf(maybeChildNode:TaxNode, maybeParentNode:TaxNode):Boolean {
        let lineage = this.lineage(maybeChildNode);
        for (let node of lineage) {
            if ( node.eq(maybeParentNode) )
                return true;
        }
        return false;
    }

    // Clunky implentation
    find(data:searchCrit):TaxNode[] {
        let hits:TaxNode[] = [];
        if (data.name) {
            let re = new RegExp('^' + data.name + '$', "g");
            for ( let n of this.nodes() ) {
                for (let nameDatum of n.nameData) {
                    if( re.test(nameDatum.name) || re.test(nameDatum.uniqueName) ) {
                        hits.push(n);                       
                        break;
                    }
                }
            }
        }

        if (data.id) 
            if (data.id in this.nodePool)
                return [ this.nodePool[data.id] ];

        if(data.directParent) {
            for ( let n of this.nodes() ) {
                if( n.parentID === data.directParent) {
                    hits.push(n);                       
                    break;
                }
            }
        }

        return hits;
    }

    *nodes(): IterableIterator<TaxNode> {
        let c = 0;
        for (let k in this.nodePool) {
            yield this.nodePool[k];
            c++;
        }
        return c;
    }

// dirty cast
    getNode(key:string|number):TaxNode {
        let k = typeof (key) === 'number' ? parseInt(<string><any>key) : key;
        return this.nodePool[k];
    }
    
    addNode(newNode:TaxNode):void {
        assert (! this.nodePool.hasOwnProperty(newNode.taxID), `${newNode.taxID} already in ${this.nodePool}`)
        
        this.nodePool[newNode.taxID] = newNode;    
    }

    async parseNodeList(fStream : fs.ReadStream):Promise<number>{
        logger.debug("Parsing node topology ...");
        return new Promise ((resolve, reject) => {
            let n:number =  0;
            const rl = readline.createInterface({
                input: fStream,
                output: new stream.Writable()
            });

            rl.on('line', data => {
               // console.log("ADDING THAT  :: " + data)
                this.addNode(new TaxNode(data))
            //console.log('-->' + data);
            /*let buffer:string[] = data.split(/\t|\t/);
            console.log(buffer);*/
                n+=1;
            });
            rl.on('close',()=>{      
                logger.debug("Wiring ascendancy<HERE>");
                for (let child of this.nodes()) {
                    let parent = this.getNode(child.parentID);
                   // console.log(parent);
                    parent.childrenID.push(child.taxID);
                }
                resolve(n);
            });
        });
    }

    async parseNames(fStream : fs.ReadStream):Promise<number>{
        return new Promise ((resolve, reject) => {
            const rl = readline.createInterface({
                input: fStream,
                output: new stream.Writable()
            });

            rl.on('line', data => {
                let arr = bcpLineSplit(data);
                let  n = this.getNode(arr[0]);
                n.nameData.push({
                    "taxID"      : arr[0],
                    "name"       : arr[1],
                    "uniqueName" : arr[2],
                    "otherNames" : arr[3]
                });

                //this.wire(new TaxNode(data))
            //console.log('-->' + data);
            /*let buffer:string[] = data.split(/\t|\t/);
            console.log(buffer);*/
            });
            rl.on('close',()=>{
                resolve(49);
            });
        });
    }
}

interface TaxonomyName {
        taxID:string, //                                 -- the id of node associated with this name
        name:string,//                                -- name itself
        uniqueName:string,//                             -- the unique variant of this name if name not unique
        otherNames:string//
}
export class TaxNode {
    /*
    parent: TaxNode;
    children:TaxNode[] = [];
    */
    childrenID:string[] = [];
    taxID:string;
    parentID:string;
    rank : string;
    comment : string;
    nameData:TaxonomyName[] = [];
    
    constructor(rawInput: string) {
        let arr = bcpLineSplit(rawInput);
        this.taxID      = arr[0];
        this.parentID   = arr[1];
        this.rank = arr[2];
        this.comment = arr[-1];
    }
    toString() : string  {
        return `${util.inspect(this, {showHidden: false, depth: null})}`;
    }
    greet() {
        return "Hello, ";// + this.greeting;
    }
    eq(other:TaxNode):Boolean {
        return this.taxID === other.taxID;
    }
    commonNames():string[]{
        return this.nameData.map(d=>d.name);
    }

}
