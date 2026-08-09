class TreeNode{
constructor(val){
this.val=val
this.left=null
this.right=null
this.parent=null
this.color="red"
this.height=1
}
}

let root=null
let values=[]

function enterInsert(e){
if(e.key==="Enter") insertNode()
}

function showMessage(msg){
document.getElementById("message").innerText=msg
}

function updateExplanation(details) {
    if (!details) return;
    document.getElementById("exp-operation").innerText = details.operation || "-";

    const valContainer = document.getElementById("exp-val-container");
    if (details.value !== undefined && details.value !== null && details.value !== "") {
        valContainer.style.display = "block";
        document.getElementById("exp-val-value").innerText = details.value;
    } else {
        valContainer.style.display = "none";
    }

    document.getElementById("explanation").innerText = details.description || "-";

    const extraContainer = document.getElementById("exp-extra-container");
    if (details.extra && Object.keys(details.extra).length > 0) {
        extraContainer.style.display = "block";
        extraContainer.innerHTML = Object.entries(details.extra)
            .map(([k, v]) => `
                <div class="explanation-item" style="margin-top: 8px;">
                    <span class="explanation-label">${k}</span>
                    <span class="explanation-value">${v}</span>
                </div>
            `).join("");
    } else {
        extraContainer.style.display = "none";
    }

    document.getElementById("exp-time").innerText = details.timeComplexity || "-";
    document.getElementById("exp-space").innerText = details.spaceComplexity || "-";
}

/* INSERT */

function insertNode(){

let val=parseInt(document.getElementById("value").value)
let type=document.getElementById("treeType").value

if(isNaN(val)) return

values.push(val)

if(type==="rb")
insertRB(val)

else if(type==="bst")
root=bstInsert(root,val)

else if(type==="binary")
root=binaryInsert(root,val)

else if(type==="avl")
root=avlInsert(root,val)

else if(type==="btree")
root=bstInsert(root,val)

else if(type==="bplus")
root=bstInsert(root,val)

animateInsert()

drawTree()

let typeName = {
    "binary": "Binary Tree",
    "bst": "Binary Search Tree",
    "avl": "AVL Tree",
    "rb": "Red Black Tree",
    "btree": "B Tree",
    "bplus": "B+ Tree"
}[type] || "Tree";

updateExplanation({
    operation: "Insert (" + typeName + ")",
    value: val,
    description: `Inserting value ${val} into the ${typeName}. The node will be positioned according to the properties of this tree topology.`,
    timeComplexity: type === "avl" || type === "rb" ? "O(log n)" : "O(log n) avg, O(n) worst",
    spaceComplexity: "O(log n) recursion stack"
});

document.getElementById("value").value=""
}

/* SEARCH */

function searchNode(){

let val=parseInt(document.getElementById("value").value)

if(isNaN(val)) return

let found=search(root,val)

animateSearch(root,val)

let type = document.getElementById("treeType").value;
let typeName = {
    "binary": "Binary Tree",
    "bst": "Binary Search Tree",
    "avl": "AVL Tree",
    "rb": "Red Black Tree",
    "btree": "B Tree",
    "bplus": "B+ Tree"
}[type] || "Tree";

updateExplanation({
    operation: "Search (" + typeName + ")",
    value: val,
    description: `Searching for value ${val} in the ${typeName}. Recursively traversing left or right subtrees based on element value comparison.`,
    timeComplexity: type === "avl" || type === "rb" ? "O(log n)" : "O(log n) avg, O(n) worst",
    spaceComplexity: "O(1) auxiliary"
});

if(found)
showMessage(val+" element FOUND")
else
showMessage(val+" element NOT FOUND")
}

/* DELETE (FIXED) */

