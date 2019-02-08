# ncbi taxonomy

A package to perform operations on a NCBI taxonomy tree

## Dependencies

* Get a [NCBI Taxononmy tree dump](ftp://ftp.ncbi.nlm.nih.gov/pub/taxonomy/) as a `taxdump.tar.gz` archive
* Unpack it at a `TAXDUMP_FOLDER` location

## Command Line version

###### Look for taxonomy nodes by names

```sh
node --max-old-space-size=4096 build/tests/main.js -i TAXDUMP_FOLDER --named ".*coccus.*"
```

###### Look for a single taxonomy node by TaxonID

```sh
node --max-old-space-size=4096 build/tests/main.js -i TAXDUMP_FOLDER --key 9606
```

###### Look for taxonomy nodes based on parent node TaxonID

```sh
node --max-old-space-size=4096 build/tests/main.js -i TAXDUMP_FOLDER -p 9605
```

###### Assert if one node is a descendant of another
*a* and *b* are, respectively,  the putative descendant and parent.

```sh
node --max-old-space-size=4096 build/tests/main.js -i data/ncbiTaxonID -a 1301 -b 131567
```

## NPM Package API

##### import the package

```js
import { parseTree } from 'taxonomy';
```

##### Invoke a Taxonomy tree object

You need to supply a path to `TAXDUMP_FOLDER`

```js
parseTree(pathDir:string): Promise<Tree>
```

##### The tree object exposes the following properties:

###### Get the list of ascendants of a node

Returns all list of nodes from provided taxonomic node to the taxonomy root:

```js
lineage(node:TaxNode):TaxNode[]
```

###### Check if a node is descendant of another

```js
isChildOf(mayChildNode:TaxNode, mayParentNode:TaxNode):Boolean
```

###### Search for nodes

Provide string with a regular expression syntax to look for node names matching it. Alternativeley provide a valid taxonID of the node itself or its direct parent

```js
interface searchCrit {
    name? : string,
    id? : string|number,
    directParent? : string|number
}
```

The **find** method will return a possible a zero size array.

```js
find(data:searchCrit):TaxNode[]
```

###### Iterating over all nodes

The **Tree** object is iterable through the **nodes()** method.
The iteration order is the insertion order.

```js
for (let curNode:TaxNode of treeObject) {
// all node will sequentially be accessed here
}

```