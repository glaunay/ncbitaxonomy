/// <reference types="node" />

declare module 'ncbiTaxonomy' {
    import fs = require ('fs');

    export interface searchCrit {
        name? : string,
        id? : string|number,
        directParent? : string|number
    }

    export class Tree {
        root: TaxNode;
        nodePool : { [s: string]: TaxNode };

        constructor();
        lineage(node:TaxNode) : TaxNode[];
        isChildOf(maybeChildNode:TaxNode, maybeParentNode:TaxNode):Boolean;
        find(data:searchCrit):TaxNode[];
        nodes(): IterableIterator<TaxNode>;
        getNode(key:string|number):TaxNode;
        addNode(newNode:TaxNode):void;
        parseNodeList(fStream : fs.ReadStream):Promise<number>;
        parseNames(fStream : fs.ReadStream):Promise<number>;
    }
    interface TaxonomyName {
        taxID:string, //                                 -- the id of node associated with this name
        name:string,//                                -- name itself
        uniqueName:string,//                             -- the unique variant of this name if name not unique
        otherNames:string//
    }
    export class TaxNode {
        childrenID:string[];
        taxID:string;
        parentID:string;
        rank : string;
        comment : string;
        nameData:TaxonomyName[];
    
        constructor(rawInput: string);
        toString() : string;
        eq(other:TaxNode):Boolean;
        
        commonNames():string[];
    }
}