function deleteNode(){

let val=parseInt(document.getElementById("value").value)

if(isNaN(val)) return

let type = document.getElementById("treeType").value;
let typeName = {
    "binary": "Binary Tree",
    "bst": "Binary Search Tree",
    "avl": "AVL Tree",
    "rb": "Red Black Tree",
    "btree": "B Tree",
    "bplus": "B+ Tree"
}[type] || "Tree";

/* check if element exists first */

let found=search(root,val)

if(!found){
showMessage(val+" element NOT FOUND (cannot delete)")
updateExplanation({
    operation: "Delete (" + typeName + ")",
    value: val,
    description: `Cannot delete value ${val} because it does not exist in the ${typeName}.`,
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)"
});
return;
}

/* perform delete */

root=deleteBST(root,val)

values=values.filter(v=>v!==val)

showMessage(val+" element DELETED")
updateExplanation({
    operation: "Delete (" + typeName + ")",
    value: val,
    description: `Locating and deleting node with value ${val} from ${typeName}. If the node has two children, it will be replaced by its in-order successor.`,
    timeComplexity: type === "avl" || type === "rb" ? "O(log n)" : "O(log n) avg, O(n) worst",
    spaceComplexity: "O(log n) recursion stack"
});

drawTree()
}

/* SEARCH FUNCTION */

function search(node,val){

if(!node) return false

if(node.val===val) return true

if(val<node.val)
return search(node.left,val)

return search(node.right,val)
}

/* DELETE FOR BST */

function deleteBST(node,val){

if(node==null) return null

if(val<node.val)
node.left=deleteBST(node.left,val)

else if(val>node.val)
node.right=deleteBST(node.right,val)

else{

if(node.left==null) return node.right
if(node.right==null) return node.left

let min=minValue(node.right)

node.val=min.val

node.right=deleteBST(node.right,min.val)
}

return node
}

function minValue(node){

while(node.left)
node=node.left

return node
}

/* RED BLACK INSERT */

function insertRB(val){

let node=new TreeNode(val)

let y=null
let x=root

while(x!=null){
y=x
if(node.val<x.val)
x=x.left
else
x=x.right
}

node.parent=y

if(y==null)
root=node
else if(node.val<y.val)
y.left=node
else
y.right=node

fixInsert(node)
}

function fixInsert(z){

while(z.parent && z.parent.color==="red"){

let gp=z.parent.parent

if(z.parent===gp.left){

let y=gp.right

if(y && y.color==="red"){

z.parent.color="black"
y.color="black"
gp.color="red"
z=gp

}else{

if(z===z.parent.right){
z=z.parent
rotateLeft(z)
}

z.parent.color="black"
gp.color="red"
rotateRight(gp)

}

}else{

let y=gp.left

if(y && y.color==="red"){

z.parent.color="black"
y.color="black"
gp.color="red"
z=gp

}else{

if(z===z.parent.left){
z=z.parent
rotateRight(z)
}

z.parent.color="black"
gp.color="red"
rotateLeft(gp)

}

}

}

root.color="black"
}

function rotateLeft(x){

let y=x.right

x.right=y.left
if(y.left)
y.left.parent=x

y.parent=x.parent

if(!x.parent)
root=y
else if(x===x.parent.left)
x.parent.left=y
else
x.parent.right=y

y.left=x
x.parent=y
}

function rotateRight(x){

let y=x.left

x.left=y.right
if(y.right)
y.right.parent=x

y.parent=x.parent

if(!x.parent)
root=y
else if(x===x.parent.right)
x.parent.right=y
else
x.parent.left=y

y.right=x
x.parent=y
}

/* BST */

function bstInsert(node,val){

if(node==null){
let n=new TreeNode(val)
n.color="black"
return n
}

if(val<node.val)
node.left=bstInsert(node.left,val)
else
node.right=bstInsert(node.right,val)

return node
}

/* BINARY TREE */

function binaryInsert(node,val){

let newNode=new TreeNode(val)
newNode.color="black"

if(node==null) return newNode

let q=[node]

while(q.length){

let t=q.shift()

if(!t.left){
t.left=newNode
return node
}else q.push(t.left)

if(!t.right){
t.right=newNode
return node
}else q.push(t.right)

}
}

/* AVL */

function height(n){return n?n.height:0}

function updateHeight(n){
n.height=1+Math.max(height(n.left),height(n.right))
}

