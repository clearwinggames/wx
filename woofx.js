/*
  This is a custom js library providing next-level functionality for the base woofjs framework
  This is free use and free to copy and modify to use for something else
  It's meant to provide inherent support for scenes and world-scrolling / collision, (+gravity/acceleration due to gravity),
  as well as attaching scripts to woof objects to be run periodically (customizable).  Also UI buttons for easy user interfaces
  It's for 2D games only as WoofJS only supports 2D games.  It's also unfinished and offered without warranty, use at your own risk.
  It should (potentially) be helpful/useful for both sidescroller/platformer style games and also overhead perspective like rpgs
  ---
  Created in 2021 by Kevin Phillips, not affiliated (in this case) with any particular organization.
  ---
*/

var woofStack = [];

var worldObjects = [];

var sceneStack = [];
var targetScene = 0;

var worldMover = null;

function activeScene() {
    return sceneStack[targetScene];
}
function changeScene(newSceneNumber) {
    activeScene().worldStack.forEach(wo => { wo.hide(); });
   targetScene = newSceneNumber;
    activeScene().worldStack.forEach(wo => { wo.show(); });
}
function collideAnySets(newCoords) {
    if (sceneStack.length == 0) {
        worldObjects.forEach(wo => {        
            if (wo.isCorporeal == true) {
                if (wo.touching(newCoords)) {
                    return true;
                }
            }
        });
    }
    else {
      activeScene().worldStack.forEach(wo => {
            if (wo.isCorporeal == true) {
                if (wo.touching(newCoords)) {
                    return true;
                }
            }
      });
    }
}
function moveWorld(yamt, xamt) {
    if (collideAnySets(worldMover.project(-yamt, -xamt)))
       return;
        
    if (sceneStack.length == 0) {
        worldObjects.forEach(wo => {        
            wo.x += xamt;
            wo.y += yamt;
        });
    }
    else {
      activeScene().worldStack.forEach(wo => {
         wo.x += xamt;
         wo.y += yamt;
      });
    }
}

Image.prototype.selfCopy = function () {
    let string = JSON.stringify(this);
    return JSON.parse(string);
};
Image.prototype.project = function (x, y) {
    let copy = this.selfCopy();
    copy.x += x;
    copy.y += y;
    return copy;
};
Image.prototype.moveUpBy = function(amt) {
    if (worldMover == this) {
        moveWorld(-amt, 0);
    } 
    else {
        this.y += amt;  
    }
};
Image.prototype.moveDownBy = function(amt) {
    if (worldMover == this) {
        moveWorld(amt, 0);        
    } 
    else {
        this.y -= amt;  
    }
};
Image.prototype.moveLeftBy = function(amt) {
    if (worldMover == this) {
        moveWorld(0, amt);
    }
    else {
        this.x -= amt;  
    }
};
Image.prototype.moveRightBy = function(amt) {
    if (worldMover == this) {
        moveWorld(0, -amt);
    }
    else {
        this.x += amt;  
    }
};
Image.prototype.moveUpFive = function () {
    this.moveUpBy(5);
};
Image.prototype.moveLeftFive = function () { 
    this.moveLeftBy(5);
};
Image.prototype.moveDownFive = function () {
    this.moveDownBy(5);
};
Image.prototype.moveRightFive = function () {
    this.moveRightBy(5);
};
Image.prototype.gravityTick = function() { 
    
    let futurePosition = this.project(0, this.momentumY);

    if (futurePosition.collideAny(worldObjects)) {
         this.momentumY = 0;
    }
    else 
    {    
        this.moveDownBy(this.momentumY); // ??
        //this.y -= this.momentumY;
        this.momentumY += this.accelerationDueToGravity;
    }
};
Image.prototype.assignGravity = function() {
  var grav = new scriptBlock(this, [new scriptInstance('actor.gravityTick()', 5)], 15, true).execute();  
};

Image.prototype.isCorporeal = false;

Image.prototype.makeWorldObject = function() {
  this.isCorporeal = true;
  if (sceneStack.length == 0) 
      worldObjects.push(this);  
  else
      activeScene().worldStack.push(this);
};
Image.prototype.makeWorldBG = function() {
  if (sceneStack.length == 0) 
      worldObjects.push(this);  
  else
      activeScene().worldStack.push(this);
};
Image.prototype.makeWorldMover = function() {
    worldMover = this;
    this.isCorporeal = true;
};

Image.prototype.momentumY = 0;
Image.prototype.accelerationDueToGravity = 0.1;
Image.prototype.moveSpeed = 4;

function woof() {
    alert('Woof!');
}
function attachFn(target, fn) {
    target.onMouseDown(fn);
}
function loaded() {
    //woof();
}
function setupSprites(sprites) {
    for (let i = 0; i < sprites.length; i++) {
        sprites[i].script = new scriptBlock(sprites[i], [], 30, true);
    }
}

function collideAny(player, set) {
    for (var i = 0; i < set.length; i++) {
        if (player.touching(set[i])) {
            function allSprites() {

            }
            return true;
        }
    }
    return false;
}
function clickButton(caption, x, y, w, h, onClick)
{
    button = {
        delete: function() {
            this.button.rectangle.delete();
            this.button.text.delete();
        },
        rectangle: new Rectangle({
            width: w,
            height: h,
            x: x,
            y: y,
            color: 'silver'
        }),
        text: new Text({
            text: caption,
            size: (w / caption.length) + 2,
            color: 'black',
            x: x,
            y: y
        })        
    };

    button.rectangle.onMouseDown(() => onClick());

    woofStack.push(button);

    return button;
}
function scriptInstance(statement, iterationCount) 
{    
    this.code = statement;
    this.duration = iterationCount;
    this.currentIteration = 0;
    
    this.externalExecute = function(loop, actor) 
    {
        eval(this.code);
        
        if (loop == true) {
            setTimeout(() => {
                this.externalExecute(loop, actor);       
            }, this.duration);
        }
    };
    
    this.execute = function (actor) {
        
        var finished = false;

        this.currentIteration++;

        eval(this.code);

        if (this.duration == this.currentIteration) {
            this.currentIteration = 0;
            finished = true;
        }

        return finished;
    };
}
function scriptBlock(actor, arrayOfStatements, rate, loop) {
    this.target = actor;
    this.targetIndex = 0;
    this.shouldLoop = loop;
    this.statements = arrayOfStatements;
    this.execRate = rate;
    this.currentStatement = function () {
        return this.statements[this.targetIndex];
    };
    this.startExecution = function () {
        this.execute();
    };
    this.execute = function () {
        let me = this;
        if (this.executeCurrent() == true) {
            setTimeout(function () { me.execute(); }, this.execRate);
        }
    }
    this.executeCurrent = function () {
        var hasMore = true;
        if (this.statements.length > this.targetIndex) {
            let current = this.currentStatement();
            let finished = current.execute(this.target);
            if (finished == true)
                this.targetIndex++;
        }
        else if (this.shouldLoop == true) {
            this.targetIndex = 0;
        }
        else {
            hasMore = false;
        }
        return hasMore;
    }
}
scriptBlock.prototype.executeAgainst = function(player) {
    this.target = player;
    this.startExecution();
};
function Scene() {
    
    this.worldStack = [];
    if (sceneStack.length == 0) {
        this.worldStack = worldObjects;
    }
    sceneStack.push(this);    
    changeScene(sceneStack.length - 1);
};
