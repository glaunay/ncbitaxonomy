import fs = require('fs');
export declare function parseTree(pathDir: string): Promise<Tree>;
export interface searchCrit {
    name?: string;
    id?: string | number;
    directParent?: string | number;
}
export declare class Tree {
    root: TaxNode;
    nodePool: {
        [s: string]: TaxNode;
    };
    constructor();
    lineage(node: TaxNode): TaxNode[];
    isChildOf(maybeChildNode: TaxNode, maybeParentNode: TaxNode): Boolean;
    find(data: searchCrit): TaxNode[];
    nodes(): IterableIterator<TaxNode>;
    getNode(key: string | number): TaxNode;
    addNode(newNode: TaxNode): void;
    parseNodeList(fStream: fs.ReadStream): Promise<number>;
    parseNames(fStream: fs.ReadStream): Promise<number>;
}
interface TaxonomyName {
    taxID: string;
    name: string;
    uniqueName: string;
    otherNames: string;
}
export declare class TaxNode {
    childrenID: string[];
    taxID: string;
    parentID: string;
    rank: string;
    comment: string;
    nameData: TaxonomyName[];
    constructor(rawInput: string);
    toString(): string;
    greet(): string;
    eq(other: TaxNode): Boolean;
    commonNames(): string[];
}
export {};