function balanceFactor(n){
return height(n.left)-height(n.right)
}

function rotateRightAVL(y){

let x=y.left
let t=x.right

x.right=y
y.left=t

updateHeight(y)
updateHeight(x)

return x
}

function rotateLeftAVL(x){

let y=x.right
let t=y.left

y.left=x
x.right=t

updateHeight(x)
updateHeight(y)

return y
}

function avlInsert(node,val){

if(!node){
let n=new TreeNode(val)
n.color="black"
return n
}

if(val<node.val)
node.left=avlInsert(node.left,val)
else
node.right=avlInsert(node.right,val)

updateHeight(node)

let b=balanceFactor(node)

if(b>1 && val<node.left.val)
return rotateRightAVL(node)

if(b<-1 && val>node.right.val)
return rotateLeftAVL(node)

if(b>1 && val>node.left.val){
node.left=rotateLeftAVL(node.left)
return rotateRightAVL(node)
}

if(b<-1 && val<node.right.val){
node.right=rotateRightAVL(node.right)
return rotateLeftAVL(node)
}

return node
}

/* DRAW TREE */

function resetTree(){
root=null
values=[]
drawTree()
showMessage("")
updateExplanation({
    operation: "Reset",
    description: "Tree cleared and reset to empty. Root pointer set to NULL.",
    timeComplexity: "O(1)",
    spaceComplexity: "O(1)"
});
}

function drawTree(){

let svg=document.getElementById("treeCanvas")
svg.innerHTML=""

if(!root) return

drawNode(root,350,70,150)
}

function drawNode(node,x,y,offset){

if(!node) return

let svg=document.getElementById("treeCanvas")

if(node.left){

let line=document.createElementNS("http://www.w3.org/2000/svg","line")

line.setAttribute("x1",x)
line.setAttribute("y1",y)
line.setAttribute("x2",x-offset)
line.setAttribute("y2",y+100)
line.setAttribute("stroke","#555")

svg.appendChild(line)

drawNode(node.left,x-offset,y+100,offset/2)
}

if(node.right){

let line=document.createElementNS("http://www.w3.org/2000/svg","line")

line.setAttribute("x1",x)
line.setAttribute("y1",y)
line.setAttribute("x2",x+offset)
line.setAttribute("y2",y+100)
line.setAttribute("stroke","#555")

svg.appendChild(line)

drawNode(node.right,x+offset,y+100,offset/2)
}

let circle=document.createElementNS("http://www.w3.org/2000/svg","circle")

circle.setAttribute("cx",x)
circle.setAttribute("cy",y)
circle.setAttribute("r",25)

circle.setAttribute("fill",node.color==="red"?"#ef4444":"#000000")

circle.setAttribute("stroke","white")
circle.setAttribute("stroke-width","3")

circle.setAttribute("class","treeNode")

svg.appendChild(circle)

let text=document.createElementNS("http://www.w3.org/2000/svg","text")

text.setAttribute("x",x)
text.setAttribute("y",y+5)
text.setAttribute("text-anchor","middle")
text.setAttribute("fill","white")

text.textContent=node.val

svg.appendChild(text)

}

/* ANIMATION */

function animateInsert(){

let nodes=document.querySelectorAll(".treeNode")

nodes.forEach(n=>{
n.style.transition="0.4s"
n.style.transform="scale(1.3)"
setTimeout(()=>n.style.transform="scale(1)",400)
})
}

function animateSearch(node,val){

if(!node) return

highlight(node.val)

setTimeout(()=>{

if(val===node.val){
highlight(node.val,"green")
return
}

if(val<node.val)
animateSearch(node.left,val)
else
animateSearch(node.right,val)

},600)
}

function highlight(value,color="yellow"){

let svg=document.getElementById("treeCanvas")

let texts=svg.querySelectorAll("text")

texts.forEach(t=>{

if(parseInt(t.textContent)===value){

let circle=t.previousSibling

circle.setAttribute("fill",color)

setTimeout(()=>{
circle.setAttribute("fill","#000")
},800)

}

})

}